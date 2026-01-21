// main.js  (keep this filename)

import { Client, Users, Databases, Query } from 'node-appwrite';

export default async function ({ req, res, log, error }) {
  // Initialize the Appwrite client
  const client = new Client();

  client
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_FUNCTION_API_KEY);

  const users = new Users(client);
  const databases = new Databases(client);

  const databaseId = process.env.APPWRITE_DATABASE_ID;
  const userTransactionsCollectionId = process.env.APPWRITE_USER_TRANSACTIONS_COLLECTION_ID;

  if (!databaseId) {
    error('Missing required environment variable: APPWRITE_DATABASE_ID');
    return res.json({
      success: false,
      error: 'Missing required environment variable'
    });
  }

  try {
    log('Starting credit expiry check...');

    await updateUserBillingCycles(users, log, error);

    if (userTransactionsCollectionId) {
      await updateUserTransactionRecords(
        users,
        databases,
        databaseId,
        userTransactionsCollectionId,
        log,
        error
      );
    }

    log('Credit expiry check completed successfully');
    return res.json({
      success: true,
      message: 'Credit expiry check completed - expired credits flushed from user accounts'
    });
  } catch (err) {
    error(`Error during credit expiry check: ${err.message}`);
    return res.json({
      success: false,
      error: err.message
    });
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Your helper functions stay exactly the same
// ──────────────────────────────────────────────────────────────────────────────

async function updateUserBillingCycles(users, log, error) {
  try {
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const userList = await users.list([
        Query.offset(offset),
        Query.limit(limit)
      ]);

      for (const user of userList.users) {
        try {
          const prefs = user.prefs || {};

          if (prefs.billingCycleEnd) {
            const billingCycleEnd = new Date(prefs.billingCycleEnd);
            const now = new Date();

            if (billingCycleEnd < now) {
              log(`User ${user.$id} billing cycle expired on ${billingCycleEnd}. Checking if update needed...`);

              const hasActiveTransactions = checkForActiveTransactions(prefs.transactions || []);

              if (!hasActiveTransactions) {
                await users.updatePrefs(user.$id, {
                  ...prefs,
                  isBillingEnded: true
                });

                log(`Updated user ${user.$id} preferences for expired billing cycle`);
              }
            }
          }
        } catch (userErr) {
          error(`Error processing user ${user.$id}: ${userErr.message}`);
        }
      }

      hasMore = userList.users.length === limit;
      if (hasMore) offset += limit;
    }

    log('Completed processing user billing cycles');
  } catch (err) {
    error(`Error updating user billing cycles: ${err.message}`);
    throw err;
  }
}

function checkForActiveTransactions(transactions) {
  const now = new Date();

  for (const transaction of transactions) {
    if (transaction.expiresAt) {
      const expiresAt = new Date(transaction.expiresAt);
      if (expiresAt > now && transaction.status !== 'expired') {
        return true;
      }
    } else {
      return true; // lifetime
    }
  }

  return false;
}

async function checkAndUpdateUserBillingStatus(users, databases, databaseId, collectionId, userId, log, error) {
  try {
    // Get all transactions for this user to check active status
    const userTransactions = await databases.listDocuments(databaseId, collectionId, [
      Query.equal('userId', userId),
      Query.limit(100)
    ]);

    const hasActiveTransactions = userTransactions.documents.some(transaction =>
      transaction.status !== 'expired' &&
      (!transaction.expiresAt || new Date(transaction.expiresAt) > new Date())
    );

    const user = await users.get(userId);
    const prefs = user.prefs || {};
    const updatesNeeded = {};

    // Update billing ended status
    if (!hasActiveTransactions && !prefs.isBillingEnded) {
      updatesNeeded.isBillingEnded = true;
      updatesNeeded.billingCycleExpired = true;
      log(`Setting isBillingEnded to true for user ${userId}`);
    } else if (hasActiveTransactions && (prefs.isBillingEnded || prefs.billingCycleExpired)) {
      updatesNeeded.isBillingEnded = false;
      updatesNeeded.billingCycleExpired = false;
      log(`Resetting isBillingEnded to false for user ${userId} (active transactions found)`);
    }

    if (Object.keys(updatesNeeded).length > 0) {
      await users.updatePrefs(userId, {
        ...prefs,
        ...updatesNeeded
      });
    }
  } catch (err) {
    error(`Error updating billing status for user ${userId}: ${err.message}`);
  }
}

async function deductCreditsFromUser(users, userId, creditsToDeduct, log, error) {
  try {
    const user = await users.get(userId);
    const prefs = user.prefs || {};

    const currentTotal = Number(prefs.creditsTotal) || 0;
    const currentUsed = Number(prefs.creditsUsed) || 0;

    // We remove the credits from both total and used to maintain the relative balance (FIFO assumption)
    // E.g. If user has 100k total and used 50k, and the 100k pack expires:
    // New total = 0, New used = 0 (Total available 0). Correct.
    // E.g. If user has 300k total and used 50k, and a 100k pack expires:
    // New total = 200k, New used = 0 (Total available 200k). Correct.
    const newTotal = Math.max(0, currentTotal - creditsToDeduct);
    const newUsed = Math.max(0, currentUsed - creditsToDeduct);

    await users.updatePrefs(userId, {
      ...prefs,
      creditsTotal: newTotal,
      creditsUsed: newUsed
    });

    log(`Removed ${creditsToDeduct} expired credits from user ${userId}. New total: ${newTotal}, New used: ${newUsed}`);
  } catch (err) {
    error(`Error deducting credits for user ${userId}: ${err.message}`);
  }
}

async function updateUserTransactionRecords(users, databases, databaseId, collectionId, log, error) {
  try {
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const transactionList = await databases.listDocuments(databaseId, collectionId, [
        Query.offset(offset),
        Query.limit(limit)
      ]);

      for (const transaction of transactionList.documents) {
        try {
          if (transaction.expiresAt) {
            const expiresAt = new Date(transaction.expiresAt);
            const now = new Date();

            if (expiresAt < now && transaction.status !== 'expired') {
              log(`User transaction ${transaction.$id} (ID: ${transaction.transactionId}) expired on ${expiresAt}. Updating status to expired...`);

              // 1. Update status to prevent double processing
              await databases.updateDocument(databaseId, collectionId, transaction.$id, {
                status: 'expired'
              });

              log(`Updated user transaction ${transaction.transactionId} status to expired`);

              // 2. Subtract credits associated with THIS transaction only
              if (transaction.credits) {
                await deductCreditsFromUser(users, transaction.userId, Number(transaction.credits), log, error);
              }

              // 3. Check and update the general billing status (isBillingEnded flag)
              await checkAndUpdateUserBillingStatus(users, databases, databaseId, collectionId, transaction.userId, log, error);
            }
          }
        } catch (transErr) {
          error(`Error processing user transaction ${transaction.$id}: ${transErr.message}`);
        }
      }

      hasMore = transactionList.documents.length === limit;
      if (hasMore) offset += limit;
    }

    log('Completed processing user transactions in user_transactions collection');
  } catch (err) {
    error(`Error updating expired user transactions: ${err.message}`);
    throw err;
  }
}
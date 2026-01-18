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
      message: 'Credit expiry check completed'
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
                  billingCycleExpired: true
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

async function updateUserTransactionRecords(databases, databaseId, collectionId, log, error) {
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

              await databases.updateDocument(databaseId, collectionId, transaction.$id, {
                ...transaction,
                status: 'expired'
              });

              log(`Updated user transaction ${transaction.transactionId} status to expired`);
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
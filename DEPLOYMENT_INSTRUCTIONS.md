# Deployment Instructions for Check Credits Expiry Function

This document provides step-by-step instructions for deploying the Appwrite function that checks and updates expired credits.

## Function Overview

This function runs daily to:
- Check user preferences for expired billing cycles
- Update transaction records that have expired
- Update user transaction records that have expired
- Ensure compliance with the 30-day credit validity rule

## Prerequisites

1. Appwrite Console access with functions management permissions
2. Server API key with appropriate scopes (functions.write, databases.read/write, users.read/write)
3. Database and collection IDs for your Appwrite project

## Manual Deployment via Appwrite Console

### Step 1: Create the Function

1. Go to your Appwrite Console
2. Navigate to **Functions**
3. Click **Create Function**
4. Use these settings:
   - **Name**: Check Credits Expiry
   - **Runtime**: Node.js 18.0
   - **Execute**: Anyone (for scheduled execution)
   - **Schedule**: `0 0 * * *` (daily at midnight)
   - **Timeout**: 900 seconds (15 minutes)
   - **Enabled**: Yes
   - **Logging**: Yes

### Step 2: Add Function Code

Copy and paste the following code into the function editor:

```javascript
module.exports = async ({ req, res, log, error }) => {
  const sdk = require('node-appwrite');

  // Initialize the Appwrite client
  const client = new sdk.Client();

  client
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_FUNCTION_API_KEY);

  const users = new sdk.Users(client);
  const databases = new sdk.Databases(client);

  const databaseId = process.env.APPWRITE_DATABASE_ID;
  const transactionsCollectionId = process.env.APPWRITE_TRANSACTIONS_COLLECTION_ID;
  const userTransactionsCollectionId = process.env.APPWRITE_USER_TRANSACTIONS_COLLECTION_ID;

  if (!databaseId) {
    error('Missing required environment variable: APPWRITE_DATABASE_ID');
    return res.json({ success: false, error: 'Missing required environment variable' });
  }

  try {
    log('Starting credit expiry check...');
    
    // Method 1: Update user preferences for expired billing cycles
    await updateUserBillingCycles(users, log, error);
    
    // Method 2: Update individual transaction records that have expired
    if (transactionsCollectionId) {
      await updateExpiredTransactions(databases, databaseId, transactionsCollectionId, log, error);
    }
    
    // Method 3: Update user transaction records that have expired (if separate collection exists)
    if (userTransactionsCollectionId) {
      await updateUserTransactionRecords(databases, databaseId, userTransactionsCollectionId, log, error);
    }
    
    log('Credit expiry check completed successfully');
    return res.json({ success: true, message: 'Credit expiry check completed' });
  } catch (err) {
    error(`Error during credit expiry check: ${err.message}`);
    return res.json({ success: false, error: err.message });
  }
};

// Update user preferences where billing cycle has expired
async function updateUserBillingCycles(users, log, error) {
  try {
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const userList = await users.list([
        sdk.Query.offset(offset),
        sdk.Query.limit(limit)
      ]);

      for (const user of userList.users) {
        try {
          const prefs = user.prefs || {};
          
          // Check if billing cycle has expired
          if (prefs.billingCycleEnd) {
            const billingCycleEnd = new Date(prefs.billingCycleEnd);
            const now = new Date();
            
            if (billingCycleEnd < now) {
              log(`User ${user.$id} billing cycle expired on ${billingCycleEnd}. Checking if update needed...`);
              
              // Check if user still has active transactions
              const hasActiveTransactions = checkForActiveTransactions(prefs.transactions || []);
              
              // If no active transactions and billing cycle is expired, mark appropriately
              if (!hasActiveTransactions) {
                // Update user preferences to reflect expired status
                await users.updatePrefs(user.$id, {
                  ...prefs,
                  // Add an indicator that the main billing cycle has expired
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

      // Check if there are more users to process
      if (userList.users.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    log('Completed processing user billing cycles');
  } catch (err) {
    error(`Error updating user billing cycles: ${err.message}`);
    throw err;
  }
}

// Helper function to check if user has any active transactions
function checkForActiveTransactions(transactions) {
  const now = new Date();
  
  for (const transaction of transactions) {
    if (transaction.expiresAt) {
      const expiresAt = new Date(transaction.expiresAt);
      if (expiresAt > now && transaction.status !== 'expired') {
        return true; // Found at least one active transaction
      }
    } else {
      // If no expiry date, consider it active (lifetime credits)
      return true;
    }
  }
  
  return false; // No active transactions found
}

// Update transaction records that have expired (in main transactions collection)
async function updateExpiredTransactions(databases, databaseId, transactionsCollectionId, log, error) {
  try {
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const transactionList = await databases.listDocuments(
        databaseId,
        transactionsCollectionId,
        [
          sdk.Query.offset(offset),
          sdk.Query.limit(limit)
        ]
      );

      for (const transaction of transactionList.documents) {
        try {
          // Check if the transaction has an expiry date and if it's expired
          if (transaction.expiresAt) {
            const expiresAt = new Date(transaction.expiresAt);
            const now = new Date();
            
            if (expiresAt < now && transaction.status !== 'expired') {
              log(`Transaction ${transaction.$id} (ID: ${transaction.transactionId}) expired on ${expiresAt}. Updating status to expired...`);
              
              // Update the transaction status to expired
              await databases.updateDocument(
                databaseId,
                transactionsCollectionId,
                transaction.$id,
                {
                  ...transaction,
                  status: 'expired'
                }
              );
              
              log(`Updated transaction ${transaction.transactionId} status to expired`);
            }
          }
        } catch (transErr) {
          error(`Error processing transaction ${transaction.$id}: ${transErr.message}`);
        }
      }

      // Check if there are more transactions to process
      if (transactionList.documents.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    log('Completed processing transactions in main collection');
  } catch (err) {
    error(`Error updating expired transactions: ${err.message}`);
    throw err;
  }
}

// Update user transaction records that have expired (in user_transactions collection)
async function updateUserTransactionRecords(databases, databaseId, userTransactionsCollectionId, log, error) {
  try {
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const transactionList = await databases.listDocuments(
        databaseId,
        userTransactionsCollectionId,
        [
          sdk.Query.offset(offset),
          sdk.Query.limit(limit)
        ]
      );

      for (const transaction of transactionList.documents) {
        try {
          // Check if the transaction has an expiry date and if it's expired
          if (transaction.expiresAt) {
            const expiresAt = new Date(transaction.expiresAt);
            const now = new Date();
            
            if (expiresAt < now && transaction.status !== 'expired') {
              log(`User transaction ${transaction.$id} (ID: ${transaction.transactionId}) expired on ${expiresAt}. Updating status to expired...`);
              
              // Update the transaction status to expired
              await databases.updateDocument(
                databaseId,
                userTransactionsCollectionId,
                transaction.$id,
                {
                  ...transaction,
                  status: 'expired'
                }
              );
              
              log(`Updated user transaction ${transaction.transactionId} status to expired`);
            }
          }
        } catch (transErr) {
          error(`Error processing user transaction ${transaction.$id}: ${transErr.message}`);
        }
      }

      // Check if there are more transactions to process
      if (transactionList.documents.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    log('Completed processing user transactions in user_transactions collection');
  } catch (err) {
    error(`Error updating expired user transactions: ${err.message}`);
    throw err;
  }
}
```

### Step 3: Add Dependencies

In the function settings, add the following dependency:
- `node-appwrite: ^9.0.0`

### Step 4: Set Environment Variables

Add these environment variables to your function:

- `APPWRITE_FUNCTION_API_ENDPOINT` = Your Appwrite endpoint (e.g., `https://cloud.appwrite.io/v1`)
- `APPWRITE_FUNCTION_PROJECT_ID` = Your project ID
- `APPWRITE_FUNCTION_API_KEY` = Your server API key with functions and database permissions
- `APPWRITE_DATABASE_ID` = Your main database ID
- `APPWRITE_USER_TRANSACTIONS_COLLECTION_ID` = `user_transactions` (required)

## Alternative: CLI Deployment

If you prefer using the Appwrite CLI:

1. Install the CLI:
   ```bash
   npm install -g @appwrite/cli
   ```

2. Login to your Appwrite account:
   ```bash
   appwrite login
   ```

3. Initialize your project:
   ```bash
   appwrite init project
   ```

4. Prepare your function files in a directory and run:
   ```bash
   appwrite functions create \
     --functionId="check_credits_expiry" \
     --name="Check Credits Expiry" \
     --runtime="node-18.0" \
     --execute='["any"]' \
     --schedule="0 0 * * *" \
     --timeout=900 \
     --entrypoint="index" \
     --commands="npm install" \
     --source="./functions/check-credits-expiry"
   ```

## Required Permissions

Your Appwrite API key needs these scopes:
- `functions.write` (to create the function)
- `databases.read` and `databases.write` (to read and update transaction records)
- `users.read` and `users.write` (to read and update user preferences)

## Function Behavior

Once deployed, the function will:
- Run daily at midnight (UTC)
- Check all user billing cycles for expiration
- Update expired transaction records from 'active' to 'expired'
- Process both the main transactions collection and user_transactions collection
- Maintain system integrity by enforcing the 30-day credit validity rule
/**
 * Manual deployment script for the Check Credits Expiry function
 * 
 * This script provides the code and instructions for manually deploying
 * the function via Appwrite Console or CLI.
 */

console.log("===============================================");
console.log("MANUAL DEPLOYMENT INSTRUCTIONS");
console.log("===============================================");
console.log();
console.log("1. CREATE THE FUNCTION VIA APPWRITE CONSOLE:");
console.log("   - Go to your Appwrite Console");
console.log("   - Navigate to Functions");
console.log("   - Click 'Create Function'");
console.log("   - Use these settings:");
console.log("     • Name: Check Credits Expiry");
console.log("     • Runtime: Node.js 18.0");
console.log("     • Execute: Anyone (for scheduled execution)");
console.log("     • Schedule: 0 0 * * * (daily at midnight)");
console.log("     • Timeout: 900 seconds (15 minutes)");
console.log();
console.log("2. ADD THE FOLLOWING CODE TO THE FUNCTION:");
console.log("```javascript");

const functionCode = `module.exports = async ({ req, res, log, error }) => {
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
    error(\`Error during credit expiry check: \${err.message}\`);
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
              log(\`User \${user.$id} billing cycle expired on \${billingCycleEnd}. Checking if update needed...\`);
              
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
                
                log(\`Updated user \${user.$id} preferences for expired billing cycle\`);
              }
            }
          }
        } catch (userErr) {
          error(\`Error processing user \${user.$id}: \${userErr.message}\`);
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
    error(\`Error updating user billing cycles: \${err.message}\`);
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
              log(\`Transaction \${transaction.$id} (ID: \${transaction.transactionId}) expired on \${expiresAt}. Updating status to expired...\`);
              
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
              
              log(\`Updated transaction \${transaction.transactionId} status to expired\`);
            }
          }
        } catch (transErr) {
          error(\`Error processing transaction \${transaction.$id}: \${transErr.message}\`);
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
    error(\`Error updating expired transactions: \${err.message}\`);
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
              log(\`User transaction \${transaction.$id} (ID: \${transaction.transactionId}) expired on \${expiresAt}. Updating status to expired...\`);
              
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
              
              log(\`Updated user transaction \${transaction.transactionId} status to expired\`);
            }
          }
        } catch (transErr) {
          error(\`Error processing user transaction \${transaction.$id}: \${transErr.message}\`);
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
    error(\`Error updating expired user transactions: \${err.message}\`);
    throw err;
  }
}`;

console.log(functionCode);
console.log("```");
console.log();
console.log("3. ADD THE FOLLOWING DEPENDENCIES:");
console.log("```json");
console.log(JSON.stringify({ dependencies: { "node-appwrite": "^9.0.0" } }, null, 2));
console.log("```");
console.log();
console.log("4. SET THE FOLLOWING ENVIRONMENT VARIABLES:");
console.log("   • APPWRITE_FUNCTION_API_ENDPOINT = Your Appwrite endpoint (e.g., https://cloud.appwrite.io/v1)");
console.log("   • APPWRITE_FUNCTION_PROJECT_ID = Your project ID");
console.log("   • APPWRITE_FUNCTION_API_KEY = Your server API key with functions and database permissions");
console.log("   • APPWRITE_DATABASE_ID = Your main database ID");
console.log("   • APPWRITE_TRANSACTIONS_COLLECTION_ID = Your transactions collection ID");
console.log("   • APPWRITE_USER_TRANSACTIONS_COLLECTION_ID = user_transactions");
console.log();
console.log("5. ALTERNATIVELY, USE THE APPWRITE CLI:");
console.log("   a) Install the CLI: npm install -g @appwrite/cli");
console.log("   b) Login: appwrite login");
console.log("   c) Init project: appwrite init project");
console.log("   d) Create function:");
console.log("      appwrite functions create \\");
console.log("        --functionId=\"check_credits_expiry\" \\");
console.log("        --name=\"Check Credits Expiry\" \\");
console.log("        --runtime=\"node-18.0\" \\");
console.log("        --execute='[\"any\"]' \\");
console.log("        --schedule=\"0 0 * * *\" \\");
console.log("        --timeout=900 \\");
console.log("        --entrypoint=\"index\" \\");
console.log("        --commands=\"npm install\" \\");
console.log("        --source=\"./functions/check-credits-expiry\"");
console.log();
console.log("===============================================");
console.log("FUNCTION PURPOSE:");
console.log("- Runs daily to check for expired credits");
console.log("- Updates transaction status from 'active' to 'expired' when expiry date passes");
console.log("- Maintains system integrity by enforcing 30-day credit validity rule");
console.log("===============================================");
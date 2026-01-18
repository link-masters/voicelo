const { Client, Databases } = require('node-appwrite');

async function verifyResults() {
    console.log('Verifying function results...');
    
    // Initialize the Appwrite client
    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY); // Server API key

    const databases = new Databases(client);
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const transactionsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_USER_TRANSACTIONS_COLLECTION_ID || 'user_transactions';

    if (!databaseId) {
        console.error('Missing database ID. Please set NEXT_PUBLIC_APPWRITE_DATABASE_ID environment variable.');
        return;
    }

    try {
        // Query for our test transactions
        console.log('Checking test transactions...');
        
        // Look for transactions created in the last hour with our test prefix
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        const response = await databases.listDocuments(
            databaseId,
            transactionsCollectionId,
            []
        );

        // Filter for our test transactions
        const testTransactions = response.documents.filter(doc => 
            doc.transactionId?.startsWith('test_') && 
            new Date(doc.purchasedAt) > oneHourAgo
        );

        console.log(`\nFound ${testTransactions.length} test transactions:`);
        
        testTransactions.forEach(transaction => {
            const expiresAt = new Date(transaction.expiresAt);
            const now = new Date();
            const isExpired = expiresAt < now;
            const statusCorrect = (isExpired && transaction.status === 'expired') || 
                                 (!isExpired && transaction.status === 'active');
            
            console.log(`\nTransaction ID: ${transaction.transactionId}`);
            console.log(`  Status: ${transaction.status} ${statusCorrect ? '✅' : '❌'}`);
            console.log(`  Expires: ${expiresAt.toLocaleString()}`);
            console.log(`  Should be expired: ${isExpired ? 'Yes' : 'No'}`);
            console.log(`  Status correct: ${statusCorrect ? 'Yes' : 'No'}`);
        });

        // Summary
        const correctStatuses = testTransactions.filter(transaction => {
            const expiresAt = new Date(transaction.expiresAt);
            const now = new Date();
            const isExpired = expiresAt < now;
            return (isExpired && transaction.status === 'expired') || 
                   (!isExpired && transaction.status === 'active');
        });

        console.log(`\n--- SUMMARY ---`);
        console.log(`Total test transactions: ${testTransactions.length}`);
        console.log(`Correctly updated: ${correctStatuses.length}`);
        console.log(`Success rate: ${Math.round((correctStatuses.length / testTransactions.length) * 100)}%`);

        if (correctStatuses.length === testTransactions.length) {
            console.log('🎉 All tests passed! Function is working correctly.');
        } else {
            console.log('❌ Some tests failed. Check the function logs for errors.');
        }

    } catch (error) {
        console.error('Error verifying results:', error.message);
    }
}

// Run the verification
verifyResults().catch(console.error);
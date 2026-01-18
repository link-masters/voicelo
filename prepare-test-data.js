const { Client, Databases, ID } = require('node-appwrite');

async function prepareTestData() {
    console.log('Preparing test data for function testing...');
    
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
        // Create a test transaction that should be marked as expired
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1); // Yesterday
        
        const expiredTransaction = {
            userId: 'test_user_expired',
            transactionId: 'test_expired_' + Date.now(),
            credits: 1000,
            packageName: 'Test Expired Package',
            provider: 'test',
            status: 'active', // Initially active
            purchasedAt: new Date().toISOString(),
            expiresAt: yesterday.toISOString() // Already expired
        };

        // Create a test transaction that should remain active
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1); // Tomorrow
        
        const activeTransaction = {
            userId: 'test_user_active',
            transactionId: 'test_active_' + Date.now(),
            credits: 1000,
            packageName: 'Test Active Package',
            provider: 'test',
            status: 'active',
            purchasedAt: new Date().toISOString(),
            expiresAt: tomorrow.toISOString() // Still active
        };

        console.log('Creating test transactions...');
        
        // Create expired transaction
        const expiredDoc = await databases.createDocument(
            databaseId,
            transactionsCollectionId,
            ID.unique(),
            expiredTransaction
        );
        console.log('✅ Created expired test transaction:', expiredDoc.$id);

        // Create active transaction
        const activeDoc = await databases.createDocument(
            databaseId,
            transactionsCollectionId,
            ID.unique(),
            activeTransaction
        );
        console.log('✅ Created active test transaction:', activeDoc.$id);

        console.log('\nTest data created successfully!');
        console.log('Now run the function and it should:');
        console.log('- Mark the expired transaction as "expired"');
        console.log('- Leave the active transaction as "active"');
        console.log('\nAfter running the function, check these documents to verify the results.');

    } catch (error) {
        console.error('Error creating test data:', error.message);
    }
}

// Run the script
prepareTestData().catch(console.error);
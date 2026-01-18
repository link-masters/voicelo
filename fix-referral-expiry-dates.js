// Script to fix missing expiry dates for referral reward transactions
const { Client, Databases, Query } = require('node-appwrite');
require('dotenv/config');

async function fixReferralExpiryDates() {
    console.log('🔧 Starting referral reward expiry date fix...');
    
    // Initialize Appwrite client
    const client = new Client();
    client
        .setEndpoint('https://fra.cloud.appwrite.io/v1')
        .setProject('693c9be6003ad511cd8c')
        .setKey('standard_8178965c4e42e917507f086c5588b9d43a9ce6bea9ff304ac6ba7787221a122d72365bd117fc5563976a2e3efddc3bf694a0d78b979059c3f88c60952890b6cf4a75d64c3d156a5000dc3f92059e35e5c2c7580e3527e406b8b753859f6e86865ec89e99c43bf6634b7ad679b8400650116dd800578e6f3d770265daf15cc13d');
        
    const databases = new Databases(client);
    const databaseId = '694b0e1f002d4d1dee92';
    const transactionsCollectionId = 'user_transactions';
    
    if (!databaseId || !transactionsCollectionId) {
        console.error('❌ Missing Appwrite configuration');
        return;
    }
    
    try {
        // Find all referral reward transactions without expiry dates
        console.log('🔍 Searching for referral reward transactions without expiry dates...');
        
        const response = await databases.listDocuments(
            databaseId,
            transactionsCollectionId,
            [
                Query.equal('packageName', 'Referral Reward'),
                Query.isNull('expiresAt')
            ]
        );
        
        console.log(`Found ${response.total} referral reward transactions without expiry dates`);
        
        if (response.total === 0) {
            console.log('✅ No transactions need fixing');
            return;
        }
        
        // Update each transaction to add a 30-day expiry date
        let fixedCount = 0;
        for (const doc of response.documents) {
            try {
                // Set expiry date to 30 days from purchase date
                const purchaseDate = new Date(doc.purchasedAt);
                const expiryDate = new Date(purchaseDate);
                expiryDate.setDate(expiryDate.getDate() + 30);
                
                await databases.updateDocument(
                    databaseId,
                    transactionsCollectionId,
                    doc.$id,
                    {
                        expiresAt: expiryDate.toISOString()
                    }
                );
                
                console.log(`✅ Fixed transaction ${doc.transactionId}: ${purchaseDate.toISOString()} → expires ${expiryDate.toISOString()}`);
                fixedCount++;
                
            } catch (updateError) {
                console.error(`❌ Failed to update transaction ${doc.transactionId}:`, updateError.message);
            }
        }
        
        console.log(`\n🎉 Completed! Fixed ${fixedCount} referral reward transactions`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the fix
fixReferralExpiryDates();
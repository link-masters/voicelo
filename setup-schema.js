const { Client, Databases } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject('693c9be6003ad511cd8c')
    .setKey('standard_8178965c4e42e917507f086c5588b9d43a9ce6bea9ff304ac6ba7787221a122d72365bd117fc5563976a2e3efddc3bf694a0d78b979059c3f88c60952890b6cf4a75d64c3d156a5000dc3f92059e35e5c2c7580e3527e406b8b753859f6e86865ec89e99c43bf6634b7ad679b8400650116dd800578e6f3d770265daf15cc13d');

const databases = new Databases(client);

const databaseId = '694b0e1f002d4d1dee92';
const collectionId = 'discount_redepmtions';

async function createAttributes() {
    const attributes = [
        { key: 'checkoutId', type: 'string', size: 100, required: true },
        { key: 'influencerId', type: 'string', size: 100, required: true },
        { key: 'amount', type: 'float', required: true },
        { key: 'commission', type: 'float', required: true },
        { key: 'status', type: 'string', size: 50, required: true },
        { key: 'currency', type: 'string', size: 10, required: true },
        { key: 'planName', type: 'string', size: 100, required: false },
        { key: 'userEmail', type: 'string', size: 255, required: false },
        { key: 'timestamp', type: 'string', size: 100, required: true }
    ];

    for (const attr of attributes) {
        try {
            console.log(`Creating ${attr.key}...`);
            if (attr.type === 'string') {
                await databases.createStringAttribute(databaseId, collectionId, attr.key, attr.size, attr.required);
            } else if (attr.type === 'float') {
                await databases.createFloatAttribute(databaseId, collectionId, attr.key, attr.required);
            }
            // Add a small delay for Appwrite to process
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {
            console.error(`Failed to create ${attr.key}:`, e.message);
        }
    }
}

async function createIndexes() {
    const indexes = [
        { key: 'idx_checkoutId', type: 'unique', attributes: ['checkoutId'] },
        { key: 'idx_influencerId', type: 'key', attributes: ['influencerId'] },
        { key: 'idx_timestamp', type: 'key', attributes: ['timestamp'], orders: ['DESC'] }
    ];

    for (const idx of indexes) {
        try {
            console.log(`Creating index ${idx.key}...`);
            await databases.createIndex(databaseId, collectionId, idx.key, idx.type, idx.attributes, idx.orders);
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (e) {
            console.error(`Failed to create index ${idx.key}:`, e.message);
        }
    }
}

async function run() {
    await createAttributes();
    console.log('Attributes creation triggered. Waiting for them to become "available"...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await createIndexes();
    console.log('Setup complete.');
}

run();

const { Client, Databases } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject('693c9be6003ad511cd8c')
    .setKey('standard_8178965c4e42e917507f086c5588b9d43a9ce6bea9ff304ac6ba7787221a122d72365bd117fc5563976a2e3efddc3bf694a0d78b979059c3f88c60952890b6cf4a75d64c3d156a5000dc3f92059e35e5c2c7580e3527e406b8b753859f6e86865ec89e99c43bf6634b7ad679b8400650116dd800578e6f3d770265daf15cc13d');

const databases = new Databases(client);

async function run() {
    try {
        const dbId = '694b0e1f002d4d1dee92';
        console.log('Fetching collections for DB:', dbId);
        const result = await databases.listCollections(dbId);
        console.log('Collections:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();

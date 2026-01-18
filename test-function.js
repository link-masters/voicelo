const { Client, Functions } = require('node-appwrite');

async function testFunction() {
    console.log('Testing Check Credits Expiry function...');
    
    // Initialize the Appwrite client
    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY); // Server API key

    const functions = new Functions(client);

    try {
        // Execute the function
        const response = await functions.createExecution('check_credits_expiry');
        
        console.log('Function execution triggered successfully!');
        console.log('Execution ID:', response.$id);
        console.log('Status:', response.status);
        console.log('Triggered at:', response.triggeredAt);
        
        // Wait a moment and check the execution status
        setTimeout(async () => {
            try {
                const executionDetails = await functions.getExecution('check_credits_expiry', response.$id);
                console.log('\n--- Execution Results ---');
                console.log('Status:', executionDetails.status);
                console.log('Duration:', executionDetails.duration, 'ms');
                console.log('Response:', executionDetails.response);
                console.log('Stdout:', executionDetails.stdout);
                console.log('Stderr:', executionDetails.stderr);
            } catch (error) {
                console.error('Error getting execution details:', error.message);
            }
        }, 5000); // Wait 5 seconds for execution to complete
        
    } catch (error) {
        console.error('Error executing function:', error.message);
    }
}

// Run the test
testFunction().catch(console.error);
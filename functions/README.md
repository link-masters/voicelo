# Appwrite Functions

This directory contains Appwrite serverless functions for the VoiceLo application.

## Functions

### 1. Check Credits Expiry

Regularly checks credit statuses and updates expired credits in the system.

#### Purpose
The function performs the following tasks:
1. Checks user preferences for expired billing cycles
2. Updates transaction records that have expired
3. Updates user transaction records that have expired

#### Configuration
The function requires the following environment variables:
- `APPWRITE_FUNCTION_API_ENDPOINT` - Appwrite API endpoint
- `APPWRITE_FUNCTION_PROJECT_ID` - Appwrite project ID
- `APPWRITE_FUNCTION_API_KEY` - Appwrite API key with appropriate permissions
- `APPWRITE_DATABASE_ID` - Main database ID
- `APPWRITE_USER_TRANSACTIONS_COLLECTION_ID` - User transactions collection ID (required)

#### Schedule
This function should be scheduled to run daily to check for expired credits and update their status accordingly.

#### Behavior
- Updates user preferences to mark billing cycles as expired
- Changes transaction status from 'active' to 'expired' when the expiry date has passed
- Processes both the main transactions collection and user_transactions collection if both exist

## Deployment

To deploy the functions:

1. Install the Appwrite CLI:
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

4. Run the deployment script:
```bash
npm run deploy-function
```

Alternatively, you can deploy functions directly through the Appwrite Console UI by uploading the function folders and setting the configuration there.
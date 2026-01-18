# Check Credits Expiry Function

This Appwrite function regularly checks credit statuses and updates expired credits in the system.

## Purpose

The function performs the following tasks:
1. Checks user preferences for expired billing cycles
2. Updates user transaction records that have expired in the dedicated user_transactions collection

## Configuration

The function requires the following environment variables:
- `APPWRITE_FUNCTION_API_ENDPOINT` - Appwrite API endpoint
- `APPWRITE_FUNCTION_PROJECT_ID` - Appwrite project ID
- `APPWRITE_FUNCTION_API_KEY` - Appwrite API key with appropriate permissions
- `APPWRITE_DATABASE_ID` - Main database ID
- `APPWRITE_USER_TRANSACTIONS_COLLECTION_ID` - User transactions collection ID (required)

## Schedule

This function should be scheduled to run daily to check for expired credits and update their status accordingly.

## Behavior

- Updates user preferences to mark billing cycles as expired
- Changes transaction status from 'active' to 'expired' when the expiry date has passed
- Processes both the main transactions collection and user_transactions collection if both exist
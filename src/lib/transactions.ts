
import { Databases, ID, Permission, Role } from 'node-appwrite';

export interface TransactionData {
    userId: string;
    transactionId: string;
    credits: number;
    packageName: string;
    provider: string;
    status: string;
    purchasedAt: string;
    expiresAt?: string;
}

/**
 * Creates a transaction record in the dedicated Appwrite collection.
 */
export async function createTransactionRecord(
    databases: Databases,
    databaseId: string,
    collectionId: string,
    data: TransactionData
) {
    console.log(`[Transactions] Creating record for transaction ${data.transactionId} (User: ${data.userId})`);

    try {
        await databases.createDocument(
            databaseId,
            collectionId,
            ID.unique(),
            {
                userId: data.userId,
                transactionId: data.transactionId,
                credits: data.credits,
                packageName: data.packageName,
                provider: data.provider,
                status: data.status,
                purchasedAt: data.purchasedAt,
                expiresAt: data.expiresAt
            },
            [
                Permission.read(Role.user(data.userId)),
                Permission.read(Role.label('admin')) // Optional, if you have admin teams
            ]
        );
        console.log(`[Transactions] ✅ Record created successfully.`);
    } catch (error) {
        console.error(`[Transactions] ❌ Failed to create record:`, error);
        // We log the error but allow the process to continue so we don't block the response 
        // if this is part of a larger webhook flow that has already succeeded in other parts.
        throw error;
    }
}

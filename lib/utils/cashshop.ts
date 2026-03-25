import cashshop_storage from '../models/cashshop_storage';
import type { Transaction } from "sequelize";

const MAX_SENDER_NAME_LENGTH = 16;

function clampNullableString(value: string | null | undefined, maxLength: number): string | null {
    const normalized = String(value ?? '').trim();
    if (!normalized) return null;
    return normalized.slice(0, maxLength);
}

/**
 * Add items to cashshop_storage for a user
 * @param accountId - The account ID of the user (both AccountID and Buyer will be set to this)
 * @param items - Array of items to add { tblidx: number, amount: number }
 * @param options - Optional parameters like senderName, price
 */
export async function addItemsToCashshop(
    accountId: number,
    items: Array<{ tblidx: number; amount: number }>,
    options?: {
        senderName?: string;
        price?: number;
        giftCharId?: number | null;
        buyerAccountId?: number;
        transaction?: Transaction;
    }
): Promise<void> {
    const now = new Date();
    const senderName = clampNullableString(options?.senderName, MAX_SENDER_NAME_LENGTH);
    
    for (const item of items) {
        // StackCount is TINYINT UNSIGNED, so max value is 255
        // If amount exceeds 255, we need to create multiple entries
        const remainingAmount = item.amount;
        
        // Calculate how many entries we need (each can hold max 255)
        const numEntries = Math.ceil(remainingAmount / 255);
        
        for (let i = 0; i < numEntries; i++) {
            // Each entry holds 255, except the last one which holds the remainder
            const currentStackCount = i === numEntries - 1 
                ? remainingAmount - (i * 255)  // Last entry gets whatever is left
                : 255;
            
            await cashshop_storage.create({
                AccountID: accountId,
                HLSitemTblidx: item.tblidx,
                StackCount: currentStackCount,
                giftCharId: options?.giftCharId ?? null,
                IsRead: 0,
                SenderName: senderName,
                year: now.getFullYear(),
                month: now.getMonth() + 1, // getMonth() returns 0-11
                day: now.getDate(),
                hour: now.getHours(),
                minute: now.getMinutes(),
                second: now.getSeconds(),
                millisecond: now.getMilliseconds(),
                isMoved: 0,
                Buyer: options?.buyerAccountId ?? accountId,
                price: options?.price || 0,
                ItemID: 0,
            }, {
                transaction: options?.transaction,
            });
        }
    }
}

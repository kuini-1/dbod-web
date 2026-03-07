import cashshop_storage from '../models/cashshop_storage';

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
    }
): Promise<void> {
    const now = new Date();
    
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
                giftCharId: null, // Not sending as gift
                IsRead: 0,
                SenderName: options?.senderName || null,
                year: now.getFullYear(),
                month: now.getMonth() + 1, // getMonth() returns 0-11
                day: now.getDate(),
                hour: now.getHours(),
                minute: now.getMinutes(),
                second: now.getSeconds(),
                millisecond: now.getMilliseconds(),
                isMoved: 0,
                Buyer: accountId, // Buyer is the same as AccountID
                price: options?.price || 0,
                ItemID: 0,
            });
        }
    }
}

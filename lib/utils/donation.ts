import { donations } from '../models/donations';

/**
 * Get total donated amount for a user (sum of Value in USD from donations table).
 */
export async function getTotalDonatedFromPackages(username: string): Promise<number> {
    const rows = await donations.findAll({
        where: { Username: username },
        attributes: ['Value'],
        raw: true
    });
    let total = 0;
    for (const row of rows) {
        const val = (row as any).Value;
        if (val != null && !Number.isNaN(parseFloat(String(val)))) {
            total += parseFloat(String(val));
        }
    }
    return total;
}

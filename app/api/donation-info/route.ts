import { NextRequest, NextResponse } from 'next/server';
import { donations } from '../../../lib/models/donations';
import { donation_tier_claims } from '../../../lib/models/donation_tier_claims';
import { getTotalDonatedFromPackages } from '../../../lib/utils/donation';
import { getUserFromRequest } from '../../../lib/auth/utils';

export async function GET(request: NextRequest) {
    try {
        const Account = await getUserFromRequest(request);

        // If not logged in, return default values
        if (!Account) {
            return NextResponse.json(
                {
                    FirstTimeDonate: true,
                    TotalDonated: 0,
                    claimedTierIds: []
                },
                { status: 200 }
            );
        }

        const username = (Account as any).Username ?? (Account as any).username ?? '';
        const accountId = (Account as any).AccountID ?? (Account as any).accountID;

        // TotalDonated = sum of package prices (only donations with packageId)
        const totalDonated = await getTotalDonatedFromPackages(username);

        // FirstTimeDonate = has user ever made any donation?
        const donationCount = await donations.count({
            where: { Username: username }
        });
        const FirstTimeDonate = donationCount === 0;

        // Claimed tier IDs for this user
        const claims = await donation_tier_claims.findAll({
            where: { AccountID: accountId },
            attributes: ['tierId'],
            raw: true
        });
        const claimedTierIds = claims.map((c: any) => c.tierId);

        return NextResponse.json(
            {
                FirstTimeDonate,
                TotalDonated: totalDonated,
                claimedTierIds
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Donation info error:', error);
        // Return default values on error instead of error response
        return NextResponse.json(
            {
                FirstTimeDonate: true,
                TotalDonated: 0,
                claimedTierIds: []
            },
            { status: 200 }
        );
    }
}

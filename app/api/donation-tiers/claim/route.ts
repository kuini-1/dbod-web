import { NextRequest, NextResponse } from 'next/server';
import { donation_tiers } from '../../../../lib/models/donation_tiers';
import { donation_tier_items } from '../../../../lib/models/donation_tier_items';
import { donation_tier_claims } from '../../../../lib/models/donation_tier_claims';
import { characters } from '../../../../lib/models/characters';
import { addItemsToCashshop } from '../../../../lib/utils/cashshop';
import { getTotalDonatedFromPackages } from '../../../../lib/utils/donation';
import { getUserFromRequest } from '../../../../lib/auth/utils';

const CCBD_LIMIT_BONUS_PER_TIER = 1;

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json().catch(() => ({}));
        const { tierId, characterId } = body;

        if (!tierId || typeof tierId !== 'number') {
            return NextResponse.json(
                { success: false, message: 'Invalid tierId' },
                { status: 400 }
            );
        }
        if (!characterId || typeof characterId !== 'number') {
            return NextResponse.json(
                { success: false, message: 'Please select a character to receive CCBD Limit +1.' },
                { status: 400 }
            );
        }

        // 1. Verify tier exists
        const tier = await donation_tiers.findByPk(tierId);
        if (!tier) {
            return NextResponse.json(
                { success: false, message: 'Tier not found' },
                { status: 404 }
            );
        }

        const tierAmount = (tier as any).amount;
        const username = (user as any).Username;

        // 2. Verify user has reached this tier (totalDonated >= tier.amount)
        const totalDonated = await getTotalDonatedFromPackages(username);
        if (totalDonated < tierAmount) {
            return NextResponse.json(
                { success: false, message: `You need $${tierAmount} total donated to unlock this tier. Current: $${totalDonated.toFixed(2)}` },
                { status: 403 }
            );
        }

        // 3. Verify tier not already claimed
        const existingClaim = await donation_tier_claims.findOne({
            where: { AccountID: user.AccountID, tierId }
        });
        if (existingClaim) {
            return NextResponse.json(
                { success: false, message: 'Tier rewards already claimed' },
                { status: 409 }
            );
        }

        // 4. Character selection is required for CCBD Limit bonus
        const selectedCharacter = await characters.findOne({
            where: {
                CharID: characterId,
                AccountID: user.AccountID
            }
        });
        if (!selectedCharacter) {
            return NextResponse.json(
                { success: false, message: 'Selected character not found.' },
                { status: 404 }
            );
        }

        // 5. Get tier items and add to cashshop
        const tierItems = await donation_tier_items.findAll({
            where: { tierId },
            raw: true
        });

        if (tierItems.length > 0) {
            const itemsToAdd = tierItems.map((item: any) => ({
                tblidx: item.tblidx,
                amount: item.amount
            }));

            await addItemsToCashshop(
                user.AccountID,
                itemsToAdd,
                {
                    senderName: 'Donation Tier Reward',
                    price: 0
                }
            );
        }

        const currentLimit = Number(selectedCharacter.CCBD_Limit ?? 0);
        await selectedCharacter.update({
            CCBD_Limit: currentLimit + CCBD_LIMIT_BONUS_PER_TIER
        });

        // 6. Record the claim
        await donation_tier_claims.create({
            AccountID: user.AccountID,
            tierId,
            claimedAt: new Date()
        });

        return NextResponse.json(
            {
                success: true,
                message: `Rewards claimed successfully. ${selectedCharacter.CharName} received CCBD Limit +${CCBD_LIMIT_BONUS_PER_TIER}.`
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Donation tier claim error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to claim rewards' },
            { status: 500 }
        );
    }
}

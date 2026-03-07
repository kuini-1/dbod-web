import { NextRequest, NextResponse } from 'next/server';
import { accounts } from '../../../lib/models/accounts';
import { donations } from '../../../lib/models/donations';
import { donation_tiers } from '../../../lib/models/donation_tiers';
import { donation_tier_items } from '../../../lib/models/donation_tier_items';
import popup_banner_items from '../../../lib/models/popup_banner_items';
import { addItemsToCashshop } from '../../../lib/utils/cashshop';
import Stripe from 'stripe';
import { DonationData, BonusCP } from '../donate/route';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51KCOVJIBPTWZxVxDel2iVkYo5uZgCW3rlpSnWk3ieZMd7g8Bdx6wifiBIKy1vnkXlFIxzbFI4NE5JcW2i47Qtm4q00IXa9dCdH', {
    apiVersion: '2022-08-01',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_9c5a0d8ab232ef58cec6d680d0ca12c1e488b35f17b015e103fd6b56c90c9d93";

const calculateCashPoints = (amount: number, firstTime: boolean): number => {
    let cashpoints = 0;
    switch (amount) {
        case 500: cashpoints = DonationData[0].CP + (DonationData[0].CP * BonusCP) + (firstTime ? DonationData[0].CP : 0); break;
        case 1000: cashpoints = DonationData[1].CP + (DonationData[1].CP * BonusCP) + (firstTime ? DonationData[1].CP : 0); break;
        case 2500: cashpoints = DonationData[2].CP + (DonationData[2].CP * BonusCP) + (firstTime ? DonationData[2].CP : 0); break;
        case 5000: cashpoints = DonationData[3].CP + (DonationData[3].CP * BonusCP) + (firstTime ? DonationData[3].CP : 0); break;
        case 8000: cashpoints = DonationData[4].CP + (DonationData[4].CP * BonusCP) + (firstTime ? DonationData[4].CP : 0); break;
        case 10000: cashpoints = DonationData[5].CP + (DonationData[5].CP * BonusCP) + (firstTime ? DonationData[5].CP : 0); break;
    }
    return cashpoints;
};

export async function POST(request: NextRequest) {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');
    
    let event;
 
    try {
        event = stripe.webhooks.constructEvent(body, sig || '', endpointSecret);
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json(
            { error: `Webhook Error: ${err.message}` },
            { status: 400 }
        );
    }
    
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object as Stripe.Checkout.Session;
            
            if (session.metadata?.username && session.payment_intent) {
                // Retrieve the payment intent to get the amount
                const paymentIntent = await stripe.paymentIntents.retrieve(
                    typeof session.payment_intent === 'string' 
                        ? session.payment_intent 
                        : session.payment_intent.id
                );
                
                const user = await accounts.findOne({
                    where: { Username: session.metadata.username }
                });

                if(user && paymentIntent) {
                    const isFirstTime = user.donated === 0;
                    const cashPoints = calculateCashPoints(paymentIntent.amount, isFirstTime);
                    const amountInCents = paymentIntent.amount;
                    const amountInDollars = amountInCents / 100;
                    
                    await user.update(
                        { mallpoints: (user.mallpoints || 0) + cashPoints }
                    );
                    
                    await donations.create({
                        Username: session.metadata.username,
                        OrderID: paymentIntent.id,
                        email: session.customer_email || session.customer_details?.email || '',
                        Value: paymentIntent.amount.toString(),
                        mallpoints: cashPoints.toString()
                    });

                    // Check if this is a banner purchase (has bannerId in metadata)
                    const bannerId = session.metadata?.bannerId;
                    if (bannerId) {
                        try {
                            // Get banner items
                            const bannerItems = await popup_banner_items.findAll({
                                where: { bannerId: parseInt(bannerId) },
                                raw: true
                            });

                            if (bannerItems.length > 0) {
                                const itemsToAdd = bannerItems.map((item: any) => ({
                                    tblidx: item.tblidx,
                                    amount: item.amount
                                }));

                                await addItemsToCashshop(
                                    user.AccountID,
                                    itemsToAdd,
                                    {
                                        senderName: 'Banner Purchase',
                                        price: amountInCents
                                    }
                                );
                                console.log(`Added ${itemsToAdd.length} banner items to cashshop_storage for user ${user.Username}`);
                            }
                        } catch (error) {
                            console.error('Error adding banner items to cashshop:', error);
                        }
                    } else {
                        // This is a regular donation - check for donation tier items
                        try {
                            // Calculate total donated amount
                            const allDonations = await donations.findAll({
                                where: { Username: user.Username },
                                raw: true
                            });
                            
                            let totalDonated = 0;
                            for (const donation of allDonations) {
                                totalDonated += parseInt(donation.Value || '0');
                            }
                            // Add current donation
                            totalDonated += amountInCents;
                            
                            // Get all donation tiers ordered by amount
                            const tiers = await donation_tiers.findAll({
                                order: [['amount', 'ASC']],
                                raw: true
                            });

                            // Find tiers that the user has now unlocked
                            // totalDonated is in cents, tier.amount is in dollars, so convert to dollars for comparison
                            const totalDonatedInDollars = totalDonated / 100;
                            const unlockedTierIds: number[] = [];
                            for (const tier of tiers as any[]) {
                                if (totalDonatedInDollars >= tier.amount) {
                                    unlockedTierIds.push(tier.id);
                                }
                            }

                            if (unlockedTierIds.length > 0) {
                                // Get all items from unlocked tiers
                                const tierItems = await donation_tier_items.findAll({
                                    where: { tierId: unlockedTierIds },
                                    raw: true
                                });

                                if (tierItems.length > 0) {
                                    // Group items by tblidx and sum amounts
                                    const itemsMap = new Map<number, number>();
                                    for (const item of tierItems as any[]) {
                                        const currentAmount = itemsMap.get(item.tblidx) || 0;
                                        itemsMap.set(item.tblidx, currentAmount + item.amount);
                                    }

                                    const itemsToAdd = Array.from(itemsMap.entries()).map(([tblidx, amount]) => ({
                                        tblidx,
                                        amount
                                    }));

                                    await addItemsToCashshop(
                                        user.AccountID,
                                        itemsToAdd,
                                        {
                                            senderName: 'Donation Tier Reward',
                                            price: 0 // Donation tier rewards are free
                                        }
                                    );
                                    console.log(`Added ${itemsToAdd.length} donation tier items to cashshop_storage for user ${user.Username}`);
                                }
                            }
                        } catch (error) {
                            console.error('Error adding donation tier items to cashshop:', error);
                        }
                    }
                }
            }
        break;
        
        case 'payment_intent.succeeded':
            // Keep this for backward compatibility with old payment flow
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            
            if(paymentIntent.metadata?.username) {
                const user = await accounts.findOne({
                    where: { Username: paymentIntent.metadata.username }
                });

                if(user) {
                    const isFirstTime = user.donated === 0;
                    const cashPoints = calculateCashPoints(paymentIntent.amount, isFirstTime);
                    const amountInCents = paymentIntent.amount;
                    
                    await user.update(
                        { mallpoints: (user.mallpoints || 0) + cashPoints }
                    );
                    
                    await donations.create({
                        Username: paymentIntent.metadata.username,
                        OrderID: paymentIntent.id,
                        email: paymentIntent.receipt_email || '',
                        Value: paymentIntent.amount.toString(),
                        mallpoints: cashPoints.toString()
                    });

                    // Check if this is a banner purchase (has bannerId in metadata)
                    const bannerId = paymentIntent.metadata?.bannerId;
                    if (bannerId) {
                        try {
                            // Get banner items
                            const bannerItems = await popup_banner_items.findAll({
                                where: { bannerId: parseInt(bannerId) },
                                raw: true
                            });

                            if (bannerItems.length > 0) {
                                const itemsToAdd = bannerItems.map((item: any) => ({
                                    tblidx: item.tblidx,
                                    amount: item.amount
                                }));

                                await addItemsToCashshop(
                                    user.AccountID,
                                    itemsToAdd,
                                    {
                                        senderName: 'Banner Purchase',
                                        price: amountInCents
                                    }
                                );
                                console.log(`Added ${itemsToAdd.length} banner items to cashshop_storage for user ${user.Username}`);
                            }
                        } catch (error) {
                            console.error('Error adding banner items to cashshop:', error);
                        }
                    } else {
                        // This is a regular donation - check for donation tier items
                        try {
                            // Calculate total donated amount
                            const allDonations = await donations.findAll({
                                where: { Username: user.Username },
                                raw: true
                            });
                            
                            let totalDonated = 0;
                            for (const donation of allDonations) {
                                totalDonated += parseInt(donation.Value || '0');
                            }
                            // Add current donation
                            totalDonated += amountInCents;
                            
                            // Get all donation tiers ordered by amount
                            const tiers = await donation_tiers.findAll({
                                order: [['amount', 'ASC']],
                                raw: true
                            });

                            // Find tiers that the user has now unlocked
                            // totalDonated is in cents, tier.amount is in dollars, so convert to dollars for comparison
                            const totalDonatedInDollars = totalDonated / 100;
                            const unlockedTierIds: number[] = [];
                            for (const tier of tiers as any[]) {
                                if (totalDonatedInDollars >= tier.amount) {
                                    unlockedTierIds.push(tier.id);
                                }
                            }

                            if (unlockedTierIds.length > 0) {
                                // Get all items from unlocked tiers
                                const tierItems = await donation_tier_items.findAll({
                                    where: { tierId: unlockedTierIds },
                                    raw: true
                                });

                                if (tierItems.length > 0) {
                                    // Group items by tblidx and sum amounts
                                    const itemsMap = new Map<number, number>();
                                    for (const item of tierItems as any[]) {
                                        const currentAmount = itemsMap.get(item.tblidx) || 0;
                                        itemsMap.set(item.tblidx, currentAmount + item.amount);
                                    }

                                    const itemsToAdd = Array.from(itemsMap.entries()).map(([tblidx, amount]) => ({
                                        tblidx,
                                        amount
                                    }));

                                    await addItemsToCashshop(
                                        user.AccountID,
                                        itemsToAdd,
                                        {
                                            senderName: 'Donation Tier Reward',
                                            price: 0 // Donation tier rewards are free
                                        }
                                    );
                                    console.log(`Added ${itemsToAdd.length} donation tier items to cashshop_storage for user ${user.Username}`);
                                }
                            }
                        } catch (error) {
                            console.error('Error adding donation tier items to cashshop:', error);
                        }
                    }
                }
            }
        break;
    }
    
    return NextResponse.json({ received: true });
}

export const runtime = 'nodejs';

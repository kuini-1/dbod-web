import { NextRequest, NextResponse } from 'next/server';
import { accounts } from '../../../lib/models/accounts';
import { donations } from '../../../lib/models/donations';
import popup_banner_items from '../../../lib/models/popup_banner_items';
import { packages } from '../../../lib/models/packages';
import { addItemsToCashshop } from '../../../lib/utils/cashshop';
import Stripe from 'stripe';
import { BonusCP } from '../../../lib/constants/donation';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51KCOVJIBPTWZxVxDel2iVkYo5uZgCW3rlpSnWk3ieZMd7g8Bdx6wifiBIKy1vnkXlFIxzbFI4NE5JcW2i47Qtm4q00IXa9dCdH', {
    apiVersion: '2022-08-01',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

async function calculateCashPointsFromPackage(packageId: number, firstTime: boolean): Promise<number> {
    const pkg = await packages.findByPk(packageId);
    if (!pkg) return 0;
    const baseCP = (pkg as any).cashPoints;
    return baseCP + (baseCP * BonusCP) + (firstTime ? baseCP : 0);
}

// Legacy: amount-based CP for payment_intent.succeeded (no packageId in metadata)
const LEGACY_AMOUNT_TO_CP: Record<number, number> = {
    500: 50, 1000: 105, 2500: 275, 5000: 575, 8000: 960, 10000: 1250,
};
const calculateCashPointsLegacy = (amount: number, firstTime: boolean): number => {
    const baseCP = LEGACY_AMOUNT_TO_CP[amount] ?? 0;
    return baseCP + (baseCP * BonusCP) + (firstTime ? baseCP : 0);
};

// GET handler for verifying webhook URL is reachable (e.g. curl https://your-domain/api/webhook)
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'Stripe webhook endpoint. Configure Stripe to POST to this URL.',
        path: '/api/webhook',
    });
}

export async function POST(request: NextRequest) {
    if (!endpointSecret) {
        console.error('STRIPE_WEBHOOK_SECRET is not set in environment variables');
        return NextResponse.json(
            { error: 'Webhook secret not configured. Set STRIPE_WEBHOOK_SECRET in .env.local' },
            { status: 500 }
        );
    }

    const body = await request.text();
    const sig = request.headers.get('stripe-signature');
    
    let event;
 
    try {
        event = stripe.webhooks.constructEvent(body, sig || '', endpointSecret);
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        const isSecretMismatch = err.message?.includes('signatures') || err.message?.includes('signature');
        return NextResponse.json(
            {
                error: `Webhook Error: ${err.message}`,
                hint: isSecretMismatch
                    ? 'Get the signing secret from Stripe Dashboard → Developers → Webhooks → your endpoint → Reveal. Update STRIPE_WEBHOOK_SECRET in .env.local and restart.'
                    : undefined,
            },
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
                    const amountCurrency = session.metadata?.amountCurrency || 'usd';
                    const amountInCents = amountCurrency === 'usd'
                        ? paymentIntent.amount
                        : Math.round(parseFloat(session.metadata?.amount || '0') * 100);
                    // CP from packageId when available; fallback to legacy amount-based for old sessions
                    const metaPackageId = session.metadata?.packageId;
                    let cashPoints: number;
                    if (metaPackageId && metaPackageId !== 'custom') {
                        cashPoints = await calculateCashPointsFromPackage(parseInt(metaPackageId, 10), isFirstTime);
                    } else {
                        cashPoints = calculateCashPointsLegacy(amountInCents, isFirstTime);
                    }
                    
                    await user.update({
                        mallpoints: (user.mallpoints || 0) + cashPoints,
                        donated: 1, // Mark as donated so first-time bonus is not applied again
                    });
                    
                    const valueUsd = parseFloat(session.metadata?.amount || '0') || amountInCents / 100;
                    const packageIdVal = metaPackageId && metaPackageId !== 'custom'
                        ? parseInt(metaPackageId, 10)
                        : null;

                    await donations.create({
                        Username: session.metadata.username,
                        OrderID: paymentIntent.id,
                        Email: session.customer_email || session.customer_details?.email || '',
                        Currency: amountCurrency,
                        Value: valueUsd,
                        mallpoints: cashPoints,
                        packageId: isNaN(packageIdVal as number) ? null : packageIdVal
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
                    }
                    // Tier rewards are claimed manually via /api/donation-tiers/claim (backend verification)
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
                    const cashPoints = calculateCashPointsLegacy(paymentIntent.amount, isFirstTime);
                    const amountInCents = paymentIntent.amount;
                    
                    await user.update({
                        mallpoints: (user.mallpoints || 0) + cashPoints,
                        donated: 1, // Mark as donated so first-time bonus is not applied again
                    });
                    
                    const valueUsdLegacy = paymentIntent.amount / 100;

                    await donations.create({
                        Username: paymentIntent.metadata.username,
                        OrderID: paymentIntent.id,
                        Email: paymentIntent.receipt_email || '',
                        Currency: 'usd',
                        Value: valueUsdLegacy,
                        mallpoints: cashPoints,
                        packageId: null
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
                    }
                    // Tier rewards are claimed manually via /api/donation-tiers/claim (backend verification)
                }
            }
        break;
    }
    
    return NextResponse.json({ received: true });
}

export const runtime = 'nodejs';

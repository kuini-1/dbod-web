import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getUserFromRequest } from '../../../lib/auth/utils';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51KCOVJIBPTWZxVxDel2iVkYo5uZgCW3rlpSnWk3ieZMd7g8Bdx6wifiBIKy1vnkXlFIxzbFI4NE5JcW2i47Qtm4q00IXa9dCdH', {
    apiVersion: '2022-08-01',
});

// Map package ID to price in cents (matching DonationData from /api/donate)
const getPriceInCents = (packageId: number): number => {
    switch (packageId) {
        case 1: return 500;   // $5.00
        case 2: return 1000;   // $10.00
        case 3: return 2500;   // $25.00
        case 4: return 5000;   // $50.00
        case 5: return 8000;   // $80.00
        case 6: return 10000;  // $100.00
        default: return 500;
    }
};

// Get package name/description
const getPackageName = (packageId: number): string => {
    switch (packageId) {
        case 1: return '$5 Package';
        case 2: return '$10 Package';
        case 3: return '$25 Package';
        case 4: return '$50 Package';
        case 5: return '$80 Package';
        case 6: return '$100 Package';
        default: return 'Donation Package';
    }
};

export async function POST(request: NextRequest) {
    try {
        // Verify user is authenticated
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { packageId, amount: amountUSD, characterId, characterName } = body;

        // If amountUSD is provided, use it directly; otherwise fall back to packageId
        let amount: number;
        let packageName: string;
        
        if (amountUSD && typeof amountUSD === 'number') {
            // Use the provided price in USD, convert to cents
            amount = Math.round(amountUSD * 100);
            packageName = `$${amountUSD.toFixed(2)} Package`;
        } else if (packageId) {
            // Fall back to packageId mapping
            amount = getPriceInCents(packageId);
            packageName = getPackageName(packageId);
        } else {
            return NextResponse.json(
                { error: 'Missing packageId or amount' },
                { status: 400 }
            );
        }
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: packageName,
                            description: 'Cash Points for DBOD',
                        },
                        unit_amount: amount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${baseUrl}/donate?success=true`,
            cancel_url: `${baseUrl}/donate?canceled=true`,
            metadata: {
                username: user.Username,
                packageId: packageId ? packageId.toString() : 'custom',
                amount: amountUSD ? amountUSD.toString() : (amount / 100).toString(),
                characterId: characterId?.toString() || '',
                characterName: characterName || '',
            },
            customer_email: user.email || undefined,
        });

        return NextResponse.json({
            url: session.url,
        });
    } catch (error) {
        console.error('Checkout session creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}

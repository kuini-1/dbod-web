import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51KCOVJIBPTWZxVxDel2iVkYo5uZgCW3rlpSnWk3ieZMd7g8Bdx6wifiBIKy1vnkXlFIxzbFI4NE5JcW2i47Qtm4q00IXa9dCdH', {
    apiVersion: '2022-08-01',
});

const calculateOrderAmount = (amount: number) => {
    let price = 500;
    switch (amount) {
        case 1: price = 500; break;
        case 2: price = 1000; break;
        case 3: price = 1500; break;
        case 4: price = 3000; break;
        case 5: price = 5000; break;
        case 6: price = 10000; break;
    }
    return price;
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        if (!body.amount || !body.username) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }
 
        const paymentIntent = await stripe.paymentIntents.create({
            amount: calculateOrderAmount(body.amount),
            currency: "usd",
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                username: body.username,
            },
        }, {
            idempotencyKey: body.key
        });
 
        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error('Payment intent creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create payment intent' },
            { status: 500 }
        );
    }
}

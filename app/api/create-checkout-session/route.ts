import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getUserFromRequest } from '../../../lib/auth/utils';
import { packages } from '../../../lib/models/packages';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2022-08-01' }) : null;

// Currency config: methods + amount conversion from USD
const CURRENCY_CONFIG: Record<string, { methods: string[]; rate: number; symbol: string }> = {
    usd: {
        methods: ['card', 'link', 'crypto'],
        rate: 1,
        symbol: '$',
    },
    brl: {
        methods: ['card', 'pix'],
        rate: 6.0, // Approx USD→BRL
        symbol: 'R$',
    },
    krw: {
        methods: ['card', 'kakao_pay', 'payco', 'naver_pay'],
        rate: 1350, // Approx USD→KRW
        symbol: '₩',
    },
    eur: {
        methods: ['card', 'ideal', 'bancontact', 'eps', 'p24', 'multibanco', 'mb_way', 'wero', 'cartes_bancaires'],
        rate: 0.92, // Approx USD→EUR
        symbol: '€',
    },
};

export async function POST(request: NextRequest) {
    try {
        if (!stripe) {
            console.error('STRIPE_SECRET_KEY is not set in environment variables');
            return NextResponse.json(
                { error: 'Payment system is not configured' },
                { status: 500 }
            );
        }

        // Verify user is authenticated
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { packageId, amount: amountUSD, characterId, characterName, bannerId, currency: currencyParam } = body;

        // Resolve currency (usd, brl, krw, eur) - default USD
        const currency = (currencyParam && CURRENCY_CONFIG[String(currencyParam).toLowerCase()])
            ? String(currencyParam).toLowerCase()
            : 'usd';
        const config = CURRENCY_CONFIG[currency];

        // When packageId provided: fetch package from DB, use package.price for amount
        // When amount only (custom/banner fallback): use amount as before; packageId stays "custom"
        let amountUSDResolved: number;
        let packageName: string;

        if (packageId) {
            const pkg = await packages.findByPk(packageId);
            if (!pkg) {
                return NextResponse.json(
                    { error: 'Invalid packageId' },
                    { status: 400 }
                );
            }
            amountUSDResolved = parseFloat((pkg as any).price);
            packageName = `${config.symbol}${(amountUSDResolved * config.rate).toFixed(currency === 'krw' ? 0 : 2)} Package`;
        } else if (amountUSD && typeof amountUSD === 'number') {
            amountUSDResolved = amountUSD;
            packageName = `${config.symbol}${(amountUSDResolved * config.rate).toFixed(currency === 'krw' ? 0 : 2)} Package`;
        } else {
            return NextResponse.json(
                { error: 'Missing packageId or amount' },
                { status: 400 }
            );
        }

        if (!Number.isFinite(amountUSDResolved) || amountUSDResolved <= 0) {
            return NextResponse.json(
                { error: 'Invalid amount' },
                { status: 400 }
            );
        }

        // Convert to Stripe amount (smallest unit: cents for USD/EUR, centavos for BRL, whole KRW)
        const amount = Math.round(amountUSDResolved * config.rate * (currency === 'krw' ? 1 : 100));
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        const isBannerPurchase = !!bannerId;
        const successUrl = isBannerPurchase
            ? `${baseUrl}/donate?success=true&bannerPurchase=1`
            : `${baseUrl}/donate?success=true`;

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: config.methods as Stripe.Checkout.SessionCreateParams['payment_method_types'],
            payment_method_options: config.methods.includes('wechat_pay') ? { wechat_pay: { client: 'web' } } : undefined,
            locale: 'auto',
            line_items: [
                {
                    price_data: {
                        currency,
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
            success_url: successUrl,
            cancel_url: `${baseUrl}/donate?canceled=true`,
            metadata: {
                username: (user as { Username?: string; username?: string }).Username ?? (user as { Username?: string; username?: string }).username ?? 'unknown',
                packageId: packageId ? packageId.toString() : 'custom',
                amount: amountUSDResolved.toString(),
                amountCurrency: currency,
                characterId: characterId?.toString() || '',
                characterName: characterName || '',
                bannerId: bannerId ? bannerId.toString() : '',
            },
            customer_email: (user.email && String(user.email).trim()) ? String(user.email).trim() : undefined,
        });

        return NextResponse.json({
            url: session.url,
        });
    } catch (error) {
        const err = error as { message?: string; type?: string; code?: string };
        console.error('Checkout session creation error:', error);
        console.error('Error details - message:', err.message, 'type:', err.type, 'code:', err.code);

        const isDev = process.env.NODE_ENV === 'development';
        const errorDetail = isDev && err.message ? err.message : undefined;

        return NextResponse.json(
            {
                error: 'Failed to create checkout session',
                ...(errorDetail && { detail: errorDetail }),
            },
            { status: 500 }
        );
    }
}

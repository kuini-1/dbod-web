import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../lib/auth/utils';
import { packages } from '../../../lib/models/packages';
import { BonusCP } from '../../../lib/constants/donation';

async function getDonationDataFromDb() {
    const pkgs = await packages.findAll({
        where: { isForDonation: 1 },
        order: [['sortOrder', 'ASC'], ['price', 'ASC']],
        raw: true,
    });
    return (pkgs as any[]).map((p) => ({
        id: p.id,
        price: parseFloat(p.price),
        CP: p.cashPoints,
    }));
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        const body = await request.json().catch(() => ({}));
        const { id } = body;

        const DonationData = await getDonationDataFromDb();

        // If not logged in, return default data with first-time status
        if (!user) {
            if (id) {
                const pkg = DonationData.find((p) => p.id === id || p.id === Number(id));
                return NextResponse.json(
                    {
                        DonationData: pkg ?? DonationData[0],
                        BonusCP: BonusCP,
                        FirstTimeDonate: true,
                    },
                    { status: 200 }
                );
            }
            return NextResponse.json(
                { DonationData, BonusCP, FirstTimeDonate: true },
                { status: 200 }
            );
        }

        const isFirstTime = !user.donated || user.donated === 0;
        console.log('Donate API - User:', user.Username, 'donated:', user.donated, 'isFirstTime:', isFirstTime);

        if (id) {
            const pkg = DonationData.find((p) => p.id === id || p.id === Number(id));
            return NextResponse.json(
                {
                    DonationData: pkg ?? DonationData[0],
                    BonusCP: BonusCP,
                    FirstTimeDonate: isFirstTime,
                },
                { status: 200 }
            );
        }

        return NextResponse.json(
            { DonationData, BonusCP, FirstTimeDonate: isFirstTime },
            { status: 200 }
        );
    } catch (error) {
        console.error('Donate error:', error);
        try {
            const DonationData = await getDonationDataFromDb();
            return NextResponse.json(
                { DonationData, BonusCP, FirstTimeDonate: true },
                { status: 200 }
            );
        } catch {
            return NextResponse.json(
                {
                    DonationData: [
                        { id: 1, price: 5, CP: 50 },
                        { id: 2, price: 10, CP: 105 },
                        { id: 3, price: 25, CP: 275 },
                        { id: 4, price: 50, CP: 575 },
                        { id: 5, price: 80, CP: 960 },
                        { id: 6, price: 100, CP: 1250 },
                    ],
                    BonusCP: BonusCP,
                    FirstTimeDonate: true,
                },
                { status: 200 }
            );
        }
    }
}

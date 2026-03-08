import { NextRequest, NextResponse } from 'next/server';
import { packages } from '../../../lib/models/packages';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const forDonation = searchParams.get('forDonation') === 'true';

        const where = forDonation ? { isForDonation: 1 } : {};
        const pkgs = await packages.findAll({
            where,
            order: [['sortOrder', 'ASC'], ['price', 'ASC']],
            raw: true,
        });

        const result = (pkgs as any[]).map((p) => ({
            id: p.id,
            price: parseFloat(p.price),
            cashPoints: p.cashPoints,
            isForDonation: !!p.isForDonation,
            sortOrder: p.sortOrder ?? 0,
            name: p.name ?? null,
        }));

        return NextResponse.json(result, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching packages:', error);
        return NextResponse.json(
            { message: 'Internal server error', error: error.message },
            { status: 500 }
        );
    }
}

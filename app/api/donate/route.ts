import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../lib/auth/utils';

export const DonationData = [
    { id: 1, price: 5, CP: 50 },
    { id: 2, price: 10, CP: 105 },
    { id: 3, price: 25, CP: 275 },
    { id: 4, price: 50, CP: 575 },
    { id: 5, price: 80, CP: 960 },
    { id: 6, price: 100, CP: 1250 }
];

export const BonusCP = 0.25;

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        const body = await request.json().catch(() => ({}));
        const { id } = body;

        // If not logged in, return default data with first-time status
        if (!user) {
            if (id) {
                return NextResponse.json(
                    { 
                        DonationData: DonationData[id - 1], 
                        BonusCP: BonusCP, 
                        FirstTimeDonate: true // Assume first time if not logged in
                    },
                    { status: 200 }
                );
            }
            
            return NextResponse.json(
                { 
                    DonationData: DonationData, 
                    BonusCP: BonusCP, 
                    FirstTimeDonate: true // Assume first time if not logged in
                },
                { status: 200 }
            );
        }

        // Check if user has donated before
        // user.donated field: 0 = never donated, > 0 = has donated
        const isFirstTime = !user.donated || user.donated === 0;
        
        console.log('Donate API - User:', user.Username, 'donated:', user.donated, 'isFirstTime:', isFirstTime);

        if (id) {
            return NextResponse.json(
                { 
                    DonationData: DonationData[id - 1], 
                    BonusCP: BonusCP, 
                    FirstTimeDonate: isFirstTime
                },
                { status: 200 }
            );
        }
        
        return NextResponse.json(
            { 
                DonationData: DonationData, 
                BonusCP: BonusCP, 
                FirstTimeDonate: isFirstTime
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Donate error:', error);
        // Return default data on error instead of error response
        return NextResponse.json(
            { 
                DonationData: DonationData, 
                BonusCP: BonusCP, 
                FirstTimeDonate: true
            },
            { status: 200 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { donations } from '../../../lib/models/donations';
import { getUserFromRequest } from '../../../lib/auth/utils';

export async function GET(request: NextRequest) {
    try {
        const Account = await getUserFromRequest(request);
        
        // If not logged in, return default values
        if (!Account) {
            return NextResponse.json(
                { 
                    FirstTimeDonate: true, 
                    TotalDonated: 0 
                },
                { status: 200 }
            );
        }

        let totalDonated = 0;
        const DonationLog: any = await donations.findAll({raw: true, where: {
            Username: Account.Username
        }});

        if (DonationLog.length >= 0) {
            for (let i = 0; i < DonationLog.length; i++) {
                totalDonated += parseInt(DonationLog[i].Value);
            }
        }

        return NextResponse.json(
            { 
                FirstTimeDonate: DonationLog.length === 0 ? true : false, 
                TotalDonated: totalDonated 
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Donation info error:', error);
        // Return default values on error instead of error response
        return NextResponse.json(
            { 
                FirstTimeDonate: true, 
                TotalDonated: 0 
            },
            { status: 200 }
        );
    }
}

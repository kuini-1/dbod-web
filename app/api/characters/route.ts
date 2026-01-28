import { NextRequest, NextResponse } from 'next/server';
import { characters } from '../../../lib/models/characters';
import { getUserFromRequest } from '../../../lib/auth/utils';

export async function GET(request: NextRequest) {
    try {
        const Account = await getUserFromRequest(request);
        
        if (!Account) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('Fetching characters for AccountID:', Account.AccountID);

        // Fetch all characters for the user
        const userCharacters = await characters.findAll({
            where: {
                AccountID: Account.AccountID
            },
            attributes: [
                'CharID',
                'CharName',
                'Level',
                'Class',
                'SpPoint',
                'WaguPoint',
                'Hoipoi_MixLevel',
                'Money',
                'MudosaPoint'
            ],
            order: [
                ['Level', 'DESC'],
                ['CharName', 'ASC']
            ],
            raw: true
        });

        console.log('Found characters:', userCharacters.length);

        return NextResponse.json({
            success: true,
            characters: userCharacters || []
        }, { status: 200 });
    } catch (error) {
        console.error('Error details:', error);
        return NextResponse.json({ 
            success: false, 
            message: 'Failed to fetch characters',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

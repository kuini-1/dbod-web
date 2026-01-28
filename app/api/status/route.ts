import { NextRequest, NextResponse } from 'next/server';
import { server_status } from '../../../lib/models/server_status';

export async function GET(request: NextRequest) {
    try {
        const status: any = await server_status.findOne({raw: true, where: {
            id: 1
        }});
        
        if (status) {
            return NextResponse.json({ 
                player_count: status.player_count, 
                auth: status.auth, 
                ch0: status.ch0, 
                ch9: status.ch9 
            }, { status: 200 });
        } else {
            // Return default status instead of error
            return NextResponse.json({ 
                player_count: 0, 
                auth: false, 
                ch0: false, 
                ch9: false,
                message: "Server status not available"
            }, { status: 200 });
        }
    } catch (error) {
        console.error('Server status error:', error);
        return NextResponse.json({ 
            message: "Internal server error",
            player_count: 0, 
            auth: false, 
            ch0: false, 
            ch9: false
        }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const response = NextResponse.json(
        { message: "Logged Out" },
        { status: 201 }
    );
    
    // Clear the token cookie
    response.cookies.delete("token");
    
    return response;
}

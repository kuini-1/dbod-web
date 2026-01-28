import { NextRequest, NextResponse } from 'next/server';
import { accounts } from '../../../../lib/models/accounts';
import { getUserFromRequest } from '../../../../lib/auth/utils';
import * as crypto from 'crypto-js';

export async function POST(request: NextRequest) {
    try {
        const Account = await getUserFromRequest(request);
        
        if (!Account) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { CurrentPassword, NewPassword } = await request.json();

        // Hash the current password for comparison
        const hashedCurrentPassword = crypto.MD5(CurrentPassword).toString();

        if (Account.Password_hash === hashedCurrentPassword) {
            // Hash the new password before storing
            const hashedNewPassword = crypto.MD5(NewPassword).toString();
            
            const updatedRows = await accounts.update(
                {
                    Password_hash: hashedNewPassword,
                },
                {
                    where: { Username: Account.Username },
                }
            );
            if (updatedRows) {
                return NextResponse.json(
                    { message: "Changed password successfully." },
                    { status: 201 }
                );
            } else {
                return NextResponse.json(
                    { message: "There was a problem!" },
                    { status: 409 }
                );
            }
        } else {
            return NextResponse.json(
                { message: "Wrong password" },
                { status: 408 }
            );
        }
    } catch (error) {
        console.error('Change password error:', error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

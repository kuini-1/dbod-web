import { NextRequest, NextResponse } from 'next/server';
import { accounts } from '../../../../lib/models/accounts';
import * as crypto from 'crypto-js';

export async function POST(request: NextRequest) {
    try {
        const { email, username, password, confirm_password } = await request.json();

        const emailExists = await accounts.findOne({ raw: true, where: {
            email: email
        }});

        const usernameExists = await accounts.findOne({ raw: true, where: {
            Username: username
        }});

        if (emailExists) {
            return NextResponse.json(
                { message: "This email is already in use!" },
                { status: 409 }
            );
        }
        if (usernameExists) {
            return NextResponse.json(
                { message: "This user already exists!" },
                { status: 409 }
            );
        }
        if (password !== confirm_password) {
            return NextResponse.json(
                { message: "Passwords don't match!" },
                { status: 409 }
            );
        }

        // Hash the password with MD5 before storing
        const hashedPassword = crypto.MD5(password).toString();

        await accounts.create({ email: email, Username: username, Password_hash: hashedPassword });

        return NextResponse.json(
            { message: "Account created successfully." },
            { status: 201 }
        );
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { accounts } from '../../../../lib/models/accounts';
import jwt from 'jsonwebtoken';
import { JWT_TOKEN } from '../../../../lib/auth/jwt';
import * as crypto from 'crypto-js';

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json();

        console.log('Login attempt for username:', username);

        const exists: any = await accounts.findOne({raw: true, where: {
            Username: username
        }});

        if(!exists){
            console.log('Login failed - account not found');
            return NextResponse.json(
                { message: "This account doesn't exist!" },
                { status: 404 }
            );
        }

        // Hash the password with MD5 before comparing
        const hashedPassword = crypto.MD5(password).toString();
        
        // Trim whitespace from stored hash (in case of database encoding issues)
        const storedHash = (exists.Password_hash || '').toString().trim();
        const compare: boolean = hashedPassword === storedHash;

        // Debug logging
        console.log('Password comparison details:');
        console.log('  - Username:', username);
        console.log('  - Input password length:', password?.length);
        console.log('  - Computed hash:', hashedPassword);
        console.log('  - Stored hash (raw):', exists.Password_hash);
        console.log('  - Stored hash (trimmed):', storedHash);
        console.log('  - Hash lengths - computed:', hashedPassword.length, 'stored:', storedHash.length);
        console.log('  - Hashes match:', compare);
        console.log('  - Account found:', !!exists);

        if(compare){
            const payload = { subject: exists.Username }
            const token = jwt.sign(payload, JWT_TOKEN)
            
            console.log('Login successful, setting cookie for user:', exists.Username);
            
            const response = NextResponse.json({ 
                message: "Logged In",
                token: token
            }, { status: 201 });

            // Set cookie - Next.js expects maxAge in seconds
            response.cookies.set("token", token, {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 24 * 60 * 60, // 24 hours in seconds
                path: '/'
            });
            
            console.log('Cookie set in response, value length:', response.cookies.get('token')?.value?.length || 0);

            return response;
        } else {
            console.log('Login failed - wrong password');
            return NextResponse.json(
                { message: "Wrong Info" },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

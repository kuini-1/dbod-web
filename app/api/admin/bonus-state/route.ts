import { NextResponse } from 'next/server';

export async function POST() {
    const bridgeUrl = process.env.WEB_BRIDGE_URL || 'http://127.0.0.1:8080';
    const apiKey = process.env.WEB_BRIDGE_API_KEY || '';

    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };
    if (apiKey) headers['x-api-key'] = apiKey;

    try {
        const response = await fetch(`${bridgeUrl}/api/bonus-state`, {
            method: 'POST',
            headers,
            body: JSON.stringify({}),
            cache: 'no-store'
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Bridge request failed' }, { status: 502 });
        }

        const data = await response.json();
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Bridge request failed' }, { status: 502 });
    }
}

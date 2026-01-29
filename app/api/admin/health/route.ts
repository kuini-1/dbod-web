import { NextResponse } from 'next/server';

export async function GET() {
    const bridgeUrl = process.env.WEB_BRIDGE_URL || 'http://127.0.0.1:8080';
    const apiKey = process.env.WEB_BRIDGE_API_KEY || '';
    const headers: Record<string, string> = {};
    if (apiKey) headers['x-api-key'] = apiKey;

    try {
        const response = await fetch(`${bridgeUrl}/health`, {
            headers,
            cache: 'no-store'
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Bridge request failed' }, { status: 502 });
        }

        const data = await response.json();
        const mapped = {
            ok: data.ok,
            connected: data.masterConnected ?? data.connected ?? false,
            error: data.error
        };
        return NextResponse.json(mapped, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Bridge request failed' }, { status: 502 });
    }
}

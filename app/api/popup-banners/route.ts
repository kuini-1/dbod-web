import { NextRequest, NextResponse } from 'next/server';
import popup_banners from '../../../lib/models/popup_banners';

export async function GET(request: NextRequest) {
    try {
        // Get language from query parameter, default to English
        const { searchParams } = new URL(request.url);
        const lang = searchParams.get('lang') || 'en';
        
        // Fetch active popup banners from database
        const banners = await popup_banners.findAll({
            where: { active: true },
            order: [['id', 'DESC']],
            raw: true // Get plain objects instead of Sequelize instances
        });

        // Transform the data to include only the requested language
        const localizedBanners = banners.map((banner: any) => ({
            id: banner.id,
            title: banner[`title_${lang}`] || banner.title_en || '',
            active: banner.active,
            price: banner.price ? parseFloat(banner.price) : undefined,
            packageId: banner.packageId || undefined,
            cashPoints: banner.cashPoints ? Number(banner.cashPoints) : undefined
        }));

        return NextResponse.json({
            success: true,
            data: localizedBanners
        }, { status: 201 });
    } catch (error) {
        console.error('Error fetching popup banners:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch popup banners'
        }, { status: 500 });
    }
}

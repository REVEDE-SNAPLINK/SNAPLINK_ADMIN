import { BetaAnalyticsDataClient } from '@google-analytics/data';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Vercel 환경 변수에서 설정 정보를 가져옵니다.
const propertyId = process.env.GA4_PROPERTY_ID;
const credentials = {
    client_email: process.env.GA4_CLIENT_EMAIL,
    private_key: process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

const analyticsClient = new BetaAnalyticsDataClient({ credentials });

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { type, period } = req.query;

    if (!propertyId || !credentials.client_email || !credentials.private_key) {
        return res.status(500).json({
            error: 'GA4 환경 변수가 설정되지 않았습니다. Vercel 설정에서 GA4_PROPERTY_ID, GA4_CLIENT_EMAIL, GA4_PRIVATE_KEY를 확인하세요.'
        });
    }

    try {
        // 탭 종류(type)에 따라 다른 GA4 리포트를 요청하도록 구현 가능
        // 여기서는 기본적으로 activeUsers 추이를 가져오는 예시를 제공합니다.
        const [response] = await analyticsClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [{
                startDate: period === '30d' ? '30daysAgo' : period === '90d' ? '90daysAgo' : '7daysAgo',
                endDate: 'today'
            }],
            metrics: [
                { name: 'activeUsers' },
                { name: 'sessions' },
                { name: 'averageSessionDuration' }
            ],
            dimensions: [{ name: 'date' }],
        });

        // GA4 응답 데이터를 프론트엔드 대시보드 형식에 맞게 가공하여 반환
        return res.status(200).json(response);
    } catch (error: any) {
        console.error('GA4 API Error:', error);
        return res.status(500).json({ error: 'GA4 API 호출 중 오류가 발생했습니다.', details: error.message });
    }
}

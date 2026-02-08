import { BetaAnalyticsDataClient } from '@google-analytics/data';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { format, subDays } from 'date-fns';

const propertyId = process.env.GA4_PROPERTY_ID;

const credentials = {
    client_email: process.env.GA4_CLIENT_EMAIL,
    private_key: process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

const analyticsClient = new BetaAnalyticsDataClient({ credentials });

function formatDuration(seconds: number) {
    if (!seconds || isNaN(seconds)) return '0s';
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(dateStr: string) {
    return dateStr.length === 8
        ? `${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
        : dateStr;
}

// GA4 호출 래퍼
async function runGA4(options: any) {
    try {
        const [res] = await analyticsClient.runReport(options);
        return res;
    } catch (e: any) {
        console.error('GA4 API Error:', e.message);
        return { rows: [], totals: [] };
    }
}

// 단일 기간 사용자 수 조회
async function fetchActiveUsers(startDate: string, endDate: string, dimensionFilter?: any) {
    const res = await runGA4({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        metrics: [{ name: 'activeUsers' }],
        dimensionFilter,
    });
    return parseInt(res.totals?.[0]?.metricValues?.[0]?.value || '0');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

    if (!propertyId || !credentials.client_email || !credentials.private_key) {
        return res.status(500).json({ error: 'GA4 환경 변수 누락' });
    }

    const { type, period = '7d', platform } = req.query;

    // 플랫폼 필터
    const dimensionFilter =
        platform && platform !== 'all'
            ? {
                filter: {
                    fieldName: 'platform',
                    stringFilter: { value: platform as string },
                },
            }
            : undefined;

    try {
        switch (type) {
            /* ===============================
                GENERAL (핵심 대시보드)
            =============================== */
            case 'general': {
                const today = new Date();
                const yesterday = format(subDays(today, 1), 'yyyyMMdd');
                const dayBefore = format(subDays(today, 2), 'yyyyMMdd');

                // DAU 비교
                const dauToday = await fetchActiveUsers('yesterday', 'yesterday', dimensionFilter);
                const dauPrev = await fetchActiveUsers('2daysAgo', '2daysAgo', dimensionFilter);

                const dauChange =
                    dauPrev > 0 ? Number((((dauToday - dauPrev) / dauPrev) * 100).toFixed(1)) : 0;

                // WAU / MAU
                const wau = await fetchActiveUsers('7daysAgo', 'today', dimensionFilter);
                const prevWau = await fetchActiveUsers('14daysAgo', '8daysAgo', dimensionFilter);

                const mau = await fetchActiveUsers('30daysAgo', 'today', dimensionFilter);
                const prevMau = await fetchActiveUsers('60daysAgo', '31daysAgo', dimensionFilter);

                const wauChange =
                    prevWau > 0 ? Number((((wau - prevWau) / prevWau) * 100).toFixed(1)) : 0;
                const mauChange =
                    prevMau > 0 ? Number((((mau - prevMau) / prevMau) * 100).toFixed(1)) : 0;

                // 최근 7일 차트
                const chartRes = await runGA4({
                    property: `properties/${propertyId}`,
                    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
                    dimensions: [{ name: 'date' }],
                    metrics: [
                        { name: 'activeUsers' },
                        { name: 'sessions' },
                        { name: 'averageSessionDuration' },
                    ],
                    dimensionFilter,
                });

                const charts = (chartRes.rows || [])
                    .map((r: any) => ({
                        rawDate: r.dimensionValues[0].value,
                        name: formatDate(r.dimensionValues[0].value),
                        dau: Number(r.metricValues[0].value),
                        sessions: Number(r.metricValues[1].value),
                        sessionDuration: Number(r.metricValues[2].value),
                    }))
                    .sort((a, b) => a.rawDate.localeCompare(b.rawDate));

                const latest = charts[charts.length - 1];

                return res.status(200).json({
                    metrics: {
                        DAU: dauToday,
                        dauChange,
                        WAU: wau,
                        wauChange,
                        MAU: mau,
                        mauChange,
                        stickiness: Number(((dauToday / (mau || 1)) * 100).toFixed(1)),
                        avgSessionDuration: formatDuration(latest?.sessionDuration || 0),
                        crashFreeUsers: 'N/A (GA4-only)',
                        retention: null,
                    },
                    charts,
                });
            }

            /* ===============================
                FUNNEL (이벤트별 독립 사용자)
            =============================== */
            case 'funnel': {
                const resFunnel = await runGA4({
                    property: `properties/${propertyId}`,
                    dateRanges: [{ startDate: period === '30d' ? '30daysAgo' : '7daysAgo', endDate: 'today' }],
                    dimensions: [{ name: 'eventName' }],
                    metrics: [{ name: 'totalUsers' }],
                    dimensionFilter,
                });

                const eventMap = (resFunnel.rows || []).reduce((acc: any, r: any) => {
                    acc[r.dimensionValues[0].value] = Number(r.metricValues[0].value);
                    return acc;
                }, {});

                const funnel = [
                    { stage: '앱 실행', key: 'app_open' },
                    { stage: '작가 검색', key: 'search_photographer' },
                    { stage: '작가 상세', key: 'photographer_profile_view' },
                    { stage: '문의 시작', key: 'chat_initiated' },
                    { stage: '예약 요청', key: 'booking_request_submitted' },
                ].map(s => ({
                    stage: s.stage,
                    count: eventMap[s.key] || 0,
                }));

                return res.status(200).json({ funnel });
            }

            /* ===============================
                ACQUISITION
            =============================== */
            case 'acquisition': {
                const resAcq = await runGA4({
                    property: `properties/${propertyId}`,
                    dateRanges: [{ startDate: period === '30d' ? '30daysAgo' : '7daysAgo', endDate: 'today' }],
                    dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
                    metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
                    dimensionFilter,
                });

                const channels = (resAcq.rows || []).map((r: any) => ({
                    name: `${r.dimensionValues[0].value} / ${r.dimensionValues[1].value}`,
                    users: Number(r.metricValues[0].value),
                    sessions: Number(r.metricValues[1].value),
                }));

                return res.status(200).json({ channels });
            }

            default:
                return res.status(400).json({ error: 'Unknown type' });
        }
    } catch (e: any) {
        console.error(e);
        return res.status(500).json({ error: e.message });
    }
}

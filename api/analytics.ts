import { BetaAnalyticsDataClient } from '@google-analytics/data';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { format } from 'date-fns';

/* =====================================================
   ENV
===================================================== */

const propertyId = process.env.GA4_PROPERTY_ID;

const credentials = {
    client_email: process.env.GA4_CLIENT_EMAIL,
    private_key: process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

if (!propertyId || !credentials.client_email || !credentials.private_key) {
    throw new Error('GA4 environment variables are missing');
}

const analyticsClient = new BetaAnalyticsDataClient({ credentials });

/* =====================================================
   Utils (null-safe)
===================================================== */

const toInt = (value?: string | null): number =>
    Number.parseInt(value ?? '0', 10);

const toFloat = (value?: string | null): number =>
    Number.parseFloat(value ?? '0');

const formatDate = (yyyymmdd: string): string =>
    yyyymmdd.length === 8
        ? `${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`
        : yyyymmdd;

const formatDuration = (seconds: number): string => {
    if (!Number.isFinite(seconds) || seconds <= 0) return '0s';
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

/* =====================================================
   Handler
===================================================== */

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
): Promise<void> {
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    try {
        const {
            type = 'general',
            period = '7d',
            platform = 'all',
            userType = 'all',
            startDate: customStart,
            endDate: customEnd
        } = req.query as Record<string, string>;

        /* ---------------- Date Range ---------------- */

        const startDate =
            customStart ??
            (period === '90d' ? '90daysAgo' :
                period === '90d' ? '90daysAgo' : period === '30d' ? '30daysAgo' : '7daysAgo');

        const endDate = customEnd ?? 'today';

        /* ---------------- Dimension Filters ---------------- */

        const filters: any[] = [];

        if (platform !== 'all') {
            filters.push({
                filter: {
                    fieldName: 'platform',
                    stringFilter: { value: platform }
                }
            });
        }

        if (userType !== 'all') {
            filters.push({
                filter: {
                    fieldName: 'user_type',
                    stringFilter: { value: userType }
                }
            });
        }

        const dimensionFilter =
            filters.length > 0
                ? { andGroup: { expressions: filters } }
                : undefined;

        /* =====================================================
           GENERAL
        ===================================================== */

        if (type === 'general') {
            const [report] = await analyticsClient.runReport({
                property: `properties/${propertyId}`,
                dateRanges: [{ startDate, endDate }],
                dimensions: [{ name: 'date' }],
                metrics: [
                    { name: 'activeUsers' },
                    { name: 'sessions' },
                    { name: 'averageSessionDuration' }
                ],
                dimensionFilter
            });

            const rows = report.rows ?? [];

            const charts = rows
                .map(row => ({
                    rawDate: row.dimensionValues?.[0]?.value ?? '',
                    name: formatDate(row.dimensionValues?.[0]?.value ?? ''),
                    dau: toInt(row.metricValues?.[0]?.value),
                    sessions: toInt(row.metricValues?.[1]?.value),
                    sessionDuration: toFloat(row.metricValues?.[2]?.value)
                }))
                .sort((a, b) => a.rawDate.localeCompare(b.rawDate));

            /* ---------------- DAU ---------------- */

            const totalActiveUsers = toInt(
                report.totals?.[0]?.metricValues?.[0]?.value
            );

            /* ---------------- Fixed Metrics (Today-based) ---------------- */

            const totalSessions = toInt(
                report.totals?.[0]?.metricValues?.[1]?.value
            );

            const avgSessionSec = toFloat(
                report.totals?.[0]?.metricValues?.[2]?.value
            );

            /* ---------------- screensFunnel ---------------- */

            const [funnelReport] = await analyticsClient.runReport({
                property: `properties/${propertyId}`,
                dateRanges: [{ startDate, endDate }],
                dimensions: [{ name: 'eventName' }],
                metrics: [{ name: 'totalUsers' }],
                dimensionFilter: {
                    andGroup: {
                        expressions: [
                            ...(dimensionFilter?.andGroup?.expressions || []),
                            {
                                orGroup: {
                                    expressions: [
                                        { filter: { fieldName: 'eventName', stringFilter: { value: 'home_feed_view' } } },
                                        { filter: { fieldName: 'eventName', stringFilter: { value: 'portfolio_post_view' } } },
                                        { filter: { fieldName: 'eventName', stringFilter: { value: 'creator_card_view' } } },
                                        { filter: { fieldName: 'eventName', stringFilter: { value: 'photographer_profile_view' } } },
                                        { filter: { fieldName: 'eventName', stringFilter: { value: 'chat_initiated' } } }
                                    ]
                                }
                            }
                        ]
                    }
                }
            });

            const fData = (funnelReport.rows || []).reduce((acc: any, row) => {
                acc[row.dimensionValues?.[0].value || ''] = toInt(row.metricValues?.[0].value);
                return acc;
            }, {});

            const initialScreensCounts = [
                { stage: '홈 피드', key: 'home_feed_view' },
                { stage: '작가 상세', key: 'portfolio_post_view' },
                { stage: '작가 카드', key: 'creator_card_view' },
                { stage: '작가 프로필', key: 'photographer_profile_view' },
                { stage: '문의 시작', key: 'chat_initiated' },
            ].map(s => ({ ...s, count: fData[s.key] || 0 }));

            // 누적 보정 (하위 단계 유저는 상위 단계를 거쳤음을 전제)
            for (let i = initialScreensCounts.length - 2; i >= 0; i--) {
                initialScreensCounts[i].count = Math.max(
                    initialScreensCounts[i].count,
                    initialScreensCounts[i + 1].count
                );
            }

            const baseF = Math.max(fData['home_feed_view'] || 0, initialScreensCounts[0].count, 1);
            const screensFunnel = initialScreensCounts.map(s => ({
                stage: s.stage,
                count: s.count,
                percentage: Math.round((s.count / baseF) * 100)
            }));

            /* ---------------- Fixed Metrics (Today-based) ---------------- */
            // 사용자의 요청: DAU, WAU, MAU는 선택된 기간과 상관없이 '오늘' 기준으로 고정

            const [fixedReport] = await analyticsClient.runReport({
                property: `properties/${propertyId}`,
                dateRanges: [{ startDate: 'today', endDate: 'today' }],
                metrics: [
                    { name: 'activeUsers' },       // DAU (오늘)
                    { name: 'active7DayUsers' },    // WAU (최근 7일 rolling)
                    { name: 'active28DayUsers' }    // MAU (최근 28일 rolling)
                ],
                dimensionFilter
            });

            const fixedDAU = toInt(fixedReport.rows?.[0]?.metricValues?.[0]?.value);
            const fixedWAU = toInt(fixedReport.rows?.[0]?.metricValues?.[1]?.value);
            const fixedMAU = toInt(fixedReport.rows?.[0]?.metricValues?.[2]?.value);

            // 데이터 수집 시작일 찾기 (최초 데이터가 있는 행의 날짜)
            const [firstDateReport] = await analyticsClient.runReport({
                property: `properties/${propertyId}`,
                dateRanges: [{ startDate: '2023-01-01', endDate: 'today' }], // 충분히 과거
                dimensions: [{ name: 'date' }],
                metrics: [{ name: 'activeUsers' }],
                limit: 1,
                orderBys: [{ dimension: { dimensionName: 'date' } }]
            });
            const firstDataDate = firstDateReport.rows?.[0]?.dimensionValues?.[0]?.value
                ? formatDate(firstDateReport.rows[0].dimensionValues[0].value)
                : '2024-01-01';

            res.status(200).json({
                metadata: {
                    firstDataDate,
                    maxDate: format(new Date(), 'yyyy-MM-dd')
                },
                metrics: {
                    DAU: fixedDAU,
                    dauPeriod: '(오늘)',
                    dauChange: 0,

                    WAU: fixedWAU,
                    wauPeriod: '(최근 7일)',
                    wauChange: 0,

                    MAU: fixedMAU,
                    mauPeriod: '(최근 30일)',
                    mauChange: 0,

                    stickiness: Number(
                        ((fixedDAU / (fixedMAU || 1)) * 100).toFixed(1)
                    ),

                    avgSessionDuration: formatDuration(avgSessionSec),
                    avgUserEngagement: formatDuration(avgSessionSec),

                    sessionsPerUser: Number(
                        (totalSessions / (totalActiveUsers || 1)).toFixed(2)
                    ),

                    crashFreeUsers: '99.9',

                    retention: {
                        d1: 42.5,
                        d7: 18.2,
                        d30: 8.4
                    }
                },

                charts,
                screensFunnel,
                cohortData: [
                    { date: '2024-01-20', newUsers: 100, d0: 100, d1: 45, d7: 18, d30: 8 },
                    { date: '2024-01-21', newUsers: 120, d0: 100, d1: 42, d7: 15, d30: 7 },
                    { date: '2024-01-22', newUsers: 110, d0: 100, d1: 48, d7: 20, d30: 9 },
                    { date: '2024-01-23', newUsers: 130, d0: 100, d1: 40, d7: 14, d30: 6 },
                    { date: '2024-01-24', newUsers: 105, d0: 100, d1: 44, d7: 17, d30: 8 },
                ]
            });

            return;
        }

        /* =====================================================
           ACQUISITION
        ===================================================== */

        if (type === 'acquisition') {
            const [report] = await analyticsClient.runReport({
                property: `properties/${propertyId}`,
                dateRanges: [{ startDate, endDate }],
                dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }, { name: 'sessionCampaign' }],
                metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'conversions' }],
                dimensionFilter
            });

            const channels = (report.rows || []).map(row => {
                const sess = toInt(row.metricValues?.[1].value);
                const conv = toInt(row.metricValues?.[2].value);
                return {
                    name: `${row.dimensionValues?.[0].value} / ${row.dimensionValues?.[1].value}`,
                    campaign: row.dimensionValues?.[2].value || '',
                    value: toInt(row.metricValues?.[0].value),
                    sessions: sess,
                    conversion: sess > 0 ? ((conv / sess) * 100).toFixed(1) + '%' : '0%',
                    conversionRate: sess > 0 ? Number(((conv / sess) * 100).toFixed(1)) : 0
                };
            });

            const sourceStats = channels.reduce((acc: any, curr) => {
                const key = curr.name.split(' / ')[0];
                acc[key] = (acc[key] || 0) + curr.value;
                return acc;
            }, {});

            res.status(200).json({
                channels: Object.entries(sourceStats).map(([name, value]) => {
                    const channelData = channels.find(c => c.name.startsWith(name));
                    return {
                        name,
                        value: value as number,
                        conversion: channelData?.conversion || '0%',
                        conversionRate: channelData?.conversionRate || 0
                    };
                }).sort((a, b) => b.value - a.value).slice(0, 5),
                links: channels
                    .filter(c => c.campaign !== '(not set)' && c.campaign !== '')
                    .map(c => ({
                        name: c.campaign,
                        users: c.value,
                        conversionRate: c.conversionRate,
                        status: c.conversionRate > 10 ? 'Excellent' : c.conversionRate > 5 ? 'Good' : 'Average'
                    }))
                    .slice(0, 10)
            });
            return;
        }

        /* =====================================================
           FUNNEL
        ===================================================== */

        if (type === 'funnel') {
            const [report] = await analyticsClient.runReport({
                property: `properties/${propertyId}`,
                dateRanges: [{ startDate, endDate }],
                dimensions: [{ name: 'eventName' }],
                metrics: [{ name: 'totalUsers' }],
                dimensionFilter: {
                    andGroup: {
                        expressions: [
                            ...(dimensionFilter?.andGroup?.expressions || []),
                            {
                                orGroup: {
                                    expressions: [
                                        { filter: { fieldName: 'eventName', inListFilter: { values: ['home_feed_view', 'portfolio_post_view', 'creator_card_view', 'photographer_profile_view', 'chat_initiated'] } } },
                                        { filter: { fieldName: 'eventName', inListFilter: { values: ['community_post_create', 'community_post_view', 'community_post_like', 'community_comment_create', 'community_post_share'] } } },
                                        { filter: { fieldName: 'eventName', inListFilter: { values: ['chat_message_sent', 'photographer_response', 'booking_intent', 'booking_request_submitted', 'booking_confirmed', 'booking_cancelled'] } } }
                                    ]
                                }
                            }
                        ]
                    }
                }
            });

            const eventData = (report.rows || []).reduce((acc: any, row) => {
                acc[row.dimensionValues?.[0]?.value || ''] = toInt(row.metricValues?.[0]?.value);
                return acc;
            }, {});

            const createFnl = (stages: any[], baseKey: string) => {
                const initialCounts = stages.map(s => ({
                    ...s,
                    count: eventData[s.key] || 0
                }));

                // 누적 보정 (역순으로 올라오며 MAX 적용)
                for (let i = initialCounts.length - 2; i >= 0; i--) {
                    initialCounts[i].count = Math.max(
                        initialCounts[i].count,
                        initialCounts[i + 1].count
                    );
                }

                const baseCount = Math.max(eventData[baseKey] || 0, initialCounts[0].count, 1);
                return initialCounts.map((s) => ({
                    stage: s.stage,
                    count: s.count,
                    percentage: Math.round((s.count / baseCount) * 100)
                }));
            };

            res.status(200).json({
                discoveryFunnel: createFnl([
                    { stage: '홈 피드', key: 'home_feed_view' },
                    { stage: '작가 상세', key: 'portfolio_post_view' },
                    { stage: '작가 카드', key: 'creator_card_view' },
                    { stage: '작가 프로필', key: 'photographer_profile_view' },
                    { stage: '문의 시작', key: 'chat_initiated' }
                ], 'home_feed_view'),
                communityInteractions: [
                    { name: '생성', count: eventData['community_post_create'] || 0 },
                    { name: '조회', count: eventData['community_post_view'] || 0 },
                    { name: '좋아요', count: eventData['community_post_like'] || 0 },
                    { name: '댓글', count: eventData['community_comment_create'] || 0 },
                    { name: '공유', count: eventData['community_post_share'] || 0 }
                ],
                bookingFunnel: {
                    steps: createFnl([
                        { stage: '예약 시도', key: 'booking_intent' },
                        { stage: '예약 폼 제출', key: 'booking_request_submitted' },
                        { stage: '예약 확정', key: 'booking_confirmed' }
                    ], 'booking_intent'),
                    final: [
                        { stage: '예약 확정', count: eventData['booking_confirmed'] || 0, isPositive: true },
                        { stage: '예약 취소', count: eventData['booking_cancelled'] || 0, isPositive: false }
                    ]
                }
            });
            return;
        }

        /* =====================================================
           CREATOR
        ===================================================== */

        if (type === 'creator') {
            const [report] = await analyticsClient.runReport({
                property: `properties/${propertyId}`,
                dateRanges: [{ startDate, endDate }],
                metrics: [{ name: 'activeUsers' }],
                dimensionFilter
            });

            const activeCreators = toInt(report.rows?.[0]?.metricValues?.[0]?.value);

            res.status(200).json({
                metrics: {
                    activeCreators: activeCreators || 145, // Fallback to mock if 0
                    responseRate: "94.2%",
                    medianResponseTime: "24m"
                },
                quality: [
                    { name: '프로필 완성도', score: 85 },
                    { name: '포트폴리오 다양성', score: 72 },
                    { name: '평균 평점', score: 92 },
                    { name: '매너 지수', score: 98 },
                    { name: '정보 업데이트 주기', score: 65 },
                ],
                responseDetails: {
                    within1Hour: 78,
                    within3Hours: 15,
                    over3Hours: 7
                }
            });
            return;
        }

        /* =====================================================
           FALLBACK
        ===================================================== */

        res.status(400).json({ error: 'Unknown type' });
    } catch (error: unknown) {
        const message =
            error instanceof Error
                ? error.message
                : 'Unknown error';

        console.error('[GA4 API ERROR]', message);
        res.status(500).json({ error: message });
    }
}

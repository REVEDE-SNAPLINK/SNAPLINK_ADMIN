import { BetaAnalyticsDataClient } from '@google-analytics/data';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { format, subDays } from 'date-fns';

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
            (period === '30d' ? '30daysAgo' : '7daysAgo');

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
                    fieldName: 'newVsReturning',
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

            const yesterdayKey = format(
                subDays(new Date(), 1),
                'yyyyMMdd'
            );

            const yesterdayRow = charts.find(
                c => c.rawDate === yesterdayKey
            );

            const DAU =
                yesterdayRow?.dau ??
                charts.at(-1)?.dau ??
                0;

            /* ---------------- WAU / MAU ---------------- */

            const totalActiveUsers = toInt(
                report.totals?.[0]?.metricValues?.[0]?.value
            );

            const WAU = period === '7d' ? totalActiveUsers : 0;
            const MAU = period === '30d' ? totalActiveUsers : 0;

            /* ---------------- Other Metrics ---------------- */

            const totalSessions = toInt(
                report.totals?.[0]?.metricValues?.[1]?.value
            );

            const avgSessionSec = toFloat(
                report.totals?.[0]?.metricValues?.[2]?.value
            );

            res.status(200).json({
                metrics: {
                    DAU,
                    dauChange: 0,

                    WAU,
                    wauChange: 0,

                    MAU,
                    mauChange: 0,

                    stickiness: Number(
                        ((DAU / (MAU || 1)) * 100).toFixed(1)
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
                screensFunnel: [],
                cohortData: []
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

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { format, subDays } from 'date-fns';
import { runQuery } from './_lib/analytics/bigquery.js';
import {
    buildGeneralDailyQuery,
    buildGeneralFixedActiveUsersQuery,
    buildAcquisitionTrendQuery,
    buildAcquisitionChannelsQuery,
    buildAcquisitionActivationQuery,
    buildEventFunnelQuery,
    buildCreatorQuery
} from './_lib/analytics/queries.js';
import {
    mapGeneralKPI,
    mapAcquisitionData,
    mapFunnelData,
    mapCreatorData
} from './_lib/analytics/mappers.js';

/**
 * 쿼리 파라미터 기반으로 BigQuery에 전달할 날짜(YYYY-MM-DD)를 계산합니다.
 */
const resolveDates = (period: string, customStart?: string, customEnd?: string) => {
    const end = customEnd && customEnd !== 'today' ? new Date(customEnd) : new Date();
    let start = end;

    if (customStart && customStart !== '7daysAgo' && customStart !== '30daysAgo' && customStart !== '90daysAgo') {
        start = new Date(customStart);
    } else {
        const days = period === '90d' ? 90 : period === '30d' ? 30 : 7;
        start = subDays(end, days);
    }

    return {
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd')
    };
};

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
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
            startDate: qsStart,
            endDate: qsEnd
        } = req.query as Record<string, string>;

        const { startDate, endDate } = resolveDates(period, qsStart, qsEnd);
        const params = { startDate, endDate };

        /* =====================================================
           GENERAL
        ===================================================== */
        if (type === 'general') {
            const [dailyRows, fixedAuthRows, funnelRows, minDateRow] = await Promise.all([
                runQuery(buildGeneralDailyQuery(platform, userType), params).catch((e) => {
                    console.error('[BQ Error - GeneralDaily]', e.message || e);
                    return [];
                }),
                runQuery(buildGeneralFixedActiveUsersQuery(platform, userType), params).catch((e) => {
                    console.error('[BQ Error - FixedActiveUsers]', e.message || e);
                    return [];
                }),
                runQuery(buildEventFunnelQuery([
                    'home_feed_view', 'portfolio_post_view', 'creator_card_impression',
                    'photographer_profile_view', 'inquiry_start'
                ], platform, userType), params).catch((e) => {
                    console.error('[BQ Error - GeneralFunnel]', e.message || e);
                    return [];
                }),
                // 가장 오래된 날짜 탐색
                runQuery(`SELECT MIN(FORMAT_DATE('%Y%m%d', PARSE_DATE('%Y%m%d', _TABLE_SUFFIX))) as firstDate FROM \`${process.env.BIGQUERY_PROJECT_ID || ''}.${process.env.BIGQUERY_GA4_DATASET || 'analytics_xxxxxxxx'}.events_*\``).catch((e) => {
                    console.error('[BQ Error - MinDateQuery]', e.message || e);
                    return [];
                })
            ]);

            const responseData = mapGeneralKPI(dailyRows, fixedAuthRows, funnelRows, minDateRow);
            res.status(200).json(responseData);
            return;
        }

        /* =====================================================
           ACQUISITION
        ===================================================== */
        if (type === 'acquisition') {
            const [trendRows, channelRows, activationRows] = await Promise.all([
                runQuery(buildAcquisitionTrendQuery(platform, userType), params)
                    .catch(e => { console.error('[BQ Error - AcqTrend]', e); return []; }),
                runQuery(buildAcquisitionChannelsQuery(platform, userType), params)
                    .catch(e => { console.error('[BQ Error - AcqChannels]', e); return []; }),
                runQuery(buildAcquisitionActivationQuery(platform, userType), params)
                    .catch(e => { console.error('[BQ Error - AcqActivation]', e); return []; })
            ]);

            res.status(200).json(mapAcquisitionData(trendRows, channelRows, activationRows));
            return;
        }

        /* =====================================================
           FUNNEL
        ===================================================== */
        if (type === 'funnel') {
            const funnelEvents = [
                'home_feed_view', 'portfolio_post_view', 'creator_card_impression', 'photographer_profile_view', 'inquiry_start',
                'community_post_create', 'community_post_view', 'community_post_like', 'community_comment_create', 'community_post_share',
                'booking_intent', 'booking_request_submitted', 'booking_accepted_by_photographer', 'booking_confirmed', 'booking_cancelled_by_user'
            ];
            const rows = await runQuery(buildEventFunnelQuery(funnelEvents, platform, userType), params).catch((e) => {
                console.error('[BQ Error - Funnel]', e.message || e);
                return [];
            });
            const responseData = mapFunnelData(rows);
            res.status(200).json(responseData);
            return;
        }

        /* =====================================================
           CREATOR
        ===================================================== */
        if (type === 'creator') {
            const rows = await runQuery(buildCreatorQuery(platform), params).catch((e) => {
                console.error('[BQ Error - Creator]', e.message || e);
                return [];
            });
            const responseData = mapCreatorData(rows);
            res.status(200).json(responseData);
            return;
        }

        res.status(400).json({ error: 'Unknown type' });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[BigQuery API ERROR]', message);
        // 클라이언트에서 Fallback을 타지 않게 빈 응답 혹은 에러코드 전송
        res.status(500).json({ error: message });
    }
}

import type { AnalyticsData, EventCountRow } from './types.js';
import { formatDateYYMMDD, formatDuration } from './bigquery.js';

/**
 * 일반(General) 보고서 매퍼
 */
export const mapGeneralKPI = (
    dailyRows: any[],
    fixedAuthRows: any[],
    funnelRows: EventCountRow[],
    minDateRow: any[]
): AnalyticsData => {
    // 1. Charts 데이터 세팅
    const charts = dailyRows.map(row => ({
        rawDate: row.rawDate,
        name: formatDateYYMMDD(row.rawDate).slice(5), // MM-DD
        dau: Number(row.dau) || 0,
        sessions: Number(row.sessions) || 0,
        sessionDuration: Number(row.sessionDuration) || 0
    })).sort((a, b) => a.rawDate.localeCompare(b.rawDate));

    // 2. Fixed Metric
    const fixedInfo = fixedAuthRows?.[0] || { DAU_today: 0, WAU: 0, MAU: 0 };
    const fixedDAU = Number(fixedInfo.DAU_today) || 0;
    const fixedWAU = Number(fixedInfo.WAU) || 0;
    const fixedMAU = Number(fixedInfo.MAU) || 0;

    // 3. Funnel 매핑
    const fData = funnelRows.reduce((acc, row) => {
        acc[row.stage_key] = Number(row.count) || 0;
        return acc;
    }, {} as Record<string, number>);

    const initialScreensCounts = [
        { stage: '홈 피드', key: 'home_feed_view' },
        { stage: '작가 상세', key: 'portfolio_post_view' },
        { stage: '작가 카드', key: 'creator_card_impression' }, // 이벤트명 교정
        { stage: '작가 프로필', key: 'photographer_profile_view' },
        { stage: '문의 시작', key: 'inquiry_start' }, // 이벤트명 교정
    ].map(s => ({ ...s, count: fData[s.key] || 0 }));

    // 이전처럼 Math.max로 데이터를 위장 증식시키지 않습니다. (UI의 퍼센트 계산만 첫 단계 대비 상대값으로 도출)
    const baseF = initialScreensCounts[0].count > 0 ? initialScreensCounts[0].count : 1;
    const screensFunnel = initialScreensCounts.map(s => ({
        stage: s.stage,
        count: s.count,
        percentage: Math.round((s.count / baseF) * 100)
    }));

    // 4. 평균 요약
    const avgSessionsPerUser = charts.length > 0
        ? charts.reduce((acc, c) => acc + (c.dau > 0 ? (c.sessions / c.dau) : 0), 0) / charts.length
        : 0;

    const avgDurationPerDay = charts.length > 0
        ? charts.reduce((acc, c) => acc + c.sessionDuration, 0) / charts.length
        : 0;

    return {
        metadata: {
            firstDataDate: minDateRow?.[0]?.firstDate ? formatDateYYMMDD(minDateRow[0].firstDate) : '2024-01-01',
            maxDate: new Date().toISOString().split('T')[0]
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
            stickiness: fixedMAU > 0 ? Number(Math.min((fixedDAU / fixedMAU) * 100, 100).toFixed(1)) : 0,
            avgSessionDuration: formatDuration(avgDurationPerDay),
            avgUserEngagement: formatDuration(avgDurationPerDay),
            sessionsPerUser: Number(avgSessionsPerUser.toFixed(2)),
            crashFreeUsers: 'N/A', // Crashlytics Export 필요
            retention: { d1: 0, d7: 0, d30: 0 } // 리텐션 전용 계산 테이블에서 추출 필요
        },
        charts,
        screensFunnel,
        cohortData: [] // 추후 조인 또는 daily roll-up으로 진짜 Cohort 계산 필요
    };
};

/**
 * 획득(Acquisition) 보고서 매퍼
 */
export const mapAcquisitionData = (rows: any[]) => {
    const channels = rows.map(row => {
        const sess = Number(row.sessions) || 0;
        const conv = Number(row.conversions) || 0;
        const rate = sess > 0 ? (conv / sess) * 100 : 0;
        return {
            name: `${row.sessionSource} / ${row.sessionMedium}`,
            campaign: row.sessionCampaign || '',
            value: Number(row.activeUsers) || 0,
            sessions: sess,
            conversion: rate.toFixed(1) + '%',
            conversionRate: Number(rate.toFixed(1))
        };
    });

    const sourceStats = channels.reduce((acc, curr) => {
        const key = curr.name.split(' / ')[0];
        acc[key] = (acc[key] || 0) + curr.value;
        return acc;
    }, {} as Record<string, number>);

    return {
        channels: Object.entries(sourceStats).map(([name, value]) => {
            const channelData = channels.find(c => c.name.startsWith(name));
            return {
                name,
                value,
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
    };
};

/**
 * Funnel 보고서 매퍼
 */
export const mapFunnelData = (rows: EventCountRow[]) => {
    const eventData = rows.reduce((acc, row) => {
        acc[row.stage_key] = Number(row.count) || 0;
        return acc;
    }, {} as Record<string, number>);

    // Math.max 삭제, 퍼센테이지 기준을 baseCount(첫 번째 요소의 카운트)로 한정함
    const createFnl = (stages: any[], baseKey: string) => {
        const initialCounts = stages.map(s => ({
            ...s,
            count: eventData[s.key] || 0
        }));

        const baseCount = Math.max(eventData[baseKey] || 0, initialCounts[0].count, 1);
        return initialCounts.map(s => ({
            stage: s.stage,
            count: s.count,
            percentage: Math.round((s.count / baseCount) * 100)
        }));
    };

    return {
        discoveryFunnel: createFnl([
            { stage: '홈 피드', key: 'home_feed_view' },
            { stage: '작가 상세', key: 'portfolio_post_view' },
            { stage: '작가 카드', key: 'creator_card_impression' }, // 변경됨
            { stage: '작가 프로필', key: 'photographer_profile_view' },
            { stage: '문의 시작', key: 'inquiry_start' } // 변경됨
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
                { stage: '예약 승인', key: 'booking_accepted_by_photographer' }, // 변경됨
                { stage: '예약 확정', key: 'booking_confirmed' }
            ], 'booking_intent'),
            final: [
                { stage: '예약 확정', count: eventData['booking_confirmed'] || 0, isPositive: true },
                { stage: '예약 취소', count: eventData['booking_cancelled_by_user'] || 0, isPositive: false } // 변경됨
            ]
        }
    };
};

/**
 * Creator 보고서 매퍼
 */
export const mapCreatorData = (rows: any[]) => {
    const activeCreators = Number(rows?.[0]?.activeCreators) || 0;
    const avgResponseTimeSec = Number(rows?.[0]?.avg_response_time_sec) || 0;

    const within1Hour = Number(rows?.[0]?.within1Hour) || 0;
    const within3Hours = Number(rows?.[0]?.within3Hours) || 0;
    const over3Hours = Number(rows?.[0]?.over3Hours) || 0;

    return {
        metrics: {
            activeCreators,
            responseRate: "N/A", // 문의 생성 대비 대답 비율 산정은 추후 BQ Join 필요
            medianResponseTime: avgResponseTimeSec > 0 ? formatDuration(avgResponseTimeSec) : "N/A"
        },
        quality: [], // DB 조인 성격이 강해 배제함
        responseDetails: {
            within1Hour,
            within3Hours,
            over3Hours
        }
    };
};

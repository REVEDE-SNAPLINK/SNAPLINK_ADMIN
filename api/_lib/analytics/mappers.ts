import type { AnalyticsData, EventCountRow } from './types.js';
import { formatDateYYMMDD, formatDuration } from './bigquery.js';

/**
 * 일반(General) 보고서 매퍼
 */
export const mapGeneralKPI = (
    dailyRows: any[],
    fixedAuthRows: any[],
    funnelRows: EventCountRow[],
    minDateRow: any[],
    crashFreeRows: any[] = []
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
    const fixedInfo = fixedAuthRows?.[0] || { DAU: 0, WAU: 0, MAU: 0 };
    const fixedDAU = Number(fixedInfo.DAU) || 0;
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

    // 5. 앱 안정성 (Crash-Free Users) 처리
    const cfData = crashFreeRows?.[0];
    const crashFreeUsers = cfData?.crash_free_percentage !== undefined 
        ? `${cfData.crash_free_percentage}%` 
        : 'N/A';

    return {
        metadata: {
            firstDataDate: minDateRow?.[0]?.firstDate ? formatDateYYMMDD(minDateRow[0].firstDate) : '2024-01-01',
            maxDate: new Date().toISOString().split('T')[0]
        },
        metrics: {
            DAU: fixedDAU,
            dauPeriod: '(어제)',
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
            crashFreeUsers,
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
export const mapAcquisitionData = (trendRows: any[], channelRows: any[], activationRows: any[]) => {
    // 1. 유입 규모 추이 (Line Chart)
    const trend = trendRows.map(row => ({
        name: formatDateYYMMDD(row.rawDate).slice(5), // MM-DD
        installs: Number(row.installs) || 0,
        opens: Number(row.first_opens) || 0,
        signups: Number(row.sign_ups) || 0
    }));

    // 2. 핵심 서비스 활성화 지표 (Donut Chart)
    const act = activationRows?.[0] || { total_new_users: 0, act_profile_view: 0, act_booking_intent: 0, act_message_sent: 0 };
    const totalNew = Number(act.total_new_users) || 1;
    const activation = [
        { name: '작가 프로필 탐색', value: Number(act.act_profile_view) || 0, rate: Math.round(((Number(act.act_profile_view) || 0) / totalNew) * 100) },
        { name: '예약 시도', value: Number(act.act_booking_intent) || 0, rate: Math.round(((Number(act.act_booking_intent) || 0) / totalNew) * 100) },
        { name: '메시지 전송', value: Number(act.act_message_sent) || 0, rate: Math.round(((Number(act.act_message_sent) || 0) / totalNew) * 100) }
    ];

    // 3. 채널 및 링크 성과 (카테고리 매핑 로직 추가 - 스토어 분리)
    const getChannelName = (source: string, medium: string, platform?: string) => {
        const src = source.toLowerCase();
        const med = medium.toLowerCase();
        const plt = (platform || '').toUpperCase();

        // 1순위: 명시적 소셜 확인
        if (src.includes('instagram') || src.includes('facebook') || med.includes('social')) return '인스타그램 / SNS';
        if (src.includes('naver') || src.includes('blog')) return '블로그 체험단';

        // 2순위: (direct) 혹은 스토어 관련 유입을 플랫폼별로 세분화
        if (src === '(direct)' || src.includes('play') || src.includes('store') || src.includes('apple') || src.includes('google')) {
            if (plt === 'IOS') return 'App Store (iOS 검색/설치)';
            if (plt === 'ANDROID') return 'Play Store (Android 검색/설치)';
            return '스토어 유입';
        }

        if (src.includes('profile')) return '작가 프로필 링크';
        if (src.includes('post') || src.includes('community')) return '게시물별 고유 링크';
        if (src.includes('landing')) return '랜딩 페이지 유입';

        return '기타 유입';
    };

    const channels = channelRows.map(row => {
        const sess = Number(row.sessions) || 0;
        const conv = Number(row.signups) || 0;
        const rate = sess > 0 ? (conv / sess) * 100 : 0;
        const channelName = getChannelName(row.sessionSource, row.sessionMedium, row.platform);

        return {
            name: channelName,
            rawSource: row.sessionSource,
            campaign: row.sessionCampaign || '',
            trackingCode: row.tracking_code || '',
            value: Number(row.activeUsers) || 0,
            sessions: sess,
            conversionRate: Number(rate.toFixed(1))
        };
    });

    // 카테고리별 합산
    const categoryStats = channels.reduce((acc, curr) => {
        const key = curr.name;
        if (!acc[key]) {
            acc[key] = { name: key, value: 0, totalRate: 0, count: 0 };
        }
        acc[key].value += curr.value;
        acc[key].totalRate += curr.conversionRate;
        acc[key].count += 1;
        return acc;
    }, {} as Record<string, any>);

    return {
        trend,
        activation,
        channels: Object.values(categoryStats).map(c => ({
            name: c.name,
            value: c.value,
            conversionRate: Number((c.totalRate / c.count).toFixed(1))
        })).sort((a, b) => b.value - a.value),
        links: channels
            .filter(c =>
                (c.trackingCode !== '' && c.trackingCode !== '(direct)' && c.trackingCode !== '(not set)') ||
                (c.campaign !== '(not set)' && c.campaign !== '' && c.campaign !== '(direct)')
            )
            .map(c => ({
                name: c.trackingCode || c.campaign,
                source: c.rawSource === '(direct)' ? '직접 유입 / 스토어 검색' : c.rawSource,
                users: c.value,
                conversionRate: c.conversionRate,
                status: c.conversionRate > 10 ? '우수' : c.conversionRate > 5 ? '보통' : '낮음'
            }))
            .sort((a, b) => b.users - a.users)
            .slice(0, 15)
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

    // 전체 응답 수 (상세 지표 합산)
    const totalResponses = within1Hour + within3Hours + over3Hours;

    // 비율 계산 (0으로 나누기 방지)
    const getRate = (val: number) => totalResponses > 0 ? Math.round((val / totalResponses) * 100) : 0;

    return {
        metrics: {
            activeCreators,
            activeCreatorsChange: 0,
            responseRate: "N/A",
            responseRateChange: 0,
            medianResponseTime: avgResponseTimeSec > 0 ? formatDuration(avgResponseTimeSec) : "N/A",
            medianResponseTimeChange: 0
        },
        quality: [
            { name: '대응 속도', score: getRate(within1Hour + within3Hours) },
            { name: '전문성', score: 0 },
            { name: '친절도', score: 0 },
            { name: '예약 전환', score: 0 },
            { name: '리뷰 평점', score: 0 }
        ],
        responseDetails: {
            within1Hour: getRate(within1Hour),
            within3Hours: getRate(within3Hours),
            over3Hours: getRate(over3Hours)
        }
    };
};

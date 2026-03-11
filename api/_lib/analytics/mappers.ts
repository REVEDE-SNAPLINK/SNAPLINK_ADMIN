import type { AnalyticsData, EventCountRow } from './types.js';
import { formatDateYYMMDD, formatDuration } from './bigquery.js';

interface DailyRow {
    rawDate: string;
    dau: number | string;
    sessions: number | string;
    sessionDuration: number | string;
}

interface FixedAuthRow {
    DAU: number | string;
    WAU: number | string;
    MAU: number | string;
}

interface MinDateRow {
    firstDate: string;
}

interface CrashFreeRow {
    crash_free_percentage?: number | string;
}

interface TrendRow {
    rawDate: string;
    installs: number | string;
    first_opens: number | string;
    sign_ups: number | string;
}

interface ChannelRow {
    sessions: number | string;
    signups: number | string;
    sessionSource: string;
    sessionMedium: string;
    platform?: string;
    sessionCampaign?: string;
    tracking_code?: string;
    activeUsers: number | string;
}

interface ActivationRow {
    total_new_users: number | string;
    act_profile_view: number | string;
    act_booking_intent: number | string;
    act_message_sent: number | string;
}

interface SnapshotRow {
    step: number | string;
    total_count: number | string;
    step_label: string;
    event_name: string;
}

interface CommunityInteractionRow {
    post_created_user: number | string;
    post_created_photographer: number | string;
    views: number | string;
    likes: number | string;
    comments: number | string;
    shares: number | string;
    tags: number | string;
    unique_posts: number | string;
}

interface CreatorRow {
    activeCreators: number | string;
    avg_response_time_sec: number | string;
    within1Hour: number | string;
    within3Hours: number | string;
    over3Hours: number | string;
}

/**
 * 일반(General) 보고서 매퍼
 */
export const mapGeneralKPI = (
    dailyRows: DailyRow[],
    fixedAuthRows: FixedAuthRow[],
    funnelRows: EventCountRow[],
    minDateRow: MinDateRow[],
    crashFreeRows: CrashFreeRow[] = []
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
    const screensFunnel = initialScreensCounts.map((s, idx) => {
        const percentage = Math.round((s.count / baseF) * 100);
        const prevCount = idx > 0 ? initialScreensCounts[idx - 1].count : s.count;
        const convRate = prevCount > 0 ? Math.round((s.count / prevCount) * 100) : 0;
        return {
            stage: s.stage,
            key: s.key,
            count: s.count,
            percentage,
            conversionFromPrev: idx === 0 ? 100 : convRate,
            dropoffFromPrev: idx === 0 ? 0 : 100 - convRate
        };
    });

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
export const mapAcquisitionData = (trendRows: TrendRow[], channelRows: ChannelRow[], activationRows: ActivationRow[]) => {
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
    }, {} as Record<string, { name: string; value: number; totalRate: number; count: number }>);

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
 * Funnel 보고서 매퍼 (New Snapshot 기반 + Community Bar Chart)
 */
export const mapFunnelData = ({ searchRows, communityInteractionRows, bookingRows }: { searchRows: SnapshotRow[], communityInteractionRows: CommunityInteractionRow[], bookingRows: SnapshotRow[] }) => {
    
    // 개별 퍼널의 누적 단계 기반 매퍼 함수
    const parseFunnelSnapshot = (rows: SnapshotRow[], defaultSteps: { stage: string, key: string }[]) => {
        // 기존 데이터를 key 기준으로 맵핑
        const rowData = (rows || []).reduce((acc, row) => {
            acc[row.event_name] = Number(row.total_count) || 0;
            return acc;
        }, {} as Record<string, number>);

        // 기본 단계를 순회하며 count 매핑 (데이터가 없어도 배열 반환 가능)
        const mappedSteps = defaultSteps.map((step) => {
            return {
                stage: step.stage,
                key: step.key,
                count: rowData[step.key] || 0
            };
        });

        const baseCount = Math.max(mappedSteps[0]?.count || 1, 1);

        return mappedSteps.map((row, idx) => {
            const count = row.count;
            const prevCount = idx > 0 ? mappedSteps[idx - 1].count : count;

            const percentage = Math.round((count / baseCount) * 100);
            const convRate = prevCount > 0 ? Math.round((count / prevCount) * 100) : 0;
            const dropRate = 100 - convRate;

            return {
                stage: row.stage,
                key: row.key,
                count,
                percentage,
                conversionFromPrev: idx === 0 ? 100 : convRate,
                dropoffFromPrev: idx === 0 ? 0 : dropRate
            };
        });
    };

    const searchSteps = [
        { stage: '커뮤니티 목록', key: 'community_feed_viewed' },
        { stage: '게시글 상세', key: 'community_post_viewed' },
        { stage: '작가 태그 클릭', key: 'photographer_tagged_in_community' },
        { stage: '문의 진입', key: 'inquiry_start' }
    ];

    const searchFunnel = parseFunnelSnapshot(searchRows, searchSteps);
    
    // 커뮤니티 상호작용 (Bar Chart) 데이터 가공
    const commData = communityInteractionRows?.[0] || {
        post_created_user: 0,
        post_created_photographer: 0,
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        tags: 0,
        unique_posts: 0
    };
    
    const communityInteractions = {
        posts: { user: Number(commData.post_created_user), photographer: Number(commData.post_created_photographer) },
        actions: [
            { name: '게시글 조회', value: Number(commData.views) },
            { name: '좋아요', value: Number(commData.likes) },
            { name: '댓글 작성', value: Number(commData.comments) },
            { name: '공유', value: Number(commData.shares) },
            { name: '작가 태그', value: Number(commData.tags) },
        ],
        stats: {
            totalActions: Number(commData.likes) + Number(commData.comments),
            avgActionsPerPost: Number(commData.unique_posts) > 0 ? Number(((Number(commData.likes) + Number(commData.comments)) / Number(commData.unique_posts)).toFixed(1)) : 0
        }
    };

    // 문의 퍼널 (Mock 데이터 생성 - 향후 파이프라인 연동 시 교체)
    const inquiryFunnel = [
        { stage: '채팅방 생성', key: 'chat_created', count: 0, percentage: 100, conversionFromPrev: 100, dropoffFromPrev: 0 },
        { stage: '메시지 1회 전송', key: 'chat_message_sent', count: 0, percentage: 0, conversionFromPrev: 0, dropoffFromPrev: 100 },
        { stage: '작가 첫 응답', key: 'photographer_responded', count: 0, percentage: 0, conversionFromPrev: 0, dropoffFromPrev: 100 },
        { stage: 'Tread active', key: 'chat_active', count: 0, percentage: 0, conversionFromPrev: 0, dropoffFromPrev: 100 }
    ];

    // 예약 퍼널 처리
    const bookingInitialSteps = [
        { stage: '예약 의도', key: 'booking_intent' },
        { stage: '예약 요청', key: 'booking_requested' }
    ];
    const bookingStepsFull = parseFunnelSnapshot(bookingRows, bookingInitialSteps);
    
    // 예약 퍼널의 분기를 위한 데이터 매핑
    const bookingRowData = (bookingRows || []).reduce((acc, row) => {
        acc[row.event_name] = Number(row.total_count) || 0;
        return acc;
    }, {} as Record<string, number>);

    const findBookingState = (key: string) => bookingRowData[key] || 0;

    const bookingFinal = [
        { stage: '예약 확정', count: findBookingState('booking_accepted_by_photographer'), isPositive: true },
        { stage: '예약 취소', count: findBookingState('booking_cancelled_by_user'), isPositive: false },
        { stage: '거절/만료', count: findBookingState('booking_rejected_by_photographer'), isPositive: false }
    ].filter(item => item.count > 0 || item.stage === '예약 확정'); // 비어있지 않거나 긍정 지표는 무조건 유지

    return {
        discoveryFunnel: searchFunnel,
        communityInteractions, 
        inquiryFunnel,
        bookingFunnel: {
            steps: bookingStepsFull,
            final: bookingFinal
        }
    };
};

/**
 * Creator 보고서 매퍼
 */
export const mapCreatorData = (rows: CreatorRow[]) => {
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

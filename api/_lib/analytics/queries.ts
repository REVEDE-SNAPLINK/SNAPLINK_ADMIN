import {
    getGa4Table,
    getDateRangeClause,
    getEventParamInt,
    getEventParamString,
    getTargetUserId,
    getPlatformClause,
    getUserTypeClause
} from './bigquery.js';

/**
 * 활성 사용자(DAU 등) 관련 쿼리
 * @param period 7d, 30d 등
 */
export const buildGeneralDailyQuery = (platform?: string, userType?: string) => `
    WITH base_events AS (
        SELECT 
            event_date,
            event_name,
            user_pseudo_id,
            ${getTargetUserId()} as final_user_id,
            ${getEventParamInt('ga_session_id')} as session_id,
            COALESCE(${getEventParamInt('engagement_time_msec')}, 0) as engagement_time_msec
        FROM \`${getGa4Table()}\`
        WHERE ${getDateRangeClause()}
          AND ${getPlatformClause(platform)}
          AND ${getUserTypeClause(userType)}
    )
    SELECT
        event_date as rawDate,
        COUNT(DISTINCT final_user_id) as dau,
        COUNT(DISTINCT CONCAT(user_pseudo_id, CAST(session_id AS STRING))) as sessions,
        -- 밀리초 합산을 초 단위로 변경. 세션이 0일 경우 회피
        IFNULL(SUM(engagement_time_msec) / 1000 / NULLIF(COUNT(DISTINCT CONCAT(user_pseudo_id, CAST(session_id AS STRING))), 0), 0) as sessionDuration
    FROM base_events
    GROUP BY event_date
    ORDER BY event_date ASC
`;

/**
 * 고정기간 활성 사용자(선택 종료일 기준 WAU, MAU) 쿼리
 */
export const buildGeneralFixedActiveUsersQuery = (platform?: string, userType?: string) => `
    WITH active_users AS (
        SELECT 
            event_date,
            ${getTargetUserId()} as final_user_id
        FROM \`${getGa4Table()}\`
        WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CAST(@endDate AS DATE), INTERVAL 30 DAY)) 
                                AND FORMAT_DATE('%Y%m%d', DATE_SUB(CAST(@endDate AS DATE), INTERVAL 1 DAY))
          AND ${getPlatformClause(platform)}
          AND ${getUserTypeClause(userType)}
    )
    SELECT
        (SELECT COUNT(DISTINCT final_user_id) FROM active_users WHERE event_date = FORMAT_DATE('%Y%m%d', DATE_SUB(CAST(@endDate AS DATE), INTERVAL 1 DAY))) as DAU,
        (SELECT COUNT(DISTINCT final_user_id) FROM active_users WHERE event_date >= FORMAT_DATE('%Y%m%d', DATE_SUB(CAST(@endDate AS DATE), INTERVAL 7 DAY))) as WAU,
        (SELECT COUNT(DISTINCT final_user_id) FROM active_users WHERE event_date >= FORMAT_DATE('%Y%m%d', DATE_SUB(CAST(@endDate AS DATE), INTERVAL 30 DAY))) as MAU
`;

/**
 * 획득 추이 데이터 (Acquisition Trend - Line Chart용)
 * Install(추정), First Open, Sign-up 일자별 추이
 */
export const buildAcquisitionTrendQuery = (platform?: string, userType?: string) => `
    SELECT 
        event_date as rawDate,
        -- 설치는 Firebase/GA4에서 별도 install 이벤트가 없을 경우 first_open을 최초 설치로 간주하거나, 
        -- 실제 'app_install' 이벤트를 사용 (스냅링크는 'app_install' 혹은 'first_open' 활용 시나리오)
        COUNT(IF(event_name = 'first_open', 1, NULL)) as installs,
        COUNT(IF(event_name = 'first_open', 1, NULL)) as first_opens,
        COUNT(IF(event_name = 'sign_up', 1, NULL)) as sign_ups
    FROM \`${getGa4Table()}\`
    WHERE ${getDateRangeClause()}
      AND event_name IN ('first_open', 'sign_up', 'app_install')
      AND ${getPlatformClause(platform)}
      AND ${getUserTypeClause(userType)}
    GROUP BY event_date
    ORDER BY event_date ASC
`;

export const buildAcquisitionChannelsQuery = (platform?: string, userType?: string) => `
    WITH base_events AS (
        SELECT 
            COALESCE(${getEventParamString('source')}, traffic_source.source, '(direct)') as sessionSource,
            COALESCE(${getEventParamString('medium')}, traffic_source.medium, '(none)') as sessionMedium,
            COALESCE(${getEventParamString('campaign')}, traffic_source.name, '(not set)') as sessionCampaign,
            COALESCE(${getEventParamString('tracking_code')}, '') as tracking_code,
            platform,
            user_pseudo_id,
            ${getEventParamInt('ga_session_id')} as session_id,
            IF(event_name = 'sign_up', 1, 0) as is_signup
        FROM \`${getGa4Table()}\`
        WHERE ${getDateRangeClause()}
          AND ${getPlatformClause(platform)}
          AND ${getUserTypeClause(userType)}
    )
    SELECT 
        sessionSource,
        sessionMedium,
        sessionCampaign,
        tracking_code,
        platform,
        COUNT(DISTINCT user_pseudo_id) as activeUsers,
        COUNT(DISTINCT CONCAT(user_pseudo_id, CAST(session_id AS STRING))) as sessions,
        SUM(is_signup) as signups
    FROM base_events
    GROUP BY sessionSource, sessionMedium, sessionCampaign, tracking_code, platform
    ORDER BY activeUsers DESC
`;

/**
 * 핵심 서비스 활성화 지표 (Acquisition Activation - Donut Chart용)
 * 첫 방문(First Open)한 유저 중 특정 액션을 수행한 유저 비율
 */
export const buildAcquisitionActivationQuery = (platform?: string, userType?: string) => `
    WITH new_users AS (
        SELECT DISTINCT user_pseudo_id
        FROM \`${getGa4Table()}\`
        WHERE event_name = 'first_open'
          AND ${getDateRangeClause()}
          AND ${getPlatformClause(platform)}
          AND ${getUserTypeClause(userType)}
    ),
    user_actions AS (
        SELECT 
            user_pseudo_id,
            LOGICAL_OR(event_name = 'photographer_profile_view') as did_profile_view,
            LOGICAL_OR(event_name = 'booking_intent') as did_booking_intent,
            LOGICAL_OR(event_name = 'chat_message_sent') as did_message_sent -- 가상 이벤트명, 실제 확인 필요
        FROM \`${getGa4Table()}\`
        WHERE ${getDateRangeClause()}
          AND event_name IN ('photographer_profile_view', 'booking_intent', 'chat_message_sent')
        GROUP BY user_pseudo_id
    )
    SELECT 
        COUNT(DISTINCT n.user_pseudo_id) as total_new_users,
        COUNT(DISTINCT IF(a.did_profile_view, n.user_pseudo_id, NULL)) as act_profile_view,
        COUNT(DISTINCT IF(a.did_booking_intent, n.user_pseudo_id, NULL)) as act_booking_intent,
        COUNT(DISTINCT IF(a.did_message_sent, n.user_pseudo_id, NULL)) as act_message_sent
    FROM new_users n
    LEFT JOIN user_actions a ON n.user_pseudo_id = a.user_pseudo_id
`;

/**
 * funnel_daily_snapshot 집계 테이블에서 특정 퍼널의 누적 합산 데이터를 조회하는 쿼리
 */
export const buildSnapshotFunnelQuery = (funnelType: 'community_content' | 'inquiry' | 'booking' | 'screens_per_session' | string) => `
  SELECT
    funnel_type,
    step,
    step_label,
    event_name,
    SUM(session_count) AS total_count
  FROM \`snaps-2210a.analytics_processed.funnel_daily_snapshot\`
  WHERE funnel_type = '${funnelType}'
    AND snapshot_date BETWEEN CAST(@startDate AS DATE) AND CAST(@endDate AS DATE)
  GROUP BY funnel_type, step, step_label, event_name
  ORDER BY step ASC
`;

/**
 * 작가 운영/응답성 지표 쿼리
 */
export const buildCreatorQuery = (platform?: string) => `
    WITH creator_events AS (
        SELECT 
            event_name,
            ${getTargetUserId()} as final_user_id,
            ${getEventParamInt('response_time_seconds')} as response_time_seconds
        FROM \`${getGa4Table()}\`
        WHERE ${getDateRangeClause()}
          AND event_name IN (
              'portfolio_post_created', 
              'shooting_service_action', 
              'photographer_response', 
              'photographer_booking_completed',
              'photographer_profile_view',
              'photographer_first_response_time'
          )
          AND ${getPlatformClause(platform)}
          AND ${getUserTypeClause('photographer')} -- 강제 작가 타입 한정
    )
    SELECT 
        COUNT(DISTINCT CASE WHEN event_name IN ('portfolio_post_created', 'shooting_service_action', 'photographer_response', 'photographer_booking_completed') THEN final_user_id END) as activeCreators,
        AVG(response_time_seconds) as avg_response_time_sec,
        -- 1시간 미만 (3600초)
        COUNT(CASE WHEN event_name = 'photographer_first_response_time' AND response_time_seconds <= 3600 THEN 1 END) as within1Hour,
        -- 1시간 초과 ~ 3시간 이하 (10800초)
        COUNT(CASE WHEN event_name = 'photographer_first_response_time' AND response_time_seconds > 3600 AND response_time_seconds <= 10800 THEN 1 END) as within3Hours,
        -- 3시간 초과
        COUNT(CASE WHEN event_name = 'photographer_first_response_time' AND response_time_seconds > 10800 THEN 1 END) as over3Hours
    FROM creator_events
`;

/**
 * 앱 안정성(Crash-Free Users) 쿼리
 * 전체 활성 사용자 수 대비 Crashlytics 에러(Fatal) 이벤트가 발생하지 않은 유저의 비율 설정
 */
export const buildCrashFreeUsersQuery = (platform?: string) => `
    WITH total_users AS (
        SELECT COUNT(DISTINCT user_pseudo_id) as total_count
        FROM \`${getGa4Table()}\`
        WHERE ${getDateRangeClause()}
          AND ${getPlatformClause(platform)}
    ),
    crashed_users AS (
        SELECT COUNT(DISTINCT installation_uuid) as crashed_count
        FROM (
            SELECT installation_uuid, event_timestamp, is_fatal 
            FROM \`${process.env.BIGQUERY_PROJECT_ID || 'snaps-2210a'}.${process.env.BIGQUERY_CRASHLYTICS_DATASET || 'firebase_crashlytics'}.com_revede_snaplink_ANDROID\`
            UNION ALL
            SELECT installation_uuid, event_timestamp, is_fatal 
            FROM \`${process.env.BIGQUERY_PROJECT_ID || 'snaps-2210a'}.${process.env.BIGQUERY_CRASHLYTICS_DATASET || 'firebase_crashlytics'}.com_revede_snaplink_IOS\`
        )
        WHERE DATE(event_timestamp) BETWEEN CAST(@startDate AS DATE) AND CAST(@endDate AS DATE)
          AND is_fatal = true
    )
    SELECT
        t.total_count,
        c.crashed_count,
        IFNULL(ROUND((1 - (c.crashed_count / NULLIF(t.total_count, 0))) * 100, 2), 100) as crash_free_percentage
    FROM total_users t
    CROSS JOIN crashed_users c
`;

/**
 * 커뮤니티 상호작용 전용 쿼리 (Bar Chart 용도)
 * - 게시글 작성 (작가 / 고객)
 * - 커뮤니티 글 조회, 좋아요, 코멘트, 링크 공유
 * - 작가 태그 수집
 */
export const buildCommunityInteractionQuery = (platform?: string) => `
    WITH daily AS (
        SELECT
            event_date,
            event_name,
            ${getEventParamString('user_type')} AS user_type,
            ${getEventParamInt('has_tagged_creator')} AS has_tagged_creator,
            ${getEventParamInt('liked')} AS liked
        FROM \`${getGa4Table()}\`
        WHERE ${getDateRangeClause()}
          AND event_name IN (
            'community_post_create',
            'community_post_view',
            'community_post_like',
            'community_comment_create',
            'community_post_share'
          )
          AND ${getPlatformClause(platform)}
    )
    SELECT
        event_date,
        COUNTIF(event_name = 'community_post_create' AND user_type = 'photographer') AS post_create_photographer,
        COUNTIF(event_name = 'community_post_create' AND user_type = 'user') AS post_create_user,
        COUNTIF(event_name = 'community_post_view') AS post_view_count,
        COUNTIF(event_name = 'community_post_like' AND liked = 1) AS like_count,
        COUNTIF(event_name = 'community_post_like' AND liked = 0) AS unlike_count,
        COUNTIF(event_name = 'community_comment_create') AS comment_count,
        COUNTIF(event_name = 'community_post_share') AS share_count,
        COUNTIF(event_name = 'community_post_view' AND has_tagged_creator = 1) AS view_with_creator_tag,
        COUNTIF(event_name = 'community_post_view' AND has_tagged_creator = 0) AS view_without_creator_tag,
        COUNTIF(event_name = 'community_post_like' AND liked = 1 AND has_tagged_creator = 1) AS like_with_creator_tag
    FROM daily
    GROUP BY event_date
    ORDER BY event_date ASC
`;

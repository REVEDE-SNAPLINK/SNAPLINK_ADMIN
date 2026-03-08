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
                                AND FORMAT_DATE('%Y%m%d', CAST(@endDate AS DATE))
          AND ${getPlatformClause(platform)}
          AND ${getUserTypeClause(userType)}
    )
    SELECT
        (SELECT COUNT(DISTINCT final_user_id) FROM active_users WHERE event_date = FORMAT_DATE('%Y%m%d', CAST(@endDate AS DATE))) as DAU_today,
        (SELECT COUNT(DISTINCT final_user_id) FROM active_users WHERE event_date >= FORMAT_DATE('%Y%m%d', DATE_SUB(CAST(@endDate AS DATE), INTERVAL 6 DAY))) as WAU,
        (SELECT COUNT(DISTINCT final_user_id) FROM active_users WHERE event_date >= FORMAT_DATE('%Y%m%d', DATE_SUB(CAST(@endDate AS DATE), INTERVAL 29 DAY))) as MAU
`;

/**
 * 획득 채널 데이터 (Acquisition)
 */
export const buildAcquisitionQuery = (platform?: string, userType?: string) => `
    WITH base_events AS (
        SELECT 
            -- Event Parameter 최우선 스니핑, 이후 Traffic Source fallback
            COALESCE(${getEventParamString('source')}, traffic_source.source, '(direct)') as sessionSource,
            COALESCE(${getEventParamString('medium')}, traffic_source.medium, '(none)') as sessionMedium,
            COALESCE(${getEventParamString('campaign')}, traffic_source.name, '(not set)') as sessionCampaign,
            COALESCE(${getEventParamString('tracking_code')}, '') as tracking_code,
            user_pseudo_id,
            ${getEventParamInt('ga_session_id')} as session_id,
            -- 가입 성과 측정: sign_up, 혹은 first_open
            IF(event_name IN ('sign_up', 'first_open'), 1, 0) as is_conversion
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
        COUNT(DISTINCT user_pseudo_id) as activeUsers,
        COUNT(DISTINCT CONCAT(user_pseudo_id, CAST(session_id AS STRING))) as sessions,
        SUM(is_conversion) as conversions
    FROM base_events
    GROUP BY sessionSource, sessionMedium, sessionCampaign, tracking_code
`;

/**
 * 지정된 이벤트 목록의 Funnel Count 쿼리
 */
export const buildEventFunnelQuery = (events: string[], platform?: string, userType?: string) => {
    const eventsList = events.map(e => `'${e}'`).join(', ');
    return `
        SELECT 
            event_name as stage_key,
            COUNT(DISTINCT ${getTargetUserId()}) as count
        FROM \`${getGa4Table()}\`
        WHERE ${getDateRangeClause()}
          AND event_name IN (${eventsList})
          AND ${getPlatformClause(platform)}
          AND ${getUserTypeClause(userType)}
        GROUP BY event_name
    `;
};

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

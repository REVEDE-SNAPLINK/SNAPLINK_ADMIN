import { BigQuery, type Query } from '@google-cloud/bigquery';
import path from 'path';

// BQ 클라이언트 초기화
const bqConfig: any = {
    projectId: process.env.BIGQUERY_PROJECT_ID,
};

// Vercel 등 환경변수 기반 인증 지원 (JSON 문자열)
if (process.env.BIGQUERY_CREDENTIALS) {
    try {
        bqConfig.credentials = JSON.parse(process.env.BIGQUERY_CREDENTIALS);
    } catch (e) {
        console.error('Failed to parse BIGQUERY_CREDENTIALS env var', e);
    }
} else {
    // 로컬 개발 환경용 파일 참조
    bqConfig.keyFilename = path.resolve(process.cwd(), process.env.BIGQUERY_KEY_FILENAME || 'snaplink-bq-key.json');
}

export const bigquery = new BigQuery(bqConfig);

// 데이터셋 이름도 환경변수로 주입받을 수 있도록 처리
export const GA4_DATASET = process.env.BIGQUERY_GA4_DATASET || 'analytics_xxxxxxxxx'; // Fallback
export const CRASHLYTICS_DATASET = process.env.BIGQUERY_CRASHLYTICS_DATASET || 'firebase_crashlytics';

export const getGa4Table = (): string => {
    // BIGQUERY_GA4_DATASET이 project.dataset 형태라면 템플릿 사용
    if (GA4_DATASET.includes('.')) {
        return `${GA4_DATASET}.events_*`;
    }
    if (process.env.BIGQUERY_PROJECT_ID) {
        return `${process.env.BIGQUERY_PROJECT_ID}.${GA4_DATASET}.events_*`;
    }
    return `${GA4_DATASET}.events_*`;
};

export const getCrashlyticsTable = (): string => {
    if (CRASHLYTICS_DATASET.includes('.')) {
        return `${CRASHLYTICS_DATASET}.*`;
    }
    if (process.env.BIGQUERY_PROJECT_ID) {
        return `${process.env.BIGQUERY_PROJECT_ID}.${CRASHLYTICS_DATASET}.*`;
    }
    return `${CRASHLYTICS_DATASET}.*`;
};


/**
 * 안전한 파라미터화 쿼리 실행기
 */
export const runQuery = async <T = any>(query: string, params: Record<string, any> = {}): Promise<T[]> => {
    try {
        const options: Query = {
            query,
            params,
            // location: 'US' // 필요한 경우 지정
        };

        const [job] = await bigquery.createQueryJob(options);
        const [rows] = await job.getQueryResults();

        return rows as T[];
    } catch (error) {
        console.error('[BigQuery Request Error]', error);
        throw error;
    }
};

/**
 * 날짜 범위 기반 WHERE 조건문 (파라미터명 startDate, endDate를 사용한다고 가정)
 * - 테이블이 events_YYYYMMDD 인 경우 TABLE_SUFFIX 사용
 */
export const getDateRangeClause = (): string => {
    return `
        _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', CAST(@startDate AS DATE)) 
                          AND FORMAT_DATE('%Y%m%d', CAST(@endDate AS DATE))
    `;
};

/**
 * 특정 key의 string_value를 event_params에서 추출하는 구문
 */
export const getEventParamString = (key: string): string => {
    return `(SELECT value.string_value FROM UNNEST(event_params) WHERE key = '${key}')`;
};

/**
 * 특정 key의 int_value를 event_params에서 추출하는 구문
 */
export const getEventParamInt = (key: string): string => {
    return `(SELECT value.int_value FROM UNNEST(event_params) WHERE key = '${key}')`;
};

/**
 * 특정 key의 double/float_value를 event_params에서 추출하는 구문
 */
export const getEventParamFloat = (key: string): string => {
    return `(SELECT COALESCE(value.double_value, value.float_value) FROM UNNEST(event_params) WHERE key = '${key}')`;
};

/**
 * 특정 key의 boolean 여부를 확인
 */
export const getEventParamBool = (key: string): string => {
    // string의 'true', int의 1 등을 함께 처리
    return `(SELECT 
        CASE 
            WHEN value.string_value = 'true' THEN true
            WHEN value.int_value = 1 THEN true 
            ELSE false 
        END 
        FROM UNNEST(event_params) WHERE key = '${key}')`;
};

/**
 * 날짜 변환 헬퍼 (YYYYMMDD -> YYYY-MM-DD)
 */
export const formatDateYYMMDD = (yymmdd: string): string => {
    if (!yymmdd || yymmdd.length !== 8) return yymmdd;
    return `${yymmdd.slice(0, 4)}-${yymmdd.slice(4, 6)}-${yymmdd.slice(6, 8)}`;
};

/**
 * 초(seconds)를 mm 'ss' 포맷으로 변경
 */
export const formatDuration = (seconds: number): string => {
    if (!Number.isFinite(seconds) || seconds <= 0) return '0s';
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

/**
 * 사용자 획득/식별용 User ID 추출 공통 SQL
 */
export const getTargetUserId = (): string => {
    return `COALESCE(
        ${getEventParamString('user_id')}, 
        (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'user_id'),
        user_pseudo_id
    )`;
};

/**
 * 플랫폼 필터 쿼리
 */
export const getPlatformClause = (platform?: string): string => {
    if (!platform || platform === 'all') return '1=1';
    return `(LOWER(platform) = LOWER('${platform}'))`;
};

/**
 * 유저 타입 필터 쿼리
 */
export const getUserTypeClause = (userType?: string): string => {
    if (!userType || userType === 'all') return '1=1';
    return `(SELECT LOWER(value.string_value) FROM UNNEST(user_properties) WHERE key IN ('user_type', 'role', 'type') LIMIT 1) = LOWER('${userType}')`;
};


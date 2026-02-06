import axios from 'axios';
import { BigQuery } from '@google-cloud/bigquery';
import { format, subDays } from 'date-fns';

// BigQuery 설정 (기존 GA4 인증 정보 재사용)
const projectId = process.env.BIGQUERY_PROJECT_ID;
const credentials = {
    client_email: process.env.GA4_CLIENT_EMAIL,
    private_key: process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

const bigquery = new BigQuery({
    projectId,
    credentials
});

/**
 * BigQuery에서 Crashlytics 데이터를 직접 계산하여 가져오는 함수
 */
async function fetchCrashFreeRate(): Promise<number> {
    const startDate = format(subDays(new Date(), 7), 'yyyyMMdd');
    const endDate = format(new Date(), 'yyyyMMdd');

    const query = `
        SELECT
          IFNULL(
            ROUND(
              (1 - COUNT(DISTINCT CASE WHEN is_fatal = true THEN user_pseudo_id END) / 
              NULLIF(COUNT(DISTINCT user_pseudo_id), 0)) * 100, 
              2
            ), 
            100
          ) as rate
        FROM \`${projectId}.firebase_crashlytics.events_*\`
        WHERE _TABLE_SUFFIX BETWEEN '${startDate}' AND '${endDate}'
    `;

    try {
        const [rows] = await bigquery.query({ query });
        return rows[0]?.rate || 100;
    } catch (err) {
        console.error("BigQuery Crash-free Rate Query Error:", err);
        return 99.8; // 오류 시 기본값 반환
    }
}

// Mock API for GA4 Data
export interface AnalyticsData {
    metrics: Record<string, number | string>;
    charts: any[];
}

export const getGeneralKPI = async (period: string): Promise<any> => {
    try {
        const response = await axios.get(`/api/analytics?type=general&period=${period}`);

        // 실시간 앱 안정성 데이터 반영
        const crashFreeRate = await fetchCrashFreeRate();
        if (response.data && response.data.metrics) {
            response.data.metrics.crashFreeUsers = crashFreeRate;
        }

        return response.data;
    } catch (error) {
        console.warn('GA4 API 연동 전이거나 오류 발생. Mock 데이터를 반환합니다.');

        const crashFreeRate = await fetchCrashFreeRate();

        return {
            metrics: {
                DAU: 1250, dauChange: 12.5,
                WAU: 4800, wauChange: -5.2,
                MAU: 8200, mauChange: 8.4,
                stickiness: 15.2,
                avgSessionDuration: "4m 32s",
                avgSessionDurationValue: 272,
                sessionsPerUser: 2.4,
                crashFreeUsers: crashFreeRate,
                retention: {
                    d1: 42.5,
                    d7: 18.2,
                    d30: 8.4
                }
            },
            charts: [
                { name: 'Mon', dau: 1100, sessions: 2800, sessionDuration: 240 },
                { name: 'Tue', dau: 1300, sessions: 3200, sessionDuration: 280 },
                { name: 'Wed', dau: 1250, sessions: 3100, sessionDuration: 260 },
                { name: 'Thu', dau: 1400, sessions: 3500, sessionDuration: 300 },
                { name: 'Fri', dau: 1350, sessions: 3300, sessionDuration: 290 },
                { name: 'Sat', dau: 1100, sessions: 2900, sessionDuration: 250 },
                { name: 'Sun', dau: 1150, sessions: 3000, sessionDuration: 255 },
            ],
            cohortData: [
                { date: '2024-01-20', newUsers: 100, d0: 100, d1: 45, d7: 18, d30: 8 },
                { date: '2024-01-21', newUsers: 120, d0: 100, d1: 42, d7: 15, d30: 7 },
                { date: '2024-01-22', newUsers: 110, d0: 100, d1: 48, d7: 20, d30: 9 },
                { date: '2024-01-23', newUsers: 130, d0: 100, d1: 40, d7: 14, d30: 6 },
                { date: '2024-01-24', newUsers: 105, d0: 100, d1: 44, d7: 17, d30: 8 },
            ]
        };
    }
};

export const getAcquisitionData = async (period: string): Promise<any> => {
    try {
        const response = await axios.get(`/api/analytics?type=acquisition&period=${period}`);
        return response.data;
    } catch (error) {
        return {
            channels: [
                { name: 'Instagram', value: 45, conversion: 12.5 },
                { name: 'Naver Blog', value: 25, conversion: 8.2 },
                { name: 'Kakaotalk', value: 18, conversion: 15.4 },
                { name: 'Direct/Search', value: 12, conversion: 5.1 },
            ],
            links: [
                { name: '작가A 고유링크', users: 1250, conversionRate: 14.2, status: 'Excellent' },
                { name: '작가B 포트폴리오', users: 840, conversionRate: 11.5, status: 'Good' },
                { name: '제휴 블로거C', users: 420, conversionRate: 9.8, status: 'Average' },
                { name: '커뮤니티 홍보D', users: 150, conversionRate: 4.2, status: 'Low' },
            ]
        };
    }
};

export const getFunnelData = async (period: string): Promise<any> => {
    try {
        const response = await axios.get(`/api/analytics?type=funnel&period=${period}`);
        return response.data;
    } catch (error) {
        return {
            bookingFunnel: [
                { stage: '프로필 조회', count: 10000, percentage: 100 },
                { stage: '예약 시도', count: 4500, percentage: 45 },
                { stage: '예약 요청', count: 1200, percentage: 12 },
                { stage: '계약 성사', count: 800, percentage: 8 },
            ],
            chatFunnel: [
                { stage: '채팅 시작', count: 5000, percentage: 100 },
                { stage: '작가 응답', count: 3500, percentage: 70 },
                { stage: '예약 확정', count: 1800, percentage: 36 },
            ]
        };
    }
};

export const getCreatorData = async (period: string): Promise<any> => {
    try {
        const response = await axios.get(`/api/analytics?type=creator&period=${period}`);
        return response.data;
    } catch (error) {
        return {
            metrics: {
                activeCreators: 145,
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
        };
    }
};

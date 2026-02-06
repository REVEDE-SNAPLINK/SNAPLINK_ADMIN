import axios from 'axios';

// Mock API for GA4 Data
export interface AnalyticsData {
    metrics: Record<string, number | string>;
    charts: any[];
}

export const getGeneralKPI = async (period: string): Promise<any> => {
    try {
        const response = await axios.get(`/api/analytics?type=general&period=${period}`);
        return response.data;
    } catch (error) {
        console.warn('GA4 API 연동 전이거나 오류 발생. Mock 데이터를 반환합니다.');
        return {
            metrics: {
                DAU: 1250, WAU: 8400, MAU: 32000,
                stickiness: "3.9%",
                avgSessionDuration: "4m 32s", // session_end의 duration_seconds 기반
                crashFreeUsers: "99.8%", // Crashlytics 데이터 기반
                retention: {
                    d1: 42.5,
                    d7: 18.2,
                    d30: 8.4
                }
            },
            charts: [
                { name: 'Mon', dau: 1100, sessions: 2800 },
                { name: 'Tue', dau: 1300, sessions: 3200 },
                { name: 'Wed', dau: 1250, sessions: 3100 },
                { name: 'Thu', dau: 1400, sessions: 3500 },
                { name: 'Fri', dau: 1350, sessions: 3300 },
                { name: 'Sat', dau: 1100, sessions: 2900 },
                { name: 'Sun', dau: 1150, sessions: 3000 },
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
                { stage: '프로필 조회 (profile_view)', count: 10000, percentage: 100 },
                { stage: '예약 시도 (booking_intent)', count: 4500, percentage: 45 },
                { stage: '예약 요청 (submitted)', count: 1200, percentage: 12 },
                { stage: '계약 성사 (confirmed)', count: 800, percentage: 8 },
            ],
            chatFunnel: [
                { stage: '채팅 시작 (chat_initiated)', count: 5000, percentage: 100 },
                { stage: '작가 응답 (photographer_response)', count: 3500, percentage: 70 },
                { stage: '예약 확정 (booking_confirmed)', count: 1800, percentage: 36 },
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

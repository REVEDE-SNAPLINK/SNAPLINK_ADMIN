/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { format, subDays } from 'date-fns';

// Mock API for GA4 Data
export interface AnalyticsData {
    metrics: Record<string, number | string>;
    charts: any[];
}

export const getGeneralKPI = async (period: string, platform?: string, userType?: string, startDate?: string, endDate?: string): Promise<any> => {
    try {
        const response = await axios.get(`/api/analytics?type=general&period=${period}${platform ? `&platform=${platform}` : ''}${userType ? `&userType=${userType}` : ''}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`);
        if (typeof response.data === 'string' && response.data.toLowerCase().includes('<!doctype html>')) throw new Error("Fallback HTML");
        return response.data;
    } catch (error) {
        const mul = userType === 'client' ? 0.8 : userType === 'photographer' ? 0.2 : 1;
        // Fallback or handle error
        return {
            metrics: {
                DAU: Math.floor(1250 * mul),
                dauChange: 12.5,
                WAU: Math.floor(8400 * mul),
                wauChange: 5.2,
                MAU: Math.floor(32000 * mul),
                mauChange: 8.7,
                stickiness: 26.3,
                avgSessionDuration: "3m 45s",
                avgUserEngagement: "155s",
                sessionsPerUser: 1.45,
                crashFreeUsers: "99.8",
                retention: { d1: 42.5, d7: 18.2, d30: 8.4 }
            },
            charts: Array.from({ length: 7 }, (_, i) => ({
                name: format(subDays(new Date(), 6 - i), 'MM/dd'),
                dau: 1000 + Math.floor(Math.random() * 500),
                sessions: 1500 + Math.floor(Math.random() * 800),
                sessionDuration: 180 + Math.floor(Math.random() * 120)
            })),
            screensFunnel: [
                { stage: '앱 실행', count: 12000, percentage: 100 },
                { stage: '작가 검색', count: 8500, percentage: 71 },
                { stage: '작가 상세', count: 4200, percentage: 35 },
                { stage: '문의 시작', count: 2100, percentage: 18 },
                { stage: '예약 요청', count: 450, percentage: 4 },
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

export const getAcquisitionData = async (period: string, platform?: string, userType?: string, startDate?: string, endDate?: string): Promise<any> => {
    try {
        const response = await axios.get(`/api/analytics?type=acquisition&period=${period}${platform ? `&platform=${platform}` : ''}${userType ? `&userType=${userType}` : ''}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`);
        if (typeof response.data === 'string' && response.data.toLowerCase().includes('<!doctype html>')) throw new Error("Fallback HTML");
        return response.data;
    } catch (error) {
        return {
            channels: [
                { name: 'Instagram', value: 4500, conversion: '12.5%' },
                { name: 'Direct', value: 3200, conversion: '8.4%' },
                { name: 'Google', value: 2100, conversion: '15.2%' },
                { name: 'Naver Search', value: 1800, conversion: '10.1%' },
                { name: 'X (Twitter)', value: 1200, conversion: '5.4%' }
            ],
            links: [
                { name: 'Winter_Campaign_A', users: 850, conversionRate: 18.5, status: 'Excellent' },
                { name: 'Influencer_Review_01', users: 420, conversionRate: 12.1, status: 'Excellent' },
                { name: 'NewYear_Special_B', users: 310, conversionRate: 9.4, status: 'Good' },
                { name: 'Brand_Story_FB', users: 280, conversionRate: 7.2, status: 'Good' },
                { name: 'Bio_Link_Main', users: 150, conversionRate: 4.5, status: 'Average' }
            ]
        };
    }
};

export const getFunnelData = async (period: string, platform?: string, userType?: string, startDate?: string, endDate?: string): Promise<any> => {
    try {
        const response = await axios.get(`/api/analytics?type=funnel&period=${period}${platform ? `&platform=${platform}` : ''}${userType ? `&userType=${userType}` : ''}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`);
        if (typeof response.data === 'string' && response.data.toLowerCase().includes('<!doctype html>')) throw new Error("Fallback HTML");
        return response.data;
    } catch (error) {
        return {
            discoveryFunnel: [
                { stage: '홈 피드', count: 12000, percentage: 100 },
                { stage: '작가 상세', count: 8500, percentage: 71 },
                { stage: '작가 카드', count: 4200, percentage: 35 },
                { stage: '작가 프로필', count: 2100, percentage: 18 },
                { stage: '문의 시작', count: 450, percentage: 4 },
            ],
            communityInteractions: [
                { name: '생성', count: 120 },
                { name: '조회', count: 8500 },
                { name: '좋아요', count: 420 },
                { name: '댓글', count: 156 },
                { name: '공유', count: 84 }
            ],
            bookingFunnel: {
                steps: [
                    { stage: '예약 시도', count: 2100, percentage: 100 },
                    { stage: '예약 폼 제출', count: 450, percentage: 21 },
                    { stage: '예약 확정', count: 180, percentage: 9 },
                ],
                final: [
                    { stage: '예약 확정', count: 180, isPositive: true },
                    { stage: '예약 취소', count: 45, isPositive: false }
                ]
            }
        };
    }
};

export const getCreatorData = async (period: string, platform?: string, userType?: string, startDate?: string, endDate?: string): Promise<any> => {
    try {
        const response = await axios.get(`/api/analytics?type=creator&period=${period}${platform ? `&platform=${platform}` : ''}${userType ? `&userType=${userType}` : ''}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`);
        if (typeof response.data === 'string' && response.data.toLowerCase().includes('<!doctype html>')) throw new Error("Fallback HTML");
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

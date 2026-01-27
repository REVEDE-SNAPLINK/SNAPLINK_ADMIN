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
                stickiness: "3.9%", avgSessionDuration: "4m 32s", crashFreeUsers: "99.8%"
            },
            charts: [
                { name: 'Jan', dau: 1100, mau: 28000 },
                { name: 'Feb', dau: 1300, mau: 30000 },
                { name: 'Mar', dau: 1250, mau: 32000 },
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
                { name: 'Instagram', value: 45, conversion: '12%' },
                { name: 'Blog', value: 30, conversion: '8%' },
                { name: 'Search', value: 15, conversion: '5%' },
                { name: 'Direct', value: 10, conversion: '2%' },
            ],
            links: [
                { name: 'Blogger_Kim', users: 450 },
                { name: 'Artist_A', users: 320 },
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
                { stage: 'Profile View', count: 10000, percentage: 100 },
                { stage: 'Booking Intent', count: 4500, percentage: 45 },
                { stage: 'Request Submitted', count: 1200, percentage: 12 },
                { stage: 'Confirmed', count: 800, percentage: 8 },
            ],
            chatFunnel: [
                { stage: 'Chat Initiated', count: 5000, percentage: 100 },
                { stage: 'Message Sent', count: 3500, percentage: 70 },
                { stage: 'Responded', count: 2800, percentage: 56 },
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
                activeCreators: 120, responseRate: "88%", medianResponseTime: "15m"
            },
            quality: [
                { name: 'Portfolio', score: 92 },
                { name: 'Profile Complete', score: 85 },
                { name: 'Schedule Setup', score: 70 },
            ]
        };
    }
};

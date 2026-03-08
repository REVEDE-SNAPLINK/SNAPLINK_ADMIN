import axios from 'axios';
import type { AnalyticsData } from '../../api/_lib/analytics/types';

export const getAnalyticsData = async (
    type: 'general' | 'acquisition' | 'funnel' | 'creator',
    period: string,
    platform: string,
    userType: string,
    startDate?: string,
    endDate?: string
): Promise<AnalyticsData> => {
    try {
        const params = new URLSearchParams({ type, period, platform, userType });
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const response = await axios.get<AnalyticsData>(`/api/analytics?${params.toString()}`);

        if (response.headers['content-type']?.includes('text/html')) {
            throw new Error(`API returned HTML for ${type}`);
        }

        return response.data;
    } catch (error) {
        console.error(`[Analytics API Error - ${type}]:`, error);

        if (import.meta.env.DEV) {
            console.warn(`BigQuery connection failed for ${type}. Returning empty layout.`);
        }

        return {
            metadata: { firstDataDate: '2024-01-01', maxDate: new Date().toISOString().split('T')[0] },
            metrics: {
                DAU: 0, dauPeriod: '(이번 00일)', dauChange: 0,
                WAU: 0, wauPeriod: '(최근 7일)', wauChange: 0,
                MAU: 0, mauPeriod: '(최근 30일)', mauChange: 0,
                stickiness: 0,
                avgSessionDuration: '0s',
                avgUserEngagement: '0s',
                sessionsPerUser: 0,
                crashFreeUsers: 'N/A',
                retention: { d1: 0, d7: 0, d30: 0 },
                activeCreators: 0,
                responseRate: 'N/A',
                medianResponseTime: 'N/A'
            },
            charts: [],
            screensFunnel: [],
            cohortData: [],
            discoveryFunnel: [],
            communityInteractions: [],
            bookingFunnel: { steps: [], final: [] },
            quality: [],
            responseDetails: { within1Hour: 0, within3Hours: 0, over3Hours: 0 }
        };
    }
};

export const getGeneralKPI = async (period: string, platform?: string, userType?: string, startDate?: string, endDate?: string): Promise<AnalyticsData> => {
    return getAnalyticsData('general', period, platform || 'all', userType || 'all', startDate, endDate);
};

export const getAcquisitionData = async (period: string, platform?: string, userType?: string, startDate?: string, endDate?: string): Promise<AnalyticsData> => {
    return getAnalyticsData('acquisition', period, platform || 'all', userType || 'all', startDate, endDate);
};

export const getFunnelData = async (period: string, platform?: string, userType?: string, startDate?: string, endDate?: string): Promise<AnalyticsData> => {
    return getAnalyticsData('funnel', period, platform || 'all', userType || 'all', startDate, endDate);
};

export const getCreatorData = async (period: string, platform?: string, userType?: string, startDate?: string, endDate?: string): Promise<AnalyticsData> => {
    return getAnalyticsData('creator', period, platform || 'all', userType || 'all', startDate, endDate);
};

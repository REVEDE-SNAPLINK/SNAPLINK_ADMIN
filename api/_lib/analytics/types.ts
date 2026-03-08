export interface AnalyticsData {
    metadata?: {
        firstDataDate?: string;
        maxDate?: string;
    };
    metrics: Record<string, number | string | Record<string, number>>;
    charts?: any[];
    [key: string]: any;
}

export interface MetricRow {
    [key: string]: any;
}

export interface QueryParams {
    startDate: string;
    endDate: string;
    platform?: string;
    userType?: string;
}

// 쿼리 응답 타입 (일부 자주 쓰이는 형태)
export interface EventCountRow {
    stage_key: string;
    count: number;
}

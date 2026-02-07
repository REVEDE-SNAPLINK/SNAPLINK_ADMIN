import { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { getCreatorData } from '@/api/analytics';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip
} from 'recharts';

export default function CreatorDashboard() {
    const [data, setData] = useState<any>(null);
    const [filters, setFilters] = useState({ period: '7d', platform: 'all' });

    useEffect(() => {
        getCreatorData(filters.period, filters.platform).then(setData);
    }, [filters]);

    const handleFilterChange = (newFilter: any) => {
        setFilters(prev => ({ ...prev, ...newFilter }));
    };

    if (!data) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 pb-32">
            <DashboardHeader
                title="공급자(작가) 퍼포먼스"
                onFilterChange={handleFilterChange}
            />

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <MetricCard title="활동 작가 수" value={data.metrics.activeCreators} change="15%" isPositive={true} />
                <MetricCard title="문의 응답률" value={data.metrics.responseRate} change="2%" isPositive={true} />
                <MetricCard title="응답 시간 중앙값" value={data.metrics.medianResponseTime} change="5m" isPositive={false} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Profile Quality Radar Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold mb-6 text-gray-800">작가 프로필 품질 분석</h3>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.quality}>
                                <PolarGrid stroke="#e5e7eb" />
                                <PolarAngleAxis dataKey="name" tick={{ fill: '#4b5563', fontSize: 13 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="Quality Score"
                                    dataKey="score"
                                    stroke="#00A980"
                                    fill="#00A980"
                                    fillOpacity={0.5}
                                />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold mb-6 text-gray-800">응답 품질 상세</h3>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-600 font-medium text-sm">1시간 내 응답 (골든 타임)</span>
                                <span className="text-gray-900 font-bold">{data.responseDetails?.within1Hour || 0}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                                <div className="bg-[#00A980] h-2.5 rounded-full" style={{ width: `${data.responseDetails?.within1Hour || 0}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-600 font-medium text-sm">3시간 내 응답</span>
                                <span className="text-gray-900 font-bold">{data.responseDetails?.within3Hours || 0}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${data.responseDetails?.within3Hours || 0}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-600 font-medium text-sm">3시간 초과 응답</span>
                                <span className="text-gray-900 font-bold">{data.responseDetails?.over3Hours || 0}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                                <div className="bg-red-400 h-2.5 rounded-full" style={{ width: `${data.responseDetails?.over3Hours || 0}%` }}></div>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-gray-50 mt-4">
                            <p className="text-xs text-gray-500 italic leading-relaxed">
                                * 작가들의 평균 응답 시간이 단축될수록 예약 전환율이 기하급수적으로 상승합니다.
                                현재 1시간 내 응답률을 85%까지 끌어올리는 것을 목표로 합니다.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

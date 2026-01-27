import { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { getCreatorData } from '@/api/analytics';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip
} from 'recharts';

export default function CreatorDashboard() {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        getCreatorData('7d').then(setData);
    }, []);

    if (!data) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 pb-16">
            <DashboardHeader
                title="작가 성과 지표 (Creator Insights)"
                onFilterChange={(f) => console.log('Filter:', f)}
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

                {/* Response Quality Details */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold mb-6 text-gray-800">응답 품질 상세</h3>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-600 font-medium font-sm">1시간 내 응답 비율</span>
                                <span className="text-gray-900 font-bold">75%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                                <div className="bg-[#00A980] h-2.5 rounded-full" style={{ width: '75%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-600 font-medium font-sm">포트폴리오 평균 등록 수</span>
                                <span className="text-gray-900 font-bold">12.5개</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '60%' }}></div>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-gray-50 mt-4">
                            <p className="text-sm text-gray-500 italic">
                                * 작가들의 응답 속도가 지난주 대비 5분 단축되었습니다.
                                응답률 90% 달성을 위해 프로모션 캠페인을 제안합니다.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { getGeneralKPI } from '@/api/analytics';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

export default function GeneralDashboard() {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        getGeneralKPI('7d').then(setData);
    }, []);

    if (!data) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 pb-16">
            <DashboardHeader
                title="핵심 서비스 지표 (General KPI)"
                onFilterChange={(f) => console.log('Filter:', f)}
            />

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard title="DAU (일일 활성 사용자)" value={data.metrics.DAU.toLocaleString()} change="12%" isPositive={true} />
                <MetricCard title="WAU (주간 활성 사용자)" value={data.metrics.WAU.toLocaleString()} change="5%" isPositive={true} />
                <MetricCard title="MAU (월간 활성 사용자)" value={data.metrics.MAU.toLocaleString()} change="8%" isPositive={true} />
                <MetricCard title="Stickiness (DAU/MAU)" value={data.metrics.stickiness} change="0.2%" isPositive={true} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* DAU Trend Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold mb-6 text-gray-800">활성 사용자 및 세션 추이</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.charts}>
                                <defs>
                                    <linearGradient id="colorDau" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00A980" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#00A980" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="dau" stroke="#00A980" fillOpacity={1} fill="url(#colorDau)" strokeWidth={2} name="DAU" />
                                <Area type="monotone" dataKey="sessions" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSessions)" strokeWidth={2} name="Sessions" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Stability & Retention */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex-1">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold text-gray-800">앱 안정성 및 체류</h3>
                            <span className="text-xs font-medium px-2 py-1 bg-green-50 text-green-600 rounded">Crashlytics</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 py-2">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Crash-free Users</p>
                                <p className="text-2xl font-bold text-[#00A980]">{data.metrics.crashFreeUsers}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">평균 체류 시간</p>
                                <p className="text-2xl font-bold text-gray-800">{data.metrics.avgSessionDuration}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex-1">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold text-gray-800">리텐션 (Retention Rate)</h3>
                            <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded">Firebase</span>
                        </div>
                        <div className="space-y-4 pt-2">
                            <div>
                                <div className="flex justify-between items-center text-sm mb-1">
                                    <span className="text-gray-600 font-medium">Day 1 (일일 리텐션)</span>
                                    <span className="font-bold text-gray-900">{data.metrics.retention.d1}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div className="bg-[#00A980] h-1.5 rounded-full" style={{ width: `${data.metrics.retention.d1}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center text-sm mb-1">
                                    <span className="text-gray-600 font-medium">Day 7 (주간 리텐션)</span>
                                    <span className="font-bold text-gray-900">{data.metrics.retention.d7}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div className="bg-[#00A980] h-1.5 rounded-full" style={{ width: `${data.metrics.retention.d7}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center text-sm mb-1">
                                    <span className="text-gray-600 font-medium">Day 30 (월간 리텐션)</span>
                                    <span className="font-bold text-gray-900">{data.metrics.retention.d30}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div className="bg-[#00A980] h-1.5 rounded-full" style={{ width: `${data.metrics.retention.d30}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

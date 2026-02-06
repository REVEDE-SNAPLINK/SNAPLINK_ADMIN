import { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { StickinessGauge } from '@/components/dashboard/StickinessGauge';
import { CohortTable } from '@/components/dashboard/CohortTable';
import { getGeneralKPI } from '@/api/analytics';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
    Line, Bar, ComposedChart, ReferenceLine
} from 'recharts';

export default function GeneralDashboard() {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        getGeneralKPI('7d').then(setData);
    }, []);

    if (!data) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 pb-32">
            <DashboardHeader
                title="핵심 서비스 지표 (General KPI)"
                onFilterChange={(f) => console.log('Filter:', f)}
            />

            {/* Top Row: Core Metrics & Stickiness */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MetricCard title="DAU (일일 활성)" value={data.metrics?.DAU?.toLocaleString() ?? "0"} change={data.metrics?.dauChange} isPositive={data.metrics?.dauChange > 0} />
                    <MetricCard title="WAU (주간 활성)" value={data.metrics?.WAU?.toLocaleString() ?? "0"} change={data.metrics?.wauChange} isPositive={data.metrics?.wauChange > 0} />
                    <MetricCard title="MAU (월간 활성)" value={data.metrics?.MAU?.toLocaleString() ?? "0"} change={data.metrics?.mauChange} isPositive={data.metrics?.mauChange > 0} />
                </div>
                <div className="lg:col-span-1">
                    <StickinessGauge value={data.metrics?.stickiness} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* 1. Active Users & Sessions Trend (Line + Histogram) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">유저당 평균 세션 수 (Session frequency)</h3>
                            <p className="text-xs text-gray-400 mt-1">방문 빈도 추이 및 세션 집중도</p>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-bold text-gray-400 block uppercase">Avg Sessions/User</span>
                            <span className="text-xl font-black text-blue-600">{data.metrics?.sessionsPerUser ?? "0.0"}</span>
                        </div>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={data.charts}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar yAxisId="left" dataKey="sessions" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Total Sessions" />
                                <Line yAxisId="right" type="monotone" dataKey="dau" stroke="#00A980" strokeWidth={3} dot={{ r: 4, fill: '#00A980', strokeWidth: 2, stroke: '#fff' }} name="DAU" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Avg Session Duration with Benchmark Line */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">평균 체류 시간 (Avg session duration)</h3>
                            <p className="text-xs text-gray-400 mt-1">목표 체류 시간(3분) 대비 달성 현황</p>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-bold text-gray-400 block uppercase">Current Avg</span>
                            <span className="text-xl font-black text-[#00A980]">{data.metrics?.avgUserEngagement ?? "0s"}</span>
                        </div>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.charts}>
                                <defs>
                                    <linearGradient id="colorDur" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} unit="s" />
                                <Tooltip />
                                <ReferenceLine y={180} label={{ value: 'Target (3m)', position: 'right', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} stroke="#ef4444" strokeDasharray="5 5" />
                                <Area type="monotone" dataKey="sessionDuration" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDur)" strokeWidth={3} name="Duration (sec)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Screens per Session Funnel */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-8">
                <div className="mb-8">
                    <h3 className="text-xl font-black text-gray-800">탐색 깊이 (Screens per session)</h3>
                    <p className="text-sm text-gray-500 mt-1">앱 진입부터 예약 요청까지의 핵심 퍼널</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                    {data.screensFunnel?.map((step: any, index: number) => (
                        <div key={step.stage} className="flex flex-col items-center relative">
                            <div className="w-full h-16 bg-blue-50 rounded-lg flex items-center justify-center mb-3 relative overflow-hidden">
                                <div
                                    className="absolute bottom-0 left-0 w-full bg-blue-500 opacity-20 transition-all duration-1000"
                                    style={{ height: `${step.percentage}%` }}
                                />
                                <span className="text-xl font-black text-blue-700 relative z-10">{step.count.toLocaleString()}</span>
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{step.stage}</p>
                            <p className="text-xs font-black text-blue-600">{step.percentage}%</p>
                            {index < data.screensFunnel.length - 1 && (
                                <div className="hidden md:block absolute -right-2 top-8 text-gray-200">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <path d="M9 18l6-6-6-6" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Row: Stability & Cohort */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Stability Card */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">앱 안정성 (Crash-free)</h3>
                            <p className="text-xs text-gray-400 mt-1">99% 이상 유지 목표</p>
                        </div>
                        <div className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${parseFloat(data.metrics?.crashFreeUsers) >= 99 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                            {parseFloat(data.metrics?.crashFreeUsers) >= 99 ? 'Stable' : 'Warning'}
                        </div>
                    </div>
                    <div className="flex flex-col items-center py-8">
                        <div className={`text-5xl font-black mb-2 ${parseFloat(data.metrics?.crashFreeUsers) >= 99 ? 'text-[#00A980]' : 'text-red-500'
                            }`}>
                            {data.metrics?.crashFreeUsers ?? "0"}%
                        </div>
                        <p className="text-sm font-bold text-gray-400">무장애 사용자 비율</p>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full ${parseFloat(data.metrics?.crashFreeUsers) >= 99 ? 'bg-[#00A980]' : 'bg-red-500'}`}
                            style={{ width: `${data.metrics?.crashFreeUsers ?? 0}%` }}
                        />
                    </div>
                </div>

                {/* Cohort Retention Table */}
                <div className="lg:col-span-2">
                    <CohortTable data={data.cohortData} />
                </div>
            </div>
        </div>
    );
}

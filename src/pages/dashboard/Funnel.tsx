import React, { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { getFunnelData } from '@/api/analytics';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList
} from 'recharts';

export default function FunnelDashboard() {
    const [data, setData] = useState<any>(null);
    const [filters, setFilters] = useState({ period: '7d', platform: 'all', userType: 'all' });
    const [referenceMax, setReferenceMax] = useState<number>(0);

    useEffect(() => {
        // 필터와 상관없이 해당 '기간'의 전체 기준 최대값을 참조용으로 조회
        getFunnelData(filters.period, 'all', 'all').then(res => {
            const counts = res.communityInteractions?.map((item: any) => item.count) || [];
            const max = counts.length > 0 ? Math.max(...counts) : 0;
            // Y축 상단에 여유를 주기 위해 15% 정도 올림
            setReferenceMax(Math.ceil(max * 1.15));
        });
    }, [filters.period]);

    useEffect(() => {
        getFunnelData(filters.period, filters.platform, filters.userType).then(setData);
    }, [filters]);

    const handleFilterChange = (newFilter: any) => {
        setFilters(prev => ({ ...prev, ...newFilter }));
    };

    if (!data) return <div className="p-8">Loading...</div>;

    const funnelColors = ['#00A980', '#00C495', '#33D4AA', '#66E4BF', '#99F4DF'];
    const blueColors = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

    const TraditionalFunnel = ({ items, colorBase }: { items: any[], colorBase: string[] }) => {
        if (!items || items.length === 0) return null;

        return (
            <div className="flex flex-col gap-2">
                {items.map((item, idx) => {
                    const width = 100 - (idx * (60 / (items.length || 1))); // 점점 좁아지는 폭 계산
                    const nextItem = items[idx + 1];
                    const dropCount = nextItem ? item.count - nextItem.count : 0;
                    const dropRate = nextItem ? (item.count > 0 ? Math.round(((item.count - nextItem.count) / item.count) * 100) : 0) : 0;

                    return (
                        <React.Fragment key={item.stage}>
                            {/* 퍼널 조각 */}
                            <div className="flex flex-col items-center">
                                <div
                                    className="h-14 flex items-center justify-between px-6 rounded-lg transition-all duration-700 relative overflow-hidden group hover:shadow-lg border border-white/20"
                                    style={{
                                        width: `${width}%`,
                                        backgroundColor: colorBase[idx % colorBase.length],
                                        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3)'
                                    }}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-black/40 uppercase tracking-tighter leading-none mb-1">{item.stage}</span>
                                        <span className="text-xl font-black text-black tracking-tight">{item.count.toLocaleString()}</span>
                                    </div>
                                    <span className="text-2xl font-black text-black/20 group-hover:text-black/40 transition-colors uppercase italic">{item.percentage}%</span>
                                </div>
                            </div>

                            {/* 단계 사이 이탈 지표 강조 */}
                            {nextItem && (
                                <div className="flex justify-center py-1">
                                    <div className="bg-red-50 px-3 py-1 rounded-full flex items-center gap-2 border border-red-100 shadow-sm animate-pulse">
                                        <span className="text-[10px] font-black text-red-400">LEAKAGE</span>
                                        <span className="text-xs font-black text-red-600">-{dropCount.toLocaleString()} ({dropRate}%)</span>
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="text-red-400">
                                            <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
                                        </svg>
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="p-8 pb-32">
            <DashboardHeader
                title="탐색/커뮤니티 및 예약 분석"
                onFilterChange={handleFilterChange}
            />

            {/* Section 3: Discovery & Community */}
            <div className="mb-12">
                <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-2">
                    <span className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center text-lg shadow-lg">3</span>
                    탐색 및 커뮤니티 지표
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* (A) 작가/콘텐츠 탐색 퍼널 */}
                    <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
                        <div className="mb-10 flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-2">(A) 작가/콘텐츠 탐색 퍼널</h3>
                                <p className="text-sm font-bold text-gray-400">홈 피드 → 작가 상세 → 작가 카드 → 작가 프로필 → 문의 시작</p>
                            </div>
                            <div className="bg-green-50 px-4 py-2 rounded-xl text-right">
                                <span className="text-[10px] font-black text-green-600 block mb-0.5 uppercase tracking-widest">문의 전환율 (CVR)</span>
                                <span className="text-3xl font-black text-green-600">
                                    {data.discoveryFunnel?.[data.discoveryFunnel.length - 1]?.percentage ?? 0}%
                                </span>
                            </div>
                        </div>

                        <TraditionalFunnel items={data.discoveryFunnel} colorBase={funnelColors} />
                    </div>

                    {/* (B) 커뮤니티 상호작용 */}
                    <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
                        <div className="mb-10">
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-2">(B) 커뮤니티 상호작용</h3>
                            <p className="text-sm font-bold text-gray-400">콘텐츠 생성, 조회, 좋아요, 댓글, 공유 활성도</p>
                        </div>

                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.communityInteractions} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6b7280', fontSize: 10, fontWeight: '900' }}
                                        interval={0}
                                        angle={-15}
                                        textAnchor="end"
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                                        domain={[0, referenceMax || 'auto']}
                                    />
                                    <Tooltip cursor={{ fill: '#f9fafb' }} />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={35} minPointSize={2}>
                                        <LabelList dataKey="count" position="top" style={{ fontWeight: '900', fontSize: '12px', fill: '#374151' }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 4: Booking Funnel */}
            <div>
                <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-2">
                    <span className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center text-lg shadow-lg">4</span>
                    예약 지표 (단계별 도달 수)
                </h2>

                <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
                    <div className="mb-10">
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-2">예약 퍼널 및 성사 지표</h3>
                        <p className="text-sm font-bold text-gray-400">예약 시도 → 예약 폼 제출 → 예약 확정 / 취소</p>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <TraditionalFunnel items={data.bookingFunnel?.steps} colorBase={blueColors} />

                        {/* 분기 UI (Fork Shape) */}
                        <div className="flex justify-center py-4 relative">
                            <div className="w-px h-12 bg-gray-200" />
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            {data.bookingFunnel?.final?.map((f: any) => (
                                <div key={f.stage} className={`flex flex-col items-center p-6 rounded-2xl border-2 transition-transform hover:scale-105 ${f.isPositive ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                    <span className={`text-[10px] font-black uppercase mb-2 tracking-widest ${f.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                        {f.stage}
                                    </span>
                                    <span className="text-4xl font-black text-gray-900 mb-2">{f.count.toLocaleString()}</span>
                                    <div className="flex items-center gap-1">
                                        <div className={`w-3 h-3 rounded-full ${f.isPositive ? 'bg-green-500' : 'bg-red-500'}`} />
                                        <span className="text-xs font-bold text-gray-400">최종 결과</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

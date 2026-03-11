import { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { getFunnelData } from '@/api/analytics';
import { TraditionalFunnel } from '@/components/dashboard/TraditionalFunnel';

export default function FunnelDashboard() {
    const [data, setData] = useState<any>(null);
    const [filters, setFilters] = useState({ period: '7d', platform: 'all', userType: 'all', startDate: '', endDate: '' });

    useEffect(() => {
        getFunnelData(filters.period, filters.platform, filters.userType, filters.startDate, filters.endDate).then(setData);
    }, [filters]);

    const handleFilterChange = (newFilter: any) => {
        setFilters(prev => ({ ...prev, ...newFilter }));
    };

    if (!data) return <div className="p-8">Loading...</div>;

    const funnelColors = ['#00A980', '#00C495', '#33D4AA', '#66E4BF', '#99F4DF'];
    const blueColors = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

    return (
        <div className="p-8 pb-32">
            <DashboardHeader
                title="탐색/커뮤니티 및 예약 분석"
                filters={filters}
                onFilterChange={handleFilterChange}
            />

            <div className="mb-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* (A) 검색 퍼널 */}
                    <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
                        <div className="mb-10 flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-2">(A) 검색 퍼널</h3>
                                <p className="text-sm font-bold text-gray-400">검색화면 진입 → 결과 노출 → 상세 열람 → 채팅</p>
                            </div>
                            <div className="bg-green-50 px-4 py-2 rounded-xl text-right">
                                <span className="text-[10px] font-black text-green-600 block mb-0.5 uppercase tracking-widest">누적 전환율</span>
                                <span className="text-3xl font-black text-green-600">
                                    {data.discoveryFunnel?.[data.discoveryFunnel.length - 1]?.percentage ?? 0}%
                                </span>
                            </div>
                        </div>

                        <TraditionalFunnel items={data.discoveryFunnel} colorBase={funnelColors} />
                    </div>

                    {/* (B) 커뮤니티 퍼널 */}
                    <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
                        <div className="mb-10 flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-2">(B) 커뮤니티 퍼널</h3>
                                <p className="text-sm font-bold text-gray-400">게시글 조회 → 프로필 열람 → 채팅 전환</p>
                            </div>
                            <div className="bg-indigo-50 px-4 py-2 rounded-xl text-right">
                                <span className="text-[10px] font-black text-indigo-600 block mb-0.5 uppercase tracking-widest">누적 전환율</span>
                                <span className="text-3xl font-black text-indigo-600">
                                    {data.communityInteractions?.[data.communityInteractions.length - 1]?.percentage ?? 0}%
                                </span>
                            </div>
                        </div>

                        <TraditionalFunnel items={data.communityInteractions} colorBase={['#818cf8', '#6366f1', '#4f46e5', '#4338ca', '#3730a3']} />
                    </div>
                </div>
            </div>

            {/* Section 4: Booking Funnel */}
            <div>
                <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-2">
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

import { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { getFunnelData } from '@/api/analytics';
import { TraditionalFunnel } from '@/components/dashboard/TraditionalFunnel';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface FunnelStep {
    stage: string;
    key: string;
    count: number;
    percentage: number;
    conversionFromPrev: number;
    dropoffFromPrev: number;
}

interface FunnelData {
    discoveryFunnel: FunnelStep[];
    communityInteractions: {
        trendData: {
            date: string;
            postCreatedPhotographer: number;
            postCreatedUser: number;
            views: number;
            likes: number;
            comments: number;
            shares: number;
        }[];
        stats: {
            totalPosts: number;
            totalLikes: number;
            totalComments: number;
            avgLikesPerPost: number;
            avgCommentsPerPost: number;
            postsWithCreatorTag: number;
            postsWithCreatorTagRate: number;
        };
    };
    inquiryFunnel: FunnelStep[];
    bookingFunnel: {
        steps: FunnelStep[];
        final: { stage: string; count: number; isPositive: boolean }[];
    };
    screensPerSession: FunnelStep[];
}

export default function FunnelDashboard() {
    const [data, setData] = useState<FunnelData | null>(null);
    const [filters, setFilters] = useState({ period: '7d', platform: 'all', userType: 'all', startDate: '', endDate: '' });

    useEffect(() => {
        getFunnelData(filters.period, filters.platform, filters.userType, filters.startDate, filters.endDate).then((res) => setData(res as unknown as FunnelData));
    }, [filters]);

    const handleFilterChange = (newFilter: Partial<typeof filters>) => {
        setFilters(prev => ({ ...prev, ...newFilter }));
    };

    if (!data) return <div className="p-8">Loading...</div>;

    const funnelColors = ['#00A980', '#00C495', '#33D4AA', '#66E4BF', '#99F4DF'];
    const blueColors = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

    return (
        <div className="p-8 pb-32">
            <DashboardHeader
                title="퍼널 / 인터랙션 분석"
                filters={filters}
                onFilterChange={handleFilterChange}
            />

            {/* 상단 2분할: 탐색 퍼널 & 커뮤니티 상호작용 */}
            <div className="mb-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* (A) 작가/콘텐츠 탐색 퍼널 */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                        <div>
                            <div className="mb-8 flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-2">(A) 작가/콘텐츠 탐색 퍼널</h3>
                                    <p className="text-xs font-bold text-gray-400">커뮤니티 목록 → 게시글 상세 → 작가 프로필 클릭 → 문의 진입</p>
                                </div>
                                <div className="bg-green-50 px-3 py-1.5 rounded-lg text-right">
                                    <span className="text-[9px] font-black text-green-600 block mb-0.5 uppercase tracking-widest">누적 전환율</span>
                                    <span className="text-2xl font-black text-green-600">
                                        {data.discoveryFunnel?.[data.discoveryFunnel.length - 1]?.percentage ?? 0}%
                                    </span>
                                </div>
                            </div>
                            <TraditionalFunnel items={data.discoveryFunnel} colorBase={funnelColors} />
                        </div>
                    </div>

                    {/* (B) 커뮤니티 상호작용 */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                        <div className="mb-6 flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-2">(B) 커뮤니티 상호작용</h3>
                                <p className="text-xs font-bold text-gray-400">게시글/좋아요/댓글/공유 일별 추이 (세로 막대형)</p>
                            </div>
                            <div className="flex gap-2">
                                <div className="bg-indigo-50 px-3 py-1.5 rounded-lg text-right relative group cursor-help">
                                    <span className="text-[9px] font-black text-indigo-600 block mb-0.5 uppercase tracking-widest">누적 데이터 (DB 연동필요)</span>
                                    <span className="text-xl font-black text-indigo-300">N/A</span>
                                    <div className="absolute hidden group-hover:block w-56 bg-gray-900 text-white text-xs p-3 rounded -bottom-14 right-0 z-50 shadow-xl whitespace-pre-wrap">백엔드 DB 누적 API 연동 전입니다. /api/admin/analytics/community/stats 구현 후 표시됩니다.</div>
                                </div>
                            </div>
                        </div>

                        {/* Bar Chart */}
                        <div className="flex-1 min-h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.communityInteractions?.trendData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 'bold' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                    <Tooltip 
                                        cursor={{ fill: '#F3F4F6' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 11, fontWeight: 'bold', paddingTop: 10 }} />
                                    <Bar dataKey="postCreatedPhotographer" name="작가 작성" stackId="a" fill="#3b82f6" radius={[0, 0, 6, 6]} maxBarSize={40} />
                                    <Bar dataKey="postCreatedUser" name="유저 작성" stackId="a" fill="#93c5fd" radius={[6, 6, 0, 0]} maxBarSize={40} />
                                    <Bar dataKey="views" name="조회" fill="#10b981" radius={[6, 6, 6, 6]} maxBarSize={40} />
                                    <Bar dataKey="likes" name="좋아요" fill="#f43f5e" radius={[6, 6, 6, 6]} maxBarSize={40} />
                                    <Bar dataKey="comments" name="댓글" fill="#f59e0b" radius={[6, 6, 6, 6]} maxBarSize={40} />
                                    <Bar dataKey="shares" name="공유" fill="#8b5cf6" radius={[6, 6, 6, 6]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* 하단 2분할: 문의 퍼널 & 예약 지표 */}
            <div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* (C) 문의 퍼널 */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                        <div className="mb-8 flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-2">(C) 문의 퍼널</h3>
                                <p className="text-xs font-bold text-gray-400">채팅방 생성에서 활성화(Active)까지의 여정</p>
                            </div>
                            <div className="bg-amber-50 px-3 py-1.5 rounded-lg text-right">
                                <span className="text-[9px] font-black text-amber-600 block mb-0.5 uppercase tracking-widest">수집 준비 중</span>
                                <span className="text-sm font-black text-amber-600">Mock</span>
                            </div>
                        </div>
                        <div className="flex-1 relative">
                            {/* Overlay for mock data */}
                            <div className="absolute inset-0 bg-white/40 z-10 flex items-center justify-center backdrop-blur-[1px]">
                                <div className="bg-white/90 px-5 py-2.5 rounded-full shadow-sm border border-gray-200">
                                    <span className="text-sm font-black text-gray-600">데이터 수집 인프라 구축 중</span>
                                </div>
                            </div>
                            <TraditionalFunnel items={data.inquiryFunnel} colorBase={['#fbbf24', '#fcd34d', '#fde68a', '#fef3c7']} />
                        </div>
                    </div>

                    {/* (D) 예약 지표 */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                        <div>
                            <div className="mb-8">
                                <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-2">(D) 예약 지표</h3>
                                <p className="text-xs font-bold text-gray-400">예약 의도 → 예약 요청 제출 → 확정/취소 분기</p>
                            </div>

                            <div className="max-w-full mx-auto">
                                <TraditionalFunnel items={data.bookingFunnel?.steps} colorBase={blueColors} />

                                {/* 분기 UI (Fork Shape) */}
                                <div className="flex justify-center py-4 relative">
                                    <div className="w-px h-8 bg-gray-200" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {data.bookingFunnel?.final?.map((f: { stage: string; count: number; isPositive: boolean }) => (
                                        <div key={f.stage} className={`flex flex-col items-center p-4 rounded-xl border-2 transition-transform hover:scale-105 ${f.isPositive ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                            <span className={`text-[10px] font-black uppercase mb-1 tracking-widest ${f.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                                {f.stage}
                                            </span>
                                            <span className="text-2xl font-black text-gray-900 mb-1">{f.count.toLocaleString()}</span>
                                            <div className="flex items-center gap-1">
                                                <div className={`w-2 h-2 rounded-full ${f.isPositive ? 'bg-green-500' : 'bg-red-500'}`} />
                                                <span className="text-[10px] font-bold text-gray-400">결과</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 하단 1분할: (E) 탐색 깊이 퍼널 */}
            <div className="mt-8">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div className="mb-8 flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-2">(E) 탐색 깊이 (Screens per Session)</h3>
                            <p className="text-xs font-bold text-gray-400">앱 진입 → 작가 탐색 → 프로필 조회 → 문의 시작 → 예약 진행</p>
                        </div>
                        <div className="bg-purple-50 px-3 py-1.5 rounded-lg text-right">
                            <span className="text-[9px] font-black text-purple-600 block mb-0.5 uppercase tracking-widest">세션 유지율</span>
                            <span className="text-2xl font-black text-purple-600">
                                {data.screensPerSession?.[data.screensPerSession.length - 1]?.percentage ?? 0}%
                            </span>
                        </div>
                    </div>
                    <div className="max-w-4xl mx-auto w-full">
                        <TraditionalFunnel items={data.screensPerSession} colorBase={['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe']} />
                    </div>
                </div>
            </div>
        </div>
    );
}

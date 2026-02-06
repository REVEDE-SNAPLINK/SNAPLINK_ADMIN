import { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { getFunnelData } from '@/api/analytics';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList
} from 'recharts';

export default function FunnelDashboard() {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        getFunnelData('7d').then(setData);
    }, []);

    if (!data) return <div className="p-8">Loading...</div>;

    const totalBookingConversion = data.bookingFunnel[data.bookingFunnel.length - 1].percentage;
    const totalChatConversion = data.chatFunnel[data.chatFunnel.length - 1].percentage;

    return (
        <div className="p-8 pb-16">
            <DashboardHeader
                title="퍼널 분석 (Funnel Analysis)"
                onFilterChange={(f) => console.log('Filter:', f)}
            />

            {/* Booking Funnel */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-8">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">예약 퍼널 (Booking Funnel)</h3>
                        <p className="text-sm text-gray-500 mt-1">프로필 조회부터 최종 계약 성사까지의 단계별 전환</p>
                    </div>
                    <div className="text-right">
                        <span className="text-xs font-semibold text-gray-400 block mb-1 uppercase tracking-wider">최종 전환율</span>
                        <span className="text-3xl font-black text-[#00A980]">{totalBookingConversion}%</span>
                    </div>
                </div>

                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.bookingFunnel} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 13 }} />
                            <YAxis hide />
                            <Tooltip cursor={{ fill: '#f9fafb' }} />
                            <Bar dataKey="count" fill="#00A980" radius={[4, 4, 0, 0]} barSize={80}>
                                <LabelList
                                    dataKey="percentage"
                                    position="top"
                                    formatter={(v: any) => `${v}%`}
                                    fill="#00A980"
                                    style={{ fontWeight: '900', fontSize: '16px' }}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-4 mt-8 bg-gray-50 rounded-xl p-6 text-center divide-x divide-gray-200">
                    {data.bookingFunnel.map((step: any, index: number) => {
                        const prevStep = data.bookingFunnel[index - 1];
                        const conversionFromPrev = prevStep ? Math.round((step.count / prevStep.count) * 100) : 100;
                        return (
                            <div key={step.stage} className="px-4">
                                <p className="text-[11px] font-bold text-gray-400 mb-2 uppercase">{step.stage.split(' (')[0]}</p>
                                <p className="text-2xl font-black text-gray-900 mb-1">{step.count.toLocaleString()}</p>
                                <div className="flex items-center justify-center gap-1.5">
                                    <span className="text-xs font-bold text-gray-500">전환율:</span>
                                    <span className={`text-sm font-black ${index === 0 ? 'text-gray-400' : 'text-[#00A980]'}`}>
                                        {index === 0 ? '-' : `${conversionFromPrev}%`}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Chat Funnel */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">문의 및 채팅 전환 (Inquiry Funnel)</h3>
                        <p className="text-sm text-gray-500 mt-1">채팅 문의를 통한 예약 승인 및 확정률</p>
                    </div>
                    <div className="text-right">
                        <span className="text-xs font-semibold text-gray-400 block mb-1 uppercase tracking-wider">최종 성공률</span>
                        <span className="text-3xl font-black text-blue-600">{totalChatConversion}%</span>
                    </div>
                </div>

                <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.chatFunnel} layout="vertical" margin={{ left: 40, right: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="stage"
                                type="category"
                                width={180}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#4b5563', fontSize: 13, fontWeight: 'bold' }}
                            />
                            <Tooltip cursor={{ fill: '#f9fafb' }} />
                            <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={35}>
                                <LabelList
                                    dataKey="percentage"
                                    position="right"
                                    formatter={(v: any) => `${v}% (전체대비)`}
                                    fill="#3b82f6"
                                    style={{ fontWeight: '800', fontSize: '13px' }}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

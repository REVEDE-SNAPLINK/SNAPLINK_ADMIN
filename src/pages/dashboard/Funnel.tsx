import React, { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { getFunnelData } from '@/api/analytics';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell
} from 'recharts';

export default function FunnelDashboard() {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        getFunnelData('7d').then(setData);
    }, []);

    if (!data) return <div className="p-8">Loading...</div>;

    const totalBookingConversion = data.bookingFunnel?.[data.bookingFunnel.length - 1]?.percentage ?? 0;
    const totalChatConversion = data.chatFunnel?.[data.chatFunnel.length - 1]?.percentage ?? 0;

    const funnelColors = ['#00A980', '#00C495', '#33D4AA', '#66E4BF'];

    return (
        <div className="p-8 pb-32">
            <DashboardHeader
                title="퍼널 분석 (Funnel Analysis)"
                onFilterChange={(f) => console.log('Filter:', f)}
            />

            {/* Booking Funnel */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-8">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h3 className="text-xl font-black text-gray-800 tracking-tight">예약 퍼널 (Booking Funnel)</h3>
                        <p className="text-sm text-gray-500 mt-1">유입 → 탐색 → 의도 → 전환 일련의 과정</p>
                    </div>
                    <div className="bg-green-50 px-4 py-2 rounded-xl text-right">
                        <span className="text-[10px] font-black text-green-600 block mb-0.5 uppercase tracking-widest">Final CVR</span>
                        <span className="text-3xl font-black text-[#00A980]">{totalBookingConversion}%</span>
                    </div>
                </div>

                <div className="h-[350px] mb-12">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.bookingFunnel} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 13, fontWeight: 'bold' }} />
                            <YAxis hide />
                            <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={100}>
                                {(data.bookingFunnel || []).map((_: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={funnelColors[index % funnelColors.length]} />
                                ))}
                                <LabelList
                                    dataKey="percentage"
                                    position="top"
                                    formatter={(v: any) => `${v}%`}
                                    style={{ fontWeight: '900', fontSize: '18px', fill: '#111827' }}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="flex items-center gap-4 relative">
                    {(data.bookingFunnel || []).map((step: any, index: number) => {
                        const prevStep = data.bookingFunnel[index - 1];
                        const conversionFromPrev = prevStep ? Math.round((step.count / prevStep.count) * 100) : 100;
                        return (
                            <React.Fragment key={step.stage}>
                                {index > 0 && (
                                    <div className="flex-1 h-px bg-gray-100 relative">
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-2 text-[10px] font-black text-green-600 border border-green-100 rounded-full">
                                            {conversionFromPrev}%
                                        </div>
                                    </div>
                                )}
                                <div className="flex flex-col items-center flex-1">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black mb-2 ${index === 0 ? 'bg-gray-900 text-white' : 'bg-green-50 text-[#00A980]'
                                        }`}>
                                        {index + 1}
                                    </div>
                                    <p className="text-[11px] font-black text-gray-400 mb-1 uppercase text-center">{step.stage}</p>
                                    <p className="text-lg font-black text-gray-900">{step.count.toLocaleString()}</p>
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Chat Funnel */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h3 className="text-xl font-black text-gray-800 tracking-tight">문의 및 채팅 전환 (Inquiry Funnel)</h3>
                        <p className="text-sm text-gray-500 mt-1">채팅 문의 유입 대비 최종 예약 확정 비중</p>
                    </div>
                    <div className="bg-blue-50 px-4 py-2 rounded-xl text-right">
                        <span className="text-[10px] font-black text-blue-600 block mb-0.5 uppercase tracking-widest">Success Rate</span>
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
                                width={120}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#4b5563', fontSize: 13, fontWeight: 'black' }}
                            />
                            <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                            <Bar dataKey="count" fill="#3b82f6" radius={[0, 10, 10, 0]} barSize={40}>
                                <LabelList
                                    dataKey="percentage"
                                    position="right"
                                    formatter={(v: any) => `${v}%`}
                                    style={{ fontWeight: '900', fontSize: '15px', fill: '#3b82f6' }}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

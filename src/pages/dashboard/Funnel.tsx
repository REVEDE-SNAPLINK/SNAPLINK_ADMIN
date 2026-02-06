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

    const funnelColors = ['#00A980', '#00C495', '#33D4AA', '#66E4BF', '#99F4DF'];
    const blueColors = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

    return (
        <div className="p-8 pb-32">
            <DashboardHeader
                title="탐색/커뮤니티 및 문의 분석"
                onFilterChange={(f) => console.log('Filter:', f)}
            />

            {/* Section 3: Discovery & Community */}
            <div className="mb-12">
                <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center text-sm">3</span>
                    탐색/커뮤니티 지표
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* (A) 작가/콘텐츠 탐색 퍼널 */}
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                        <div className="mb-6">
                            <h3 className="text-xl font-black text-gray-800 tracking-tight">(A) 작가/콘텐츠 탐색 퍼널</h3>
                            <p className="text-sm text-gray-500 mt-1">Feed → Post → Profile → Inquiry 진입 과정</p>
                        </div>

                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.discoveryFunnel} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 11, fontWeight: 'bold' }} />
                                    <YAxis hide />
                                    <Tooltip />
                                    <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={60} minPointSize={2}>
                                        {(data.discoveryFunnel || []).map((_: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={funnelColors[index % funnelColors.length]} />
                                        ))}
                                        <LabelList dataKey="percentage" position="top" formatter={(v: any) => `${v}%`} style={{ fontWeight: '900', fontSize: '14px' }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* (B) 커뮤니티 상호작용 */}
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                        <div className="mb-6">
                            <h3 className="text-xl font-black text-gray-800 tracking-tight">(B) 커뮤니티 상호작용</h3>
                            <p className="text-sm text-gray-500 mt-1">게시글 생성, 좋아요, 댓글, 공유 활성도</p>
                        </div>

                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.communityInteractions} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 11, fontWeight: 'bold' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                    <Tooltip cursor={{ fill: '#f9fafb' }} />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} minPointSize={2}>
                                        <LabelList dataKey="count" position="top" style={{ fontWeight: '700', fontSize: '12px' }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 4: Inquiry Funnel */}
            <div>
                <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center text-sm">4</span>
                    문의(예약 전 단계) 지표
                </h2>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h3 className="text-xl font-black text-gray-800 tracking-tight">(A) 문의 퍼널</h3>
                            <p className="text-sm text-gray-500 mt-1">매칭 시점부터 첫 대화 및 활성 대화 발생 비중</p>
                        </div>
                        <div className="bg-blue-50 px-4 py-2 rounded-xl text-right">
                            <span className="text-[10px] font-black text-blue-600 block mb-0.5 uppercase tracking-widest">Active Rate</span>
                            <span className="text-3xl font-black text-blue-600">
                                {data.inquiryFunnel?.[data.inquiryFunnel.length - 1]?.percentage ?? 0}%
                            </span>
                        </div>
                    </div>

                    <div className="h-[350px] mb-12">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.inquiryFunnel} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 13, fontWeight: 'bold' }} />
                                <YAxis hide />
                                <Tooltip cursor={{ fill: '#f9fafb' }} />
                                <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={100} minPointSize={2}>
                                    {(data.inquiryFunnel || []).map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={blueColors[index % blueColors.length]} />
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
                        {(data.inquiryFunnel?.steps || []).map((step: any, index: number) => {
                            const prevStep = data.inquiryFunnel.steps[index - 1];
                            const conversionFromPrev = prevStep ? (prevStep.count > 0 ? Math.round((step.count / prevStep.count) * 100) : 0) : 100;
                            return (
                                <React.Fragment key={step.stage}>
                                    {index > 0 && (
                                        <div className="flex-1 h-px bg-gray-100 relative">
                                            <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-2 text-[10px] font-black border rounded-full ${conversionFromPrev > 100 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-white text-blue-600 border-blue-100'
                                                }`}>
                                                {conversionFromPrev}% {conversionFromPrev > 100 && '↑'}
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex flex-col items-center flex-1">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black mb-2 ${index === 0 ? 'bg-gray-900 text-white' : 'bg-blue-50 text-blue-600'
                                            }`}>
                                            {index + 1}
                                        </div>
                                        <p className="text-[11px] font-black text-gray-400 mb-1 uppercase text-center leading-tight h-6 flex items-center">{step.stage}</p>
                                        <p className="text-lg font-black text-gray-900">{step.count.toLocaleString()}</p>
                                    </div>
                                </React.Fragment>
                            );
                        })}

                        {/* Branched Final Stages */}
                        <div className="flex-1 h-px bg-gray-100 relative" />
                        <div className="flex flex-col gap-4">
                            {data.inquiryFunnel?.final?.map((f: any) => (
                                <div key={f.stage} className={`flex items-center gap-3 p-3 rounded-xl border ${f.isPositive ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                    <div className={`w-2 h-2 rounded-full ${f.isPositive ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <div>
                                        <p className={`text-[10px] font-black uppercase ${f.isPositive ? 'text-green-600' : 'text-red-600'}`}>{f.stage}</p>
                                        <p className="text-sm font-black text-gray-900">{f.count.toLocaleString()}</p>
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

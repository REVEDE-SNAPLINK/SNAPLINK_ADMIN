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

    return (
        <div className="p-8 pb-16">
            <DashboardHeader
                title="퍼널 분석 (Funnel Analysis)"
                onFilterChange={(f) => console.log('Filter:', f)}
            />

            {/* Booking Funnel */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-8">
                <h3 className="text-lg font-bold mb-8 text-gray-800">예약 퍼널: 프로필 조회 → 예약 확정</h3>
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.bookingFunnel} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 13 }} />
                            <YAxis hide />
                            <Tooltip cursor={{ fill: '#f9fafb' }} />
                            <Bar dataKey="count" fill="#00A980" radius={[4, 4, 0, 0]} barSize={60}>
                                <LabelList dataKey="percentage" position="top" formatter={(v: any) => `${v}%`} fill="#00A980" style={{ fontWeight: 'bold' }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-4 mt-8 pt-8 border-t border-gray-50 text-center">
                    {data.bookingFunnel.map((step: any) => (
                        <div key={step.stage}>
                            <p className="text-sm text-gray-500 mb-1">{step.stage}</p>
                            <p className="text-xl font-bold text-gray-900">{step.count.toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Funnel */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-8 text-gray-800">문의 퍼널: 채팅 시작 → 작가 응답</h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.chatFunnel} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="stage" type="category" width={150} axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 13 }} />
                            <Tooltip cursor={{ fill: '#f9fafb' }} />
                            <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={30}>
                                <LabelList dataKey="percentage" position="right" formatter={(v: any) => `${v}%`} fill="#3b82f6" style={{ fontWeight: 'bold' }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

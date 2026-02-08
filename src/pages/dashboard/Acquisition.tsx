import { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { getAcquisitionData } from '@/api/analytics';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, LabelList
} from 'recharts';

const COLORS = ['#00A980', '#00C49F', '#FFBB28', '#FF8042'];

export default function AcquisitionDashboard() {
    const [data, setData] = useState<any>(null);
    const [filters, setFilters] = useState({ period: '7d', platform: 'all', userType: 'all', startDate: '', endDate: '' });

    useEffect(() => {
        getAcquisitionData(filters.period, filters.platform, filters.userType, filters.startDate, filters.endDate).then(setData);
    }, [filters]);

    const handleFilterChange = (newFilter: any) => {
        setFilters(prev => ({ ...prev, ...newFilter }));
    };

    if (!data) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 pb-16">
            <DashboardHeader
                title="유입 및 획득 분석"
                filters={filters}
                onFilterChange={handleFilterChange}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Channel Efficiency Pie Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold mb-6 text-gray-800">채널별 유입 비중</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.channels}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.channels?.map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend layout="vertical" align="right" verticalAlign="middle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Channel Conversion Bar Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold mb-6 text-gray-800">채널별 가입 전환율</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.channels} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 13 }} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="conversionRate" fill="#00A980" radius={[0, 4, 4, 0]} barSize={20}>
                                    <LabelList dataKey="conversionRate" position="right" fill="#4b5563" style={{ fontSize: '11px', fontWeight: 'bold' }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Unique Link Performance Table */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800">고유 링크 유입 성과 (작가 / 블로거)</h3>
                    <span className="text-xs font-medium px-2 py-1 bg-green-50 text-[#00A980] rounded">Source Parameter Tracking</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-100 text-sm text-gray-400 font-medium">
                                <th className="pb-4 pl-2">출처 (Source)</th>
                                <th className="pb-4">누적 유입 (Sessions)</th>
                                <th className="pb-4">가입 전환율</th>
                                <th className="pb-4">종합 성과</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {(data.links || []).map((link: any) => (
                                <tr key={link.name} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-4 pl-2 font-medium text-gray-900">{link.name}</td>
                                    <td className="py-4 text-gray-700 font-semibold">{link.users?.toLocaleString() || 0}</td>
                                    <td className="py-4 text-gray-700">{link.conversionRate || 0}%</td>
                                    <td className="py-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${link.status === 'Excellent' ? 'bg-green-100 text-green-700' :
                                            link.status === 'Good' ? 'bg-blue-100 text-blue-700' :
                                                link.status === 'Average' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-gray-100 text-gray-700'
                                            }`}>
                                            {link.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

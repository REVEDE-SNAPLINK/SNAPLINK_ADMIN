import { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { getAcquisitionData } from '@/api/analytics';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, LabelList,
    AreaChart, Area
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

            {/* 1. 유입 규모 추이 (Line/Area Chart) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-800">유입 규모 추이</h3>
                    <p className="text-sm text-gray-400 mt-1">앱 설치, 최초 실행 및 회원가입 발생 건수</p>
                </div>
                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.trend}>
                            <defs>
                                <linearGradient id="colorInstall" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorOpen" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorSignup" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00A980" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#00A980" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                            <Area type="monotone" dataKey="installs" stroke="#94a3b8" fillOpacity={1} fill="url(#colorInstall)" strokeWidth={2} name="앱 설치" />
                            <Area type="monotone" dataKey="opens" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOpen)" strokeWidth={2} name="최초 오픈" />
                            <Area type="monotone" dataKey="signups" stroke="#00A980" fillOpacity={1} fill="url(#colorSignup)" strokeWidth={3} name="회원가입" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* 2. 핵심 서비스 활성화 지표 (Donut Chart) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold mb-2 text-gray-800">핵심 서비스 활성화 지표</h3>
                    <p className="text-xs text-gray-400 mb-6">첫 방문자 중 의미 있는 행동 수행 유저 비중</p>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.activation}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {data.activation?.map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend layout="vertical" align="right" verticalAlign="middle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. 상위 유입 채널별 성과 (Bar Chart) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold mb-2 text-gray-800">상위 유입 채널별 성과</h3>
                    <p className="text-xs text-gray-400 mb-6">유입 소스별 활성 유저 규모</p>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.channels} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 13 }} width={80} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24}>
                                    <LabelList dataKey="value" position="right" fill="#4b5563" style={{ fontSize: '11px', fontWeight: 'bold' }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* 4. 고유 링크 성과 (Table) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800">고유 링크 상세 성과 (블로그/작가/포스트)</h3>
                    <span className="text-xs font-medium px-2 py-1 bg-green-50 text-[#00A980] rounded">DeepLink & UTM Tracking</span>
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

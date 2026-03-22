import { useEffect, useState, useMemo } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { getAcquisitionData } from '@/api/analytics';
import { listLinks, CHANNEL_LABELS, type LinkEntry, type TargetType } from '@/api/linkHub';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie, Legend, LabelList, AreaChart, Area
} from 'recharts';
import { Link2, TrendingUp, Users, Target, Layers } from 'lucide-react';

// --- Constants ---

const TARGET_TYPE_LABELS: Record<TargetType, string> = {
    photographer_profile: '작가 프로필',
    portfolio_post:       '포트폴리오',
    community_post:       '커뮤니티 게시글',
    landing:              '랜딩 페이지',
    store:                '스토어',
};

const TARGET_TYPE_COLORS: Record<TargetType, string> = {
    photographer_profile: '#00A980',
    portfolio_post:       '#3b82f6',
    community_post:       '#f59e0b',
    landing:              '#8b5cf6',
    store:                '#f43f5e',
};

const ACTIVATION_COLORS = ['#00A980', '#3b82f6', '#f59e0b'];

// --- Sub-components ---

function KpiCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-start gap-4">
            <div className="p-2.5 bg-gray-50 rounded-xl text-gray-500">{icon}</div>
            <div>
                <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

function StatusBadge({ rate }: { rate: number }) {
    if (rate > 10) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">우수</span>;
    if (rate > 5)  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">보통</span>;
    if (rate > 0)  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700">낮음</span>;
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">데이터 없음</span>;
}

function SectionCard({ title, sub, badge, children }: { title: string; sub?: string; badge?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                    {sub && <p className="text-sm text-gray-400 mt-1">{sub}</p>}
                </div>
                {badge}
            </div>
            {children}
        </div>
    );
}

// --- Main Component ---

export default function AcquisitionDashboard() {
    const [data, setData] = useState<any>(null);
    const [links, setLinks] = useState<LinkEntry[]>([]);
    const [filters, setFilters] = useState({ period: '7d', platform: 'all', userType: 'all', startDate: '', endDate: '' });

    useEffect(() => {
        getAcquisitionData(filters.period, filters.platform, filters.userType, filters.startDate, filters.endDate).then(setData);
        listLinks({ isActive: '' }).then(res => setLinks(res.items)).catch(() => setLinks([]));
    }, [filters]);

    // tracking_code → LinkEntry lookup
    const trackingMap = useMemo(() =>
        new Map<string, LinkEntry>(links.map(l => [l.trackingCode, l])),
        [links]
    );

    // BQ link rows enriched with link-hub metadata
    const enrichedLinks = useMemo(() => {
        return (data?.links || []).map((row: any) => {
            const meta = trackingMap.get(row.name);
            return {
                ...row,
                displayName: meta?.label || meta?.utmCampaign || row.name,
                campaign:    meta?.utmCampaign || (row.name.startsWith('trk_') ? null : row.name),
                targetType:  meta?.targetType as TargetType | undefined,
                channel:     meta?.channel,
                ownerId:     meta?.ownerId,
                isActive:    meta?.isActive,
                hasLinkMeta: !!meta,
            };
        });
    }, [data, trackingMap]);

    // Campaign stats: group enriched rows by utmCampaign
    const campaignStats = useMemo(() => {
        const map = new Map<string, { name: string; channels: Set<string>; users: number; links: number; sessions: number; signups: number }>();
        for (const row of enrichedLinks) {
            const key = row.campaign || '(기타)';
            const existing = map.get(key) ?? { name: key, channels: new Set(), users: 0, links: 0, sessions: 0, signups: 0 };
            existing.users    += row.users || 0;
            existing.sessions += row.sessions || 0;
            existing.signups  += Math.round(((row.conversionRate || 0) / 100) * (row.users || 0));
            existing.links    += 1;
            if (row.channel) existing.channels.add(row.channel);
            map.set(key, existing);
        }
        return Array.from(map.values()).map(c => ({
            ...c,
            channelLabel: c.channels.size === 1
                ? CHANNEL_LABELS[c.channels.values().next().value as keyof typeof CHANNEL_LABELS] ?? '복합'
                : c.channels.size > 1 ? '복합 채널' : '-',
            conversionRate: c.sessions > 0 ? Number(((c.signups / c.sessions) * 100).toFixed(1)) : 0,
        })).sort((a, b) => b.users - a.users);
    }, [enrichedLinks]);

    // Path stats: group by targetType (link-hub metadata + BQ join)
    const pathStats = useMemo(() => {
        // Link counts per targetType (all links, including those without BQ data yet)
        const linkCounts = new Map<string, { total: number; active: number }>();
        for (const l of links) {
            const e = linkCounts.get(l.targetType) ?? { total: 0, active: 0 };
            linkCounts.set(l.targetType, { total: e.total + 1, active: e.active + (l.isActive ? 1 : 0) });
        }

        // User/conversion aggregates for links that have BQ data
        const bqMap = new Map<string, { users: number; sessions: number; signups: number }>();
        for (const row of enrichedLinks) {
            if (!row.targetType) continue;
            const e = bqMap.get(row.targetType) ?? { users: 0, sessions: 0, signups: 0 };
            bqMap.set(row.targetType, {
                users:    e.users    + (row.users || 0),
                sessions: e.sessions + (row.sessions || 0),
                signups:  e.signups  + Math.round(((row.conversionRate || 0) / 100) * (row.users || 0)),
            });
        }

        // Merge: all known targetTypes from link-hub
        const allTypes = new Set([...linkCounts.keys(), ...bqMap.keys()]);
        return Array.from(allTypes).map(t => {
            const lc = linkCounts.get(t) ?? { total: 0, active: 0 };
            const bq = bqMap.get(t) ?? { users: 0, sessions: 0, signups: 0 };
            return {
                targetType: t as TargetType,
                label: TARGET_TYPE_LABELS[t as TargetType] ?? t,
                color: TARGET_TYPE_COLORS[t as TargetType] ?? '#94a3b8',
                linkTotal:  lc.total,
                linkActive: lc.active,
                users:      bq.users,
                conversionRate: bq.sessions > 0 ? Number(((bq.signups / bq.sessions) * 100).toFixed(1)) : 0,
            };
        }).sort((a, b) => b.users - a.users || b.linkTotal - a.linkTotal);
    }, [enrichedLinks, links]);

    // Top-level KPIs from link-hub
    const activeLinks = links.filter(l => l.isActive).length;
    const totalCampaigns = new Set(links.map(l => l.utmCampaign).filter(Boolean)).size;
    const totalBqUsers = (data?.links || []).reduce((s: number, r: any) => s + (r.users || 0), 0);
    const avgConvRate = campaignStats.length > 0
        ? Number((campaignStats.reduce((s, c) => s + c.conversionRate, 0) / campaignStats.length).toFixed(1))
        : 0;

    if (!data) return (
        <div className="p-8 flex items-center justify-center h-64">
            <div className="w-10 h-10 border-4 border-[#00A980] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="p-8 pb-16">
            <DashboardHeader
                title="유입 및 획득 분석"
                filters={filters}
                onFilterChange={(f) => setFilters(prev => ({ ...prev, ...f }))}
            />

            {/* KPI 요약 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <KpiCard icon={<Link2 className="w-5 h-5" />} label="활성 링크" value={activeLinks} sub={`전체 ${links.length}개`} />
                <KpiCard icon={<Layers className="w-5 h-5" />} label="캠페인 수" value={totalCampaigns} sub="utm_campaign 기준" />
                <KpiCard icon={<Users className="w-5 h-5" />} label="기간 내 유입 유저" value={totalBqUsers.toLocaleString()} sub="앱 내 행동 기준" />
                <KpiCard icon={<TrendingUp className="w-5 h-5" />} label="평균 전환율" value={`${avgConvRate}%`} sub="가입 / 세션" />
            </div>

            {/* 유입 규모 추이 */}
            <SectionCard title="유입 규모 추이" sub="앱 최초 실행, 신규 가입 발생 건수">
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.trend}>
                            <defs>
                                <linearGradient id="gInstall" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.12} />
                                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gOpen" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.12} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gSignup" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00A980" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#00A980" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                            <Area type="monotone" dataKey="installs" stroke="#94a3b8" fillOpacity={1} fill="url(#gInstall)" strokeWidth={2} name="앱 설치" />
                            <Area type="monotone" dataKey="opens"    stroke="#3b82f6" fillOpacity={1} fill="url(#gOpen)"    strokeWidth={2} name="최초 오픈" />
                            <Area type="monotone" dataKey="signups"  stroke="#00A980" fillOpacity={1} fill="url(#gSignup)"  strokeWidth={3} name="회원가입" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </SectionCard>

            {/* 채널별 성과 + 목적지 유형별 성과 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* 채널별 성과 */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">채널별 유입 성과</h3>
                    <p className="text-sm text-gray-400 mb-6">인스타그램, 블로거, 스토어 등 유입 경로별 활성 유저</p>
                    <div className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.channels} layout="vertical" margin={{ left: 50, right: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#f0f0f0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false}
                                    tick={{ fill: '#4b5563', fontSize: 12 }} width={150} />
                                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(v: any) => [v?.toLocaleString() + '명', '유입 유저']} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={22}>
                                    {data.channels?.map((_: any, i: number) => (
                                        <Cell key={i} fill={['#00A980', '#3b82f6', '#f59e0b', '#8b5cf6', '#f43f5e', '#06b6d4'][i % 6]} />
                                    ))}
                                    <LabelList dataKey="value" position="right" style={{ fontSize: '12px', fontWeight: '600', fill: '#6b7280' }}
                                        formatter={(v: any) => v?.toLocaleString()} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 목적지 유형별 성과 */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">목적지 유형별 성과</h3>
                    <p className="text-sm text-gray-400 mb-6">작가 프로필, 포트폴리오, 스토어 등 링크 목적지 기준</p>
                    {pathStats.length === 0 ? (
                        <div className="h-[260px] flex items-center justify-center text-sm text-gray-400">링크 데이터 없음</div>
                    ) : (
                        <div className="space-y-4">
                            {pathStats.map((p) => {
                                const maxUsers = Math.max(...pathStats.map(x => x.users), 1);
                                const barWidth = p.users > 0 ? Math.max(Math.round((p.users / maxUsers) * 100), 4) : 0;
                                return (
                                    <div key={p.targetType}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                                                <span className="text-sm font-medium text-gray-700">{p.label}</span>
                                                <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">링크 {p.linkTotal}개</span>
                                            </div>
                                            <div className="text-right flex items-center gap-3">
                                                {p.users > 0 ? (
                                                    <span className="text-sm font-bold text-gray-800">{p.users.toLocaleString()}명</span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">수집 중</span>
                                                )}
                                                {p.conversionRate > 0 && (
                                                    <span className="text-xs text-gray-500">{p.conversionRate}%</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-500"
                                                style={{ width: `${barWidth}%`, backgroundColor: p.color }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* 캠페인별 성과 */}
            <SectionCard
                title="캠페인별 성과"
                sub="utm_campaign 기준으로 묶인 링크 그룹의 유입 및 전환 현황"
                badge={<span className="text-xs font-medium px-2 py-1 bg-[#00A980]/10 text-[#00A980] rounded">Link Hub 연동</span>}
            >
                {campaignStats.length === 0 ? (
                    <div className="py-12 text-center text-sm text-gray-400">
                        캠페인 데이터가 없습니다. 링크 생성 후 유입이 발생하면 표시됩니다.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                                    <th className="pb-3 pl-2">캠페인명</th>
                                    <th className="pb-3">주요 채널</th>
                                    <th className="pb-3 text-right">링크 수</th>
                                    <th className="pb-3 text-right">유입 유저</th>
                                    <th className="pb-3 text-right">전환율</th>
                                    <th className="pb-3 text-right">성과</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {campaignStats.map((c) => (
                                    <tr key={c.name} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-3.5 pl-2">
                                            <span className="font-semibold text-gray-900 text-sm">{c.name}</span>
                                        </td>
                                        <td className="py-3.5">
                                            <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">{c.channelLabel}</span>
                                        </td>
                                        <td className="py-3.5 text-right text-sm text-gray-600">{c.links}</td>
                                        <td className="py-3.5 text-right font-bold text-gray-900 text-sm">{c.users.toLocaleString()}</td>
                                        <td className="py-3.5 text-right text-sm text-gray-600">{c.conversionRate}%</td>
                                        <td className="py-3.5 text-right"><StatusBadge rate={c.conversionRate} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </SectionCard>

            {/* 핵심 활성화 + 채널 요약 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">신규 유저 행동 활성화</h3>
                    <p className="text-sm text-gray-400 mb-4">최초 실행 유저 중 핵심 행동 수행 비율</p>
                    <div className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={data.activation} cx="50%" cy="50%" innerRadius={65} outerRadius={95}
                                    paddingAngle={8} dataKey="value">
                                    {data.activation?.map((_: any, i: number) => (
                                        <Cell key={i} fill={ACTIVATION_COLORS[i % ACTIVATION_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any, n: any) => [v?.toLocaleString() + '명', n]} />
                                <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
                    <h3 className="text-base font-bold text-gray-800 mb-5">채널별 유입 요약</h3>
                    <div className="space-y-5">
                        {data.channels?.slice(0, 5).map((c: any, i: number) => (
                            <div key={c.name} className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: ['#00A980', '#3b82f6', '#f59e0b', '#8b5cf6', '#f43f5e'][i % 5] }} />
                                    <span className="text-sm font-medium text-gray-700 truncate">{c.name}</span>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <span className="text-sm font-bold text-gray-900">{c.value.toLocaleString()}명</span>
                                    <p className="text-[10px] text-gray-400">가입 전환율 {c.conversionRate}%</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 링크 상세 테이블 */}
            <SectionCard
                title="링크별 상세 성과"
                sub="캠페인명 · 목적지 · 채널 기준으로 세분화된 개별 링크 트래킹 결과"
                badge={<span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded">UTM 추적</span>}
            >
                {enrichedLinks.length === 0 ? (
                    <div className="py-12 text-center text-sm text-gray-400">
                        유입 링크 데이터가 없습니다.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                                    <th className="pb-3 pl-2">캠페인 / 라벨</th>
                                    <th className="pb-3">목적지</th>
                                    <th className="pb-3">채널</th>
                                    <th className="pb-3 text-right">유입 유저</th>
                                    <th className="pb-3 text-right">전환율</th>
                                    <th className="pb-3 text-right">성과</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {enrichedLinks.map((link: any, idx: number) => (
                                    <tr key={`${link.name}-${idx}`} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-3.5 pl-2">
                                            <div className="font-semibold text-gray-900 text-sm">{link.displayName}</div>
                                            {link.campaign && link.displayName !== link.campaign && (
                                                <div className="text-[10px] text-gray-400 mt-0.5">{link.campaign}</div>
                                            )}
                                            <div className="text-[10px] text-gray-300 font-mono">{link.name}</div>
                                        </td>
                                        <td className="py-3.5">
                                            {link.targetType ? (
                                                <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium"
                                                    style={{ backgroundColor: TARGET_TYPE_COLORS[link.targetType as TargetType] + '18', color: TARGET_TYPE_COLORS[link.targetType as TargetType] }}>
                                                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: TARGET_TYPE_COLORS[link.targetType as TargetType] }} />
                                                    {TARGET_TYPE_LABELS[link.targetType as TargetType] ?? link.targetType}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="py-3.5">
                                            {link.channel ? (
                                                <span className="text-xs text-gray-600">
                                                    {CHANNEL_LABELS[link.channel as keyof typeof CHANNEL_LABELS] ?? link.channel}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400">{link.source || '-'}</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 text-right font-bold text-gray-900 text-sm">{link.users?.toLocaleString() || 0}</td>
                                        <td className="py-3.5 text-right text-sm text-gray-600">{link.conversionRate || 0}%</td>
                                        <td className="py-3.5 text-right"><StatusBadge rate={link.conversionRate || 0} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </SectionCard>
        </div>
    );
}

import { useEffect, useState, useMemo } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { getAcquisitionData } from '@/api/analytics';
import { listLinks, CHANNEL_LABELS, type LinkEntry } from '@/api/linkHub';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend,
} from 'recharts';
import { Users, UserCheck, Zap, TrendingUp } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface TrendPoint {
    name: string;
    installs: number;
    opens: number;
    activations: number;
    signups: number;
}

interface ChannelStat {
    name: string;
    users: number;
    activatedUsers: number;
    activationRate: number;
}

interface LinkStat {
    trackingCode: string;
    users: number;
    profileViewUsers: number;
    chatUsers: number;
    bookingUsers: number;
    activatedUsers: number;
    sessionSource: string;
    sessionCampaign: string;
}

interface GlobalActivation {
    totalUsers: number;
    newUsers: number;
    activatedUsers: number;
    activationRate: number;
    profileViewUsers: number;
    chatUsers: number;
    bookingUsers: number;
}

interface AcquisitionData {
    trend: TrendPoint[];
    channelStats: ChannelStat[];
    links: LinkStat[];
    activation: GlobalActivation;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({
    icon,
    label,
    value,
    sub,
    accent,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    sub?: string;
    accent?: boolean;
}) {
    return (
        <div className={`rounded-2xl border p-5 shadow-sm flex items-start gap-4 ${
            accent ? 'bg-[#00A980] border-[#008f6b]' : 'bg-white border-gray-100'
        }`}>
            <div className={`p-2.5 rounded-xl ${accent ? 'bg-white/20 text-white' : 'bg-gray-50 text-gray-500'}`}>
                {icon}
            </div>
            <div>
                <p className={`text-xs font-medium mb-1 ${accent ? 'text-white/80' : 'text-gray-400'}`}>{label}</p>
                <p className={`text-2xl font-bold ${accent ? 'text-white' : 'text-gray-900'}`}>{value}</p>
                {sub && <p className={`text-[11px] mt-0.5 ${accent ? 'text-white/70' : 'text-gray-400'}`}>{sub}</p>}
            </div>
        </div>
    );
}

function SectionCard({
    title,
    sub,
    badge,
    children,
}: {
    title: string;
    sub?: string;
    badge?: React.ReactNode;
    children: React.ReactNode;
}) {
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

function RateBar({ rate, color = '#00A980' }: { rate: number; color?: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(rate, 100)}%`, backgroundColor: color }}
                />
            </div>
            <span className="text-xs font-semibold text-gray-700 w-10 text-right">{rate}%</span>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AcquisitionDashboard() {
    const [data, setData] = useState<AcquisitionData | null>(null);
    const [links, setLinks] = useState<LinkEntry[]>([]);
    const [filters, setFilters] = useState({
        period: '7d',
        platform: 'all',
        userType: 'all',
        startDate: '',
        endDate: '',
    });

    useEffect(() => {
        setData(null);
        getAcquisitionData(
            filters.period, filters.platform, filters.userType,
            filters.startDate, filters.endDate,
        ).then(res => setData(res as unknown as AcquisitionData));
        listLinks({ isActive: '' }).then(res => setLinks(res.items)).catch(() => setLinks([]));
    }, [filters]);

    // tracking_code → LinkEntry lookup
    const trackingMap = useMemo(
        () => new Map<string, LinkEntry>(links.map(l => [l.trackingCode, l])),
        [links],
    );

    // Enrich linkStats with link-hub metadata
    const enrichedLinks = useMemo(() => {
        return (data?.links || []).map(row => {
            const meta = trackingMap.get(row.trackingCode);
            return {
                ...row,
                label: meta?.label || meta?.utmCampaign || row.trackingCode,
                utmCampaign: meta?.utmCampaign || (row.sessionCampaign !== '(not set)' ? row.sessionCampaign : null),
                channel: meta?.channel,
                targetType: meta?.targetType,
                isActive: meta?.isActive,
                hasLinkMeta: !!meta,
            };
        });
    }, [data, trackingMap]);

    // Campaign stats grouped by utmCampaign (source of truth = link-hub)
    const campaignStats = useMemo(() => {
        const map = new Map<string, { users: number; activatedUsers: number; chatUsers: number; links: number }>();
        for (const row of enrichedLinks) {
            const key = row.utmCampaign || '(캠페인 없음)';
            const prev = map.get(key) ?? { users: 0, activatedUsers: 0, chatUsers: 0, links: 0 };
            map.set(key, {
                users: prev.users + row.users,
                activatedUsers: prev.activatedUsers + row.activatedUsers,
                chatUsers: prev.chatUsers + row.chatUsers,
                links: prev.links + 1,
            });
        }
        return Array.from(map.entries())
            .map(([name, s]) => ({
                name,
                users: s.users,
                activatedUsers: s.activatedUsers,
                activationRate: s.users > 0 ? Number(((s.activatedUsers / s.users) * 100).toFixed(1)) : 0,
                chatUsers: s.chatUsers,
                links: s.links,
            }))
            .filter(c => c.users > 0)
            .sort((a, b) => b.users - a.users);
    }, [enrichedLinks]);

    const act = data?.activation;
    const totalUsers = act?.totalUsers ?? 0;
    const newUsers = act?.newUsers ?? 0;
    const activatedUsers = act?.activatedUsers ?? 0;
    const activationRate = act?.activationRate ?? 0;

    if (!data) {
        return (
            <div className="p-8 flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-[#00A980] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 pb-16">
            <DashboardHeader
                title="유입 및 획득 분석"
                filters={filters}
                onFilterChange={f => setFilters(prev => ({ ...prev, ...f }))}
            />

            {/* ── [1] KPI 카드 ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <KpiCard
                    icon={<Users className="w-5 h-5" />}
                    label="총 유입 사용자"
                    value={totalUsers.toLocaleString()}
                    sub="기간 내 앱 접속"
                />
                <KpiCard
                    icon={<TrendingUp className="w-5 h-5" />}
                    label="신규 유입 사용자"
                    value={newUsers.toLocaleString()}
                    sub="first_open 기준"
                />
                <KpiCard
                    icon={<Zap className="w-5 h-5" />}
                    label="활성화 사용자"
                    value={activatedUsers.toLocaleString()}
                    sub="프로필·채팅·예약 중 1개 이상"
                />
                <KpiCard
                    icon={<UserCheck className="w-5 h-5" />}
                    label="활성화율"
                    value={`${activationRate}%`}
                    sub="신규 유입 대비"
                    accent
                />
            </div>

            {/* ── [2] 유입 추이 ── */}
            <SectionCard title="유입 추이" sub="일별 설치·오픈·활성화·가입 현황">
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.trend}>
                            <defs>
                                {[
                                    { id: 'gInstall',  color: '#94a3b8' },
                                    { id: 'gOpen',     color: '#3b82f6' },
                                    { id: 'gAct',      color: '#00A980' },
                                    { id: 'gSignup',   color: '#f59e0b' },
                                ].map(g => (
                                    <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor={g.color} stopOpacity={0.12} />
                                        <stop offset="95%" stopColor={g.color} stopOpacity={0} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                            <Area type="monotone" dataKey="installs"   name="설치"     stroke="#94a3b8" fill="url(#gInstall)" strokeWidth={2} />
                            <Area type="monotone" dataKey="opens"      name="최초 오픈" stroke="#3b82f6" fill="url(#gOpen)"    strokeWidth={2} />
                            <Area type="monotone" dataKey="activations" name="활성화"   stroke="#00A980" fill="url(#gAct)"     strokeWidth={2.5} />
                            <Area type="monotone" dataKey="signups"    name="회원가입"  stroke="#f59e0b" fill="url(#gSignup)"  strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </SectionCard>

            {/* ── [3] 채널별 성과 ── */}
            <SectionCard
                title="채널별 성과"
                sub="utm_source 기준 — 어떤 채널이 활성화 유저를 가져오는가"
            >
                {data.channelStats.length === 0 ? (
                    <p className="py-10 text-center text-sm text-gray-400">채널 데이터가 없습니다.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                                    <th className="pb-3 pl-2">채널</th>
                                    <th className="pb-3 text-right">유입 사용자</th>
                                    <th className="pb-3 text-right">활성화 사용자</th>
                                    <th className="pb-3 min-w-[160px]">활성화율</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {data.channelStats.map(ch => (
                                    <tr key={ch.name} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-3.5 pl-2 font-semibold text-gray-900 text-sm">{ch.name}</td>
                                        <td className="py-3.5 text-right text-sm text-gray-600">{ch.users.toLocaleString()}</td>
                                        <td className="py-3.5 text-right font-bold text-gray-900 text-sm">{ch.activatedUsers.toLocaleString()}</td>
                                        <td className="py-3.5 pr-2">
                                            <RateBar rate={ch.activationRate} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </SectionCard>

            {/* ── [4] 캠페인별 성과 ── */}
            <SectionCard
                title="캠페인별 성과"
                sub="utm_campaign 기준 — 어떤 캠페인이 실제 행동을 유도하는가"
                badge={<span className="text-xs font-medium px-2 py-1 bg-[#00A980]/10 text-[#00A980] rounded">Link Hub 연동</span>}
            >
                {campaignStats.length === 0 ? (
                    <p className="py-10 text-center text-sm text-gray-400">
                        링크를 통한 유입 후 활성화 데이터가 쌓이면 표시됩니다.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                                    <th className="pb-3 pl-2">캠페인 (utm_campaign)</th>
                                    <th className="pb-3 text-right">링크 수</th>
                                    <th className="pb-3 text-right">유입 사용자</th>
                                    <th className="pb-3 text-right">활성화</th>
                                    <th className="pb-3 text-right">채팅 시작</th>
                                    <th className="pb-3 min-w-[140px]">활성화율</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {campaignStats.map(c => (
                                    <tr key={c.name} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-3.5 pl-2">
                                            <span className="font-semibold text-gray-900 text-sm">{c.name}</span>
                                        </td>
                                        <td className="py-3.5 text-right text-sm text-gray-500">{c.links}</td>
                                        <td className="py-3.5 text-right text-sm text-gray-600">{c.users.toLocaleString()}</td>
                                        <td className="py-3.5 text-right font-bold text-gray-900 text-sm">{c.activatedUsers.toLocaleString()}</td>
                                        <td className="py-3.5 text-right text-sm text-gray-500">{c.chatUsers.toLocaleString()}</td>
                                        <td className="py-3.5 pr-2">
                                            <RateBar rate={c.activationRate} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </SectionCard>

            {/* ── [5] 링크별 성과 ── */}
            <SectionCard
                title="링크별 성과"
                sub="tracking_code 기준 — 어떤 링크가 실제 행동을 유도하는가"
                badge={<span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded">Deep Link 추적</span>}
            >
                {enrichedLinks.length === 0 ? (
                    <p className="py-10 text-center text-sm text-gray-400">
                        딥링크를 통한 유입 데이터가 없습니다.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                                    <th className="pb-3 pl-2">링크 (라벨 / 캠페인)</th>
                                    <th className="pb-3">채널</th>
                                    <th className="pb-3 text-right">유입</th>
                                    <th className="pb-3 text-right">프로필 진입</th>
                                    <th className="pb-3 text-right">채팅 시작</th>
                                    <th className="pb-3 text-right">예약 진입</th>
                                    <th className="pb-3 min-w-[130px]">활성화율</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {enrichedLinks.map((row, idx) => {
                                    const activationRate = row.users > 0
                                        ? Number(((row.activatedUsers / row.users) * 100).toFixed(1))
                                        : 0;
                                    const channelLabel = row.channel
                                        ? (CHANNEL_LABELS[row.channel as keyof typeof CHANNEL_LABELS] ?? row.channel)
                                        : (row.sessionSource || '-');
                                    return (
                                        <tr key={`${row.trackingCode}-${idx}`} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-3.5 pl-2">
                                                <div className="font-semibold text-gray-900 text-sm">{row.label}</div>
                                                {row.utmCampaign && row.utmCampaign !== row.label && (
                                                    <div className="text-[10px] text-gray-400 mt-0.5">{row.utmCampaign}</div>
                                                )}
                                                <div className="text-[10px] text-gray-300 font-mono">{row.trackingCode}</div>
                                            </td>
                                            <td className="py-3.5 text-xs text-gray-500">{channelLabel}</td>
                                            <td className="py-3.5 text-right font-bold text-gray-900 text-sm">{row.users.toLocaleString()}</td>
                                            <td className="py-3.5 text-right text-sm text-gray-600">{row.profileViewUsers.toLocaleString()}</td>
                                            <td className="py-3.5 text-right text-sm text-gray-600">{row.chatUsers.toLocaleString()}</td>
                                            <td className="py-3.5 text-right text-sm text-gray-600">{row.bookingUsers.toLocaleString()}</td>
                                            <td className="py-3.5 pr-2">
                                                <RateBar rate={activationRate} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </SectionCard>

            {/* ── [6] 행동 활성화 Breakdown ── */}
            <SectionCard
                title="행동 활성화 Breakdown"
                sub="신규 유입 유저 중 핵심 행동 수행 비율 (first_open 기준)"
            >
                {newUsers === 0 ? (
                    <p className="py-10 text-center text-sm text-gray-400">데이터가 없습니다.</p>
                ) : (
                    <div className="space-y-6">
                        {[
                            {
                                label: '작가 프로필 진입',
                                value: act?.profileViewUsers ?? 0,
                                color: '#00A980',
                                desc: '프로필 상세 화면 진입',
                            },
                            {
                                label: '메시지 전송',
                                value: act?.chatUsers ?? 0,
                                color: '#3b82f6',
                                desc: '채팅방 메시지 1회 이상',
                            },
                            {
                                label: '예약 진입',
                                value: act?.bookingUsers ?? 0,
                                color: '#f59e0b',
                                desc: '예약 의도 이벤트 발생',
                            },
                        ].map(item => {
                            const rate = newUsers > 0 ? Number(((item.value / newUsers) * 100).toFixed(1)) : 0;
                            return (
                                <div key={item.label}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <span className="text-sm font-semibold text-gray-800">{item.label}</span>
                                            <span className="text-xs text-gray-400 ml-2">{item.desc}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-bold text-gray-900">
                                                {item.value.toLocaleString()}명
                                            </span>
                                            <span className="text-xs font-semibold text-gray-500 w-12 text-right">
                                                {rate}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(rate, 100)}%`, backgroundColor: item.color }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        <p className="text-xs text-gray-400 pt-2">
                            기준: 신규 유입 {newUsers.toLocaleString()}명 / 총 활성화 {activatedUsers.toLocaleString()}명 ({activationRate}%)
                        </p>
                    </div>
                )}
            </SectionCard>
        </div>
    );
}

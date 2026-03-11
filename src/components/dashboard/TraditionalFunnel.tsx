import React from 'react';

interface FunnelItem {
    stage: string;
    count: number;
    percentage: number;
    dropoffFromPrev?: number;
    conversionFromPrev?: number;
    key?: string;
}

interface TraditionalFunnelProps {
    items: FunnelItem[];
    colorBase: string[];
}

export const TraditionalFunnel: React.FC<TraditionalFunnelProps> = ({ items, colorBase }) => {
    if (!items || items.length === 0) return null;

    return (
        <div className="flex flex-col gap-2">
            {items.map((item, idx) => {
                const width = 100 - (idx * (60 / (items.length || 1))); // 점점 좁아지는 폭 계산

                return (
                    <React.Fragment key={item.stage}>
                        {/* 퍼널 조각 */}
                        <div className="flex flex-col items-center">
                            <div
                                className="h-14 flex items-center justify-between px-6 rounded-lg transition-all duration-700 relative overflow-hidden group hover:shadow-lg border border-white/20"
                                style={{
                                    width: `${width}%`,
                                    backgroundColor: colorBase[idx % colorBase.length],
                                    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3)'
                                }}
                            >
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-black/40 uppercase tracking-tighter leading-none mb-1">{item.stage}</span>
                                    <span className="text-xl font-black text-black tracking-tight">{item.count.toLocaleString()}</span>
                                </div>
                                <span className="text-2xl font-black text-black/20 group-hover:text-black/40 transition-colors uppercase italic">{item.percentage}%</span>
                            </div>
                        </div>

                        {/* 단계 사이 이탈 지표 (이전 단계 대비 dropRate) */}
                        {idx < items.length - 1 && items[idx+1]?.dropoffFromPrev !== undefined && items[idx+1].dropoffFromPrev! > 0 && (
                            <div className="flex justify-center py-1">
                                <div className="bg-red-50 px-3 py-1 rounded-full flex items-center gap-2 border border-red-100 shadow-sm animate-pulse">
                                    <span className="text-[10px] font-black text-red-400">LEAKAGE</span>
                                    <span className="text-xs font-black text-red-600">이전 대비 이탈 {items[idx+1].dropoffFromPrev}%</span>
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="text-red-400">
                                        <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
                                    </svg>
                                </div>
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

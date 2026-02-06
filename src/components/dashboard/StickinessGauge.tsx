import React from 'react';

interface StickinessGaugeProps {
    value: number; // 0 to 100
}

export const StickinessGauge: React.FC<StickinessGaugeProps> = ({ value }) => {
    // value가 "15.2%" 같은 문자열일 경우를 대비해 처리
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    const percentage = isNaN(numericValue) ? 0 : Math.min(Math.max(numericValue, 0), 100);

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col justify-center">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Stickiness (DAU/MAU)</h3>
                    <p className="text-xs text-gray-400 mt-1">사용자 습관성 및 방문 강도</p>
                </div>
                <span className="text-3xl font-black text-gray-900">{percentage}%</span>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden relative">
                <div
                    className="h-full bg-gradient-to-r from-[#00A980] to-[#00D1A0] rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${percentage}%` }}
                />
                <div className="absolute inset-0 flex justify-around pointer-events-none">
                    <div className="w-px h-full bg-white opacity-20" style={{ left: '25%' }} />
                    <div className="w-px h-full bg-white opacity-20" style={{ left: '50%' }} />
                    <div className="w-px h-full bg-white opacity-20" style={{ left: '75%' }} />
                </div>
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400">
                <span>0%</span>
                <span>Low</span>
                <span>Target (20%+)</span>
                <span>High</span>
            </div>
        </div>
    );
};

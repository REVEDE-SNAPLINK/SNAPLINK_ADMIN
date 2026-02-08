import React from 'react';

interface MetricCardProps {
    title: string;
    value: string | number;
    change?: string;
    isPositive?: boolean;
    subtitle?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, isPositive, subtitle }) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
                {subtitle && <span className="text-[10px] font-bold text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded">{subtitle}</span>}
            </div>
            <div className="flex items-baseline gap-3">
                <h3 className="text-3xl font-black text-gray-900 tracking-tight">{value}</h3>
                {change !== undefined && Number(change) !== 0 && (
                    <div className={`flex items-center gap-0.5 text-sm font-black px-2 py-0.5 rounded-full ${isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}>
                        <span>{isPositive ? '↑' : '↓'}</span>
                        <span>{Math.abs(Number(change))}%</span>
                    </div>
                )}
            </div>
        </div>
    );
};

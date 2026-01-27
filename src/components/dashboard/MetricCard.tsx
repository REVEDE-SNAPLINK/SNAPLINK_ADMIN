import React from 'react';

interface MetricCardProps {
    title: string;
    value: string | number;
    change?: string;
    isPositive?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, isPositive }) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <div className="flex items-end gap-2">
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                {change && (
                    <span className={`text-xs font-semibold mb-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '↑' : '↓'} {change}
                    </span>
                )}
            </div>
        </div>
    );
};

import React from 'react';

interface CohortRow {
    date: string;
    newUsers: number;
    d0: number;
    d1: number;
    d7: number;
    d30: number;
}

interface CohortTableProps {
    data: CohortRow[];
}

export const CohortTable: React.FC<CohortTableProps> = ({ data }) => {
    const getBgColor = (value: number) => {
        if (value >= 50) return 'bg-[#00A980] text-white';
        if (value >= 30) return 'bg-[#00A980]/70 text-white';
        if (value >= 15) return 'bg-[#00A980]/40 text-gray-800';
        if (value >= 5) return 'bg-[#00A980]/15 text-gray-700';
        return 'bg-gray-50 text-gray-400';
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">코호트 리텐션 (Cohort Retention)</h3>
                    <p className="text-xs text-gray-500 mt-1">가입 일자별 유저 재방문율 추이</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <div className="w-2 h-2 rounded-full bg-[#00A980]" /> High
                        <div className="w-2 h-2 rounded-full bg-gray-200 ml-2" /> Low
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="py-3 text-left font-bold text-gray-900 w-32">가입 일자</th>
                            <th className="py-3 text-right font-bold text-gray-900 w-24">신규 유저</th>
                            <th className="py-3 text-center font-bold text-gray-400 uppercase tracking-tighter w-16">Day 0</th>
                            <th className="py-3 text-center font-bold text-gray-400 uppercase tracking-tighter w-16">Day 1</th>
                            <th className="py-3 text-center font-bold text-gray-400 uppercase tracking-tighter w-16">Day 7</th>
                            <th className="py-3 text-center font-bold text-gray-400 uppercase tracking-tighter w-16 text-xs">Day 30</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {(data || []).map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-3 font-semibold text-gray-600">{row.date}</td>
                                <td className="py-3 text-right font-black text-gray-900">{row.newUsers.toLocaleString()}</td>
                                <td className={`py-3 text-center font-black ${getBgColor(row.d0)}`}>{row.d0}%</td>
                                <td className={`py-3 text-center font-black ${getBgColor(row.d1)}`}>{row.d1}%</td>
                                <td className={`py-3 text-center font-black ${getBgColor(row.d7)}`}>{row.d7}%</td>
                                <td className={`py-3 text-center font-black ${getBgColor(row.d30)}`}>{row.d30}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

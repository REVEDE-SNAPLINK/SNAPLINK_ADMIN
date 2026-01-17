import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    isSameMonth,
    isSameDay,
    parseISO
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { clsx } from 'clsx';

// Mock Data for shootings
interface Shooting {
    id: number;
    date: string;
    title: string;
    time: string;
    location: string;
    photographer: string;
    status: 'CONFIRMED' | 'PENDING';
}

const MOCK_SHOOTINGS: Shooting[] = [
    {
        id: 1,
        date: '2026-01-17',
        title: '강남구 기업 행사 촬영',
        time: '14:00 - 16:00',
        location: '서울시 강남구 테헤란로 123',
        photographer: '김작가',
        status: 'CONFIRMED'
    },
    {
        id: 2,
        date: '2026-01-17',
        title: '웨딩 스냅 야외 촬영',
        time: '11:00 - 13:00',
        location: '서울숲 가족마당',
        photographer: '이작가',
        status: 'PENDING'
    },
    {
        id: 3,
        date: '2026-01-20',
        title: '제품 홍보 영상 촬영',
        time: '09:00 - 18:00',
        location: '성수동 스튜디오',
        photographer: '박작가',
        status: 'CONFIRMED'
    }
];

export default function SchedulePage() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Calendar Navigation
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const onDateClick = (day: Date) => setSelectedDate(day);

    // Calendar Generation
    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between mb-8 px-4">
                <span className="text-2xl font-bold text-gray-900">
                    {format(currentMonth, 'yyyy년 M월', { locale: ko })}
                </span>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ChevronRight className="w-6 h-6 text-gray-600" />
                    </button>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        return (
            <div className="grid grid-cols-7 mb-4">
                {days.map((day, i) => (
                    <div key={i} className={`text-center font-bold text-sm ${i === 0 ? 'text-red-500' : 'text-gray-500'}`}>
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = '';

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, 'd');
                const cloneDay = day;
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, monthStart);

                days.push(
                    <div
                        key={day.toString()}
                        className={clsx(
                            "relative aspect-square flex items-center justify-center cursor-pointer rounded-full transition-all duration-200 m-1",
                            !isCurrentMonth && "text-gray-300",
                            isCurrentMonth && !isSelected && "text-gray-700 hover:bg-gray-100",
                            isSelected && "bg-[#00A980] text-white shadow-md font-bold"
                        )}
                        onClick={() => onDateClick(cloneDay)}
                    >
                        <span className="text-lg">{formattedDate}</span>
                        {/* Dot indicator for events */}
                        {MOCK_SHOOTINGS.some(s => isSameDay(parseISO(s.date), day)) && !isSelected && (
                            <div className="absolute bottom-2 w-1.5 h-1.5 bg-[#00A980] rounded-full"></div>
                        )}
                        {MOCK_SHOOTINGS.some(s => isSameDay(parseISO(s.date), day)) && isSelected && (
                            <div className="absolute bottom-2 w-1.5 h-1.5 bg-white rounded-full"></div>
                        )}
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div key={day.toString()} className="grid grid-cols-7">
                    {days}
                </div>
            );
            days = [];
        }
        return <div>{rows}</div>;
    };

    // Filtered shootings for selected date
    const selectedShootings = MOCK_SHOOTINGS.filter(s => isSameDay(parseISO(s.date), selectedDate));

    return (
        <div className="h-full flex flex-col p-8">
            <PageHeader title="행사/일정" onSearch={(term) => console.log(term)} />

            <div className="flex flex-col lg:flex-row gap-8 h-full min-h-[600px]">
                {/* Left: Calendar */}
                <div className="w-full lg:w-[450px] bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex-shrink-0">
                    {renderHeader()}
                    {renderDays()}
                    {renderCells()}
                </div>

                {/* Right: Shooting List */}
                <div className="flex-1 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="text-[#00A980]">{format(selectedDate, 'd일', { locale: ko })}</span>
                            <span>행사 일정</span>
                        </h2>
                        <span className="text-gray-400 font-medium">
                            {format(selectedDate, 'yyyy.MM.dd (EEE)', { locale: ko })}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                        {selectedShootings.length > 0 ? (
                            selectedShootings.map(item => (
                                <div key={item.id} className="p-5 rounded-xl bg-gray-50 border border-gray-100 hover:border-[#00A980] transition-colors group">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-[#00A980] transition-colors">{item.title}</h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                            }`}>
                                            {item.status === 'CONFIRMED' ? '확정' : '대기'}
                                        </span>
                                    </div>
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <span>{item.time}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            <span>{item.location}</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-500">담당 작가</span>
                                        <span className="font-bold text-gray-800">{item.photographer}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                    <Clock className="w-8 h-8 text-gray-300" />
                                </div>
                                <p>등록된 일정이 없습니다.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

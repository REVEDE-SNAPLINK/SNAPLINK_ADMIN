import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';
import LogoIcon from '@/assets/icons/logo-white.svg';
import LogoText from '@/assets/icons/logo-text-white.svg';
import ArrowDownIcon from '@/assets/icons/arrow-down.svg';

// Sidebar items configuration
const NAV_ITEMS = [
    {
        label: '대시보드',
        subItems: [
            { label: '종합 KPI', path: '/dashboard/general' },
            { label: '유입 및 획득', path: '/dashboard/acquisition' },
            { label: '퍼널 분석', path: '/dashboard/funnel' },
            { label: '작가 성과', path: '/dashboard/creator' },
        ]
    },
    {
        label: '촬영관리',
        subItems: [
            { label: '촬영목록', path: '/shootings' },
            { label: '촬영등록', path: '/shootings/new' },
        ]
    },
    {
        label: '일정관리',
        subItems: [
            { label: '캘린더', path: '/schedule' },
        ]
    },
    {
        label: '게시판',
        subItems: [
            { label: '공지사항', path: '/notice' },
        ]
    },
    {
        label: '고객관리',
        subItems: [
            { label: '회원목록', path: '/users' },
        ]
    },
    {
        label: '예약 조회',
        subItems: [
            { label: '예약현황', path: '/reservations' },
        ]
    },
    {
        label: '혜택등록',
        subItems: [
            { label: '이벤트관리', path: '/events' },
        ]
    },
    {
        label: '채팅',
        subItems: [
            { label: '메시지', path: '/chat' },
        ]
    },
    {
        label: '광고관리',
        subItems: [
            { label: '광고현황', path: '/ad' },
        ]
    },
    {
        label: '프로모션관리',
        subItems: [
            { label: '프로모션', path: '/promotions' },
        ]
    },
    {
        label: '데이터분석',
        subItems: [
            { label: '분석대시보드', path: '/analytics' },
        ]
    },
    {
        label: '신고관리',
        subItems: [
            { label: '신고현황', path: '/reports' },
        ]
    },
];

import { useState } from 'react';

export function MainLayout() {
    const { signOut } = useAuthStore();
    const navigate = useNavigate();
    const [openMenus, setOpenMenus] = useState<string[]>([]);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const toggleMenu = (label: string) => {
        setOpenMenus(prev =>
            prev.includes(label)
                ? prev.filter(item => item !== label)
                : [...prev, label]
        );
    };

    const nickname = "snaplinkstaff01"

    return (
        <>
            {/* header */}
            <div className="h-[65px] bg-[#2D3539] flex justify-between items-center pl-6 pr-6">
                <div className="flex items-center">
                    <img src={LogoIcon} className="mr-2.5" />
                    <img src={LogoText} />
                </div>
                <div className="flex items-center">
                    <span className="text-white font-medium">
                        {nickname}님
                    </span>
                    <button
                        className="border border-white border-solid ml-2.5 rounded-full py-0.5 px-2.5"
                        type="button"
                    >
                        <span className="text-white text-base font-medium">내 계정 정보</span>
                    </button>
                    <a
                        href="/"
                        className="text-white font-medium text-base px-6"
                        onClick={(e) => {
                            e.preventDefault();
                            handleLogout();
                        }}
                    >로그아웃</a>
                </div>
            </div>
            <div
                className="flex bg-white font-sans"
                style={{ height: 'calc(100vh - 65px)' }}
            >
                {/* Sidebar */}
                <aside
                    className="flex-shrink-0 flex flex-col bg-[#475161] pt-[30px] overflow-y-auto overflow-x-hidden custom-scrollbar"
                    style={{ width: '210px' }}
                >
                    <style>{`
                        .custom-scrollbar::-webkit-scrollbar {
                            width: 6px;
                            background-color: transparent;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb {
                            background-color: rgba(255, 255, 255, 0.2);
                            border-radius: 10px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                            background-color: rgba(255, 255, 255, 0.3);
                        }
                        .custom-scrollbar {
                            scrollbar-width: thin;
                            scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
                        }
                        @supports (overflow: overlay) {
                            .custom-scrollbar {
                                overflow-y: overlay !important;
                            }
                        }
                    `}</style>
                    {/* Navigation Items */}
                    <nav className="pb-10 w-[210px]">
                        {NAV_ITEMS.map((item) => {
                            const isOpen = openMenus.includes(item.label);
                            return (
                                <div key={item.label} className="flex flex-col w-[210px]">
                                    <button
                                        onClick={() => toggleMenu(item.label)}
                                        className="relative flex items-center pl-[16px] pr-[30px] w-[210px] h-[55px] border-b border-[#5a6473] text-[18px] font-bold text-white bg-transparent text-left outline-none cursor-pointer flex-shrink-0"
                                    >
                                        <span className="truncate">{item.label}</span>
                                        <div className="absolute right-[10px] top-1/2 -translate-y-1/2 flex items-center">
                                            <img
                                                src={ArrowDownIcon}
                                                className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                                            />
                                        </div>
                                    </button>
                                    <div
                                        className={`overflow-hidden transition-all duration-300 ease-in-out w-[210px] flex-shrink-0`}
                                        style={{
                                            maxHeight: isOpen ? `${item.subItems.length * 42}px` : '0px',
                                            backgroundColor: '#39404C'
                                        }}
                                    >
                                        {item.subItems.map((subItem) => (
                                            <NavLink
                                                key={subItem.path}
                                                to={subItem.path}
                                                className={({ isActive }) =>
                                                    `flex items-center pl-[16px] w-[210px] h-[42px] text-[15px] font-medium text-white no-underline border-none flex-shrink-0 ${isActive ? 'bg-[#5a6473]' : ''}`
                                                }
                                            >
                                                {subItem.label}
                                            </NavLink>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#EDF0F5]">
                    {/* Page Content */}
                    <div className="min-h-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </>
    );
}

// Protected Route Wrapper
export function ProtectedRoute() {
    const { status, accessToken } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (status === 'idle') return; // Wait for bootstrap
        if (status === 'anon' || !accessToken) {
            navigate('/login', { replace: true });
        }
    }, [status, accessToken, navigate]);

    if (status === 'loading' || status === 'idle') {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    if (status === 'anon' || !accessToken) return null;

    return <MainLayout />;
}

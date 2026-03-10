import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';
import LogoIcon from '@/assets/icons/logo/logo_white.svg';
import LogoText from '@/assets/icons/logo/logo_text_white.svg';
import ArrowDownIcon from '@/assets/icons/arrow_down.svg';

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
            { label: '일반 촬영 접수 내역', path: '/shootings/general' },
            { label: '단체 행사 촬영 접수 내역', path: '/shootings/group' },
            { label: '촬영 등록', path: '/shootings/register' },
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
            { label: '공지사항', path: '/board/notice' },
            { label: '자주 묻는 질문', path: '/board/faq' },
            { label: '소식', path: '/board/news' },
        ]
    },
    {
        label: '고객관리',
        subItems: [
            { label: '촬영 고객 관리', path: '/customers/clients' },
            { label: '사진 작가 관리', path: '/customers/photographers' },
        ]
    },
    {
        label: '채팅',
        subItems: [
            { label: '메시지', path: '/chat' },
        ]
    },
    {
        label: '광고 및 프로모션 관리',
        subItems: [
            { label: '광고현황', path: '/marketing/ads' },
            { label: '이벤트 관리', path: '/marketing/events' },
            { label: '프로모션', path: '/marketing/promotions' },
            { label: '링크 관리', path: '/marketing/links' },
        ]
    },
    {
        label: '데이터분석',
        subItems: [
            { label: '분석 대시보드', path: '/analytics/dashboard' },
            { label: '데이터 다운로드', path: '/analytics/download' },
        ]
    },
    {
        label: '콘텐츠 관리',
        subItems: [
            { label: '포트폴리오 검수', path: '/content/portfolio' },
            { label: '커뮤니티 관리', path: '/content/community' },
            { label: '카테고리, 태그 관리', path: '/content/tags' },
        ]
    },
    {
        label: '정산 매출 관리',
        subItems: [
            { label: '정산 대기 내역', path: '/settlement/pending' },
            { label: '세금 계산서 및 영수증 발행', path: '/settlement/tax' },
            { label: '수수료 설정', path: '/settlement/fees' },
        ]
    },
    {
        label: '고객 지원 관리',
        subItems: [
            { label: '신고 접수 내역', path: '/cs/reports' },
            { label: '1:1 문의 내역', path: '/cs/inquiry' },
            { label: 'FAQ 질문 관리', path: '/cs/faq' },
            { label: '채팅 로그 모니터링', path: '/cs/chat-log' },
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
                <main className="flex-1 flex flex-col overflow-hidden bg-[#EDF0F5]">
                    {/* Page Content */}
                    <div className="flex-1 w-full h-full overflow-y-auto min-h-0 flex flex-col">
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

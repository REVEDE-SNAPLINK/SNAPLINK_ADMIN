import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import Logo from '@/assets/icons/logo.svg';
import { clsx } from 'clsx';
import { LogOut } from 'lucide-react';
import { useEffect } from 'react';

// Sidebar items configuration
const NAV_ITEMS = [
    { label: '접수된 신고', path: '/reports' },
    { label: '접수된 행사촬영', path: '/shootings' },
    { label: '행사/일정', path: '/schedule' },
    { label: '예약 조회', path: '/reservations' },
    { label: '주요 현황', path: '/dashboard' },
    { label: '공지사항 관리', path: '/notice' },
    { label: 'FAQ 관리', path: '/faq' },
    { label: '회원 관리', path: '/users' },
    { label: '채팅', path: '/chat' },
    { label: '프로모션 배너 관리', path: '/banners' },
];

export function MainLayout() {
    const { signOut } = useAuthStore();
    const navigate = useNavigate();




    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="flex min-h-screen bg-white font-sans">
            {/* Sidebar */}
            <aside
                className="flex-shrink-0 flex flex-col bg-white border-r border-black"
                style={{ width: '253px' }}
            >
                {/* Logo Area */}
                <div className="p-8 flex items-center justify-center">
                    <img src={Logo} alt="SnapLink Logo" className="w-32" />
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 flex flex-col gap-[11px] px-4 overflow-y-auto pb-4">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => clsx(
                                "flex items-center justify-center px-4 h-[56px] rounded-lg border text-[20px] font-bold transition-colors duration-200",
                                isActive
                                    ? "bg-[#00A980] border-[#00A980] text-white"
                                    : "bg-white border-[#00A980] text-[#00A980] hover:bg-green-50"
                            )}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer / Logout */}
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center w-full h-[56px] rounded-lg border border-gray-300 text-gray-500 font-bold hover:bg-gray-100 transition-colors"
                    >
                        <LogOut className="w-5 h-5 mr-2" />
                        로그아웃
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-gray-50">
                {/* Page Content */}
                <div className="min-h-full">
                    <Outlet />
                </div>
            </main>
        </div>
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

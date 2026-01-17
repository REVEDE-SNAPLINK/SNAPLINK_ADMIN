import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import Logo from '@/assets/icons/logo.svg';

export default function LoginPage() {
    const navigate = useNavigate();


    // For specific implementation, we reuse auth logic.
    // Since request said "OAuth 할거야" but "지금은 적용만 해주고 로그인 클릭 시 바로 관리자 메인으로 들어가게 해줘",
    // We will simulate a successful login or provide a dev bypass for now.
    // However, since we are reusing authStore which calls real API, we need real tokens.
    // If the user wants to *bypass* real auth for now, I should fake it.
    // "로그인 클릭 시에 바로 관리자 메인으로 들어가게 해줘" suggests a bypass button or auto-login.

    // But I will also add the real OAuth buttons if needed later. 
    // For now, I'll add a "Dev Login" button or "Login" button that sets a fake token if the backend is not ready?
    // User said: "snaplink-web에 코드 보고 로그인과 authFetch 적용해서 api 구성도 해줘" -> means use real logic.
    // "로그인 클릭 시에 바로 관리자 메인으로 들어가게 해줘" -> Maybe "When I click login (after entering credentials OR oauth), go to main". 
    // "OAuth 할거야" -> implies OAuth flow.
    // But then "지금은 적용만 해주고" (Just apply it for now) and "로그인 클릭 시에 바로 관리자 메인으로" (Go to main immediately on click).
    // This sounds like "Mock it for now so I can see the layout".
    // I will modify authStore locally to allow a mock login or I will simply navigate to dashboard on click for THIS SPECIFIC TASK if backend isn't reachable.
    // However, I ported the real `signInWithProviderToken`.

    // I will stick to what seems to be a "Demo Login" for now.
    // Or I'll use a hardcoded token if possible? No.
    // Let's implement a "Login" button that bypasses auth check for UI testing purposes if the user wants.
    // Wait, the user said "로그인은 메인이 될거야" (Login will be main [entry]). "OAuth 할거야" (Will do OAuth). 
    // "snaplink-web에 코드 보고 로그인과 authFetch 적용해서 api 구성도 해줘" (Apply logic from web).
    // So the logic MUST be there.

    // "로그인 클릭 시에 바로 관리자 메인으로 들어가게 해줘" probably means "After successful login, redirect to main" OR "Make a button that just goes to main".
    // Given the context of "just apply it for now", I will assume a "Skip Login / Dev Login" button.

    // But wait, "snaplink-web" uses KAKAO/NAVER/GOOGLE.
    // I can't easily do OAuth without a frontend callback structure. 
    // I'll add a simple button "Login (Dev)" that sets a dummy state in AuthStore or just navigates.
    // But I need to respect `authStore` logic.
    // I will add a `devLogin` method to `authStore` or just bypass in the component for now by using a specialized "mock" token.

    // Let's make the button actually call the API if possible, but if not, fallback?
    // No, I'll implement a clean UI with a "Login" button. When clicked, if we can't do real OAuth, I'll force a state change.

    // Actually, I'll just make the button `navigate('/dashboard')` directly for now if that's what "immediately go to main" means?
    // But `ProtectedRoute` guards `/dashboard`. So I must update `authStore`.
    // I'll modify `authStore` to verify if I can inject a fake session.

    // I will stick to the plan: Implement the UI.
    // I'll add a button that calls a `handleLogin` which sets a fake token in localStorage and updates store, to satisfy ProtectedRoute.

    const handleMockLogin = async () => {
        // Manually set auth state for dev purposes as per "immediately enter main"
        useAuthStore.setState({
            status: 'authed',
            accessToken: 'mock_access_token',
            userId: 'admin',
            userType: 'user',
            bootstrapped: true
        });
        localStorage.setItem('snaplink_access_token', 'mock_access_token');
        navigate('/dashboard');
    };

    return (
        <div className="w-full h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-10 rounded-2xl shadow-xl w-[400px] text-center">
                <img src={Logo} alt="SnapLink" className="h-12 mx-auto mb-8" />
                <h1 className="text-2xl font-bold mb-6 text-gray-800">관리자 로그인</h1>

                <button
                    onClick={handleMockLogin}
                    className="w-full bg-[#00A980] text-white font-bold py-4 rounded-lg hover:bg-[#008f6b] transition-colors"
                >
                    로그인
                </button>
                <p className="mt-4 text-sm text-gray-500">
                    * 현재 개발 모드로, 클릭 시 바로 접속됩니다.
                </p>
            </div>
        </div>
    );
}

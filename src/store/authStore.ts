import { create } from 'zustand';
import { signInApi, refreshApi, logoutApi, withdrawApi } from '@/api/auth';
import {
    saveRefreshToken,
    loadRefreshToken,
    clearRefreshToken,
    saveAccessToken,
    clearAccessToken,
    saveUserId,
    loadUserId,
    clearUserId,
    saveUserType,
    loadUserType,
    clearUserType,
} from '@/auth/tokenStore';
import { jwtDecode } from 'jwt-decode';

type AuthStatus = 'idle' | 'loading' | 'authed' | 'anon' | 'needs_signup';
type UserType = 'user' | 'photographer';

type AuthState = {
    status: AuthStatus;
    userId: string;
    userType: UserType;
    accessToken: string | null;
    bootstrapped: boolean;

    // actions
    bootstrap: () => Promise<void>;
    signInWithProviderToken: (provider: 'KAKAO' | 'NAVER' | 'GOOGLE', token: string) => Promise<'LOGIN_SUCCESS' | 'SIGNUP_REQUIRED'>;
    signOut: () => Promise<void>;
    withdraw: () => Promise<void>;
    getAccessToken: () => Promise<string | null>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
    status: 'idle',
    bootstrapped: false,
    userId: '',
    userType: 'user',
    accessToken: null,

    async bootstrap() {
        try {
            console.log('[AuthStore] Bootstrap starting...');
            const refreshToken = await loadRefreshToken();

            if (!refreshToken) {
                console.log('[AuthStore] No refresh token found, setting anon status');
                set({ status: 'anon', accessToken: null, userId: '', bootstrapped: true });
                return;
            }

            console.log('[AuthStore] Refresh token found, attempting to refresh...');
            const startTime = Date.now();

            // 5초 타임아웃 추가
            const refreshPromise = refreshApi(refreshToken);
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Refresh timeout')), 5000)
            );

            const refreshed = await Promise.race([refreshPromise, timeoutPromise]);

            const elapsed = Date.now() - startTime;
            console.log(`[AuthStore] Token refreshed successfully in ${elapsed}ms`);

            if (refreshed.refreshToken && refreshed.refreshToken !== refreshToken) {
                console.log('[AuthStore] New refresh token received, saving...');
                await saveRefreshToken(refreshed.refreshToken);
            }

            await saveAccessToken(refreshed.accessToken);

            // Load userId and userType from persistent storage
            const [savedUserId, savedUserType] = await Promise.all([
                loadUserId(),
                loadUserType(),
            ]);

            console.log('[AuthStore] Loaded userId:', savedUserId, 'userType:', savedUserType);

            set({
                accessToken: refreshed.accessToken,
                status: 'authed',
                userId: savedUserId || '',
                userType: savedUserType || 'user',
                bootstrapped: true,
            });
            console.log('[AuthStore] Bootstrap completed successfully');
        } catch (e) {
            console.error('[AuthStore] Bootstrap failed:', e);
            await Promise.allSettled([
                clearRefreshToken(),
                clearAccessToken(),
            ]);
            set({ status: 'anon', accessToken: null, userId: '', bootstrapped: true });
        }
    },

    async signInWithProviderToken(provider, token): Promise<'LOGIN_SUCCESS' | 'SIGNUP_REQUIRED'> {
        set({ status: 'loading' });
        try {
            const response = await signInApi(provider, token);

            if (response.status === 'LOGIN_SUCCESS') {
                const userType = response.role === 'USER' ? 'user' : 'photographer';

                // Save tokens and user data to persistent storage
                await Promise.all([
                    saveRefreshToken(response.tokens.refreshToken),
                    saveAccessToken(response.tokens.accessToken),
                    saveUserId(response.userId),
                    saveUserType(userType),
                ]);

                set({
                    status: 'authed',
                    accessToken: response.tokens.accessToken,
                    userId: response.userId,
                    userType,
                });
            } else {
                // Save userId even in needs_signup state
                await saveUserId(response.userId);

                set({
                    status: 'needs_signup',
                    userId: response.userId,
                    accessToken: null,
                });
            }

            return response.status;
        } catch (e) {
            set({ status: 'anon', accessToken: null });
            console.error(e);
            throw e;
        }
    },

    async signOut() {
        set({ status: 'anon', accessToken: null, userId: '' });

        // Clear all persistent storage
        await Promise.allSettled([
            clearRefreshToken(),
            clearAccessToken(),
            clearUserId(),
            clearUserType(),
        ]);

        // 서버 로그아웃은 best-effort
        try {
            await logoutApi();
        } catch (e) {
            console.error('[AuthStore] Logout API call failed:', e);
        }
    },

    async withdraw() {
        const result = await withdrawApi().then(
            () => ({ ok: true as const }),
            (e) => ({ ok: false as const, e }),
        );

        // Clear all persistent storage
        await Promise.allSettled([
            clearRefreshToken(),
            clearAccessToken(),
            clearUserId(),
            clearUserType(),
        ]);

        set({ status: 'anon', accessToken: null, userId: '' });

        // 필요하면 호출한 쪽에서 에러 핸들링할 수 있게 throw
        if (!result.ok) throw result.e;
    },

    async getAccessToken(): Promise<string | null> {
        const accessToken = get().accessToken;

        if (accessToken && !isJwtExpired(accessToken)) {
            return accessToken;
        }

        const refreshToken = await loadRefreshToken();
        if (!refreshToken) {
            console.log('[getAccessToken] No refresh token available');
            return null;
        }

        try {
            const refreshed = await refreshApi(refreshToken);

            if (refreshed.refreshToken && refreshed.refreshToken !== refreshToken) {
                await saveRefreshToken(refreshed.refreshToken);
            }

            await saveAccessToken(refreshed.accessToken);

            set({
                status: 'authed',
                accessToken: refreshed.accessToken,
            });

            return refreshed.accessToken;
        } catch (e) {
            console.error('[getAccessToken] Token refresh failed:', e);
            await Promise.allSettled([
                clearRefreshToken(),
                clearAccessToken(),
            ]);
            set({ accessToken: null });
            return null;
        }
    },
}));

const isJwtExpired = (token: string, skewSeconds = 30) => {
    try {
        const { exp } = jwtDecode<{ exp?: number }>(token);
        const expMs = (exp ?? 0) * 1000;
        return Date.now() >= expMs - skewSeconds * 1000;
    } catch {
        return true;
    }
};

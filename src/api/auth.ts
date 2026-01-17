import { API_BASE_URL } from '@/config/api';
import { authFetch } from '@/api/utils';

const AUTH_BASE = `${API_BASE_URL}/api/auth`;

type LoginSuccessResponse = {
    status: 'LOGIN_SUCCESS';
    userId: string;
    role: 'USER' | 'PHOTOGRAPHER';
    tokens: {
        accessToken: string;
        refreshToken: string;
    };
};

type SignupRequiredResponse = {
    status: 'SIGNUP_REQUIRED';
    userId: string;
};

export type SignInResponse = LoginSuccessResponse | SignupRequiredResponse;

/**
 * 로그인 (소셜 로그인 토큰으로)
 */
export async function signInApi(provider: string, token: string): Promise<SignInResponse> {
    const response = await fetch(`${AUTH_BASE}/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, token }),
    });

    if (!response.ok) {
        throw new Error(`Failed to sign in: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status === 'LOGIN_SUCCESS') {
        return {
            status: data.status,
            userId: data.userId,
            role: data.role,
            tokens: {
                accessToken: data.tokens.accessToken,
                refreshToken: data.tokens.refreshToken,
            },
        };
    }

    return {
        status: data.status,
        userId: data.userId,
    };
}

/**
 * 토큰 갱신
 */
export async function refreshApi(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string }> {
    const response = await fetch(`${AUTH_BASE}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
        throw new Error(`Failed to refresh tokens: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
        accessToken: data.access_token ?? data.accessToken,
        refreshToken: data.refresh_token ?? data.refreshToken,
    };
}

export interface SignUpFormData {
    name: string;
    nickname: string;
    email: string;
    birthDate: string;
    gender: 'MALE' | 'FEMALE' | null;
    role: 'USER' | 'PHOTOGRAPHER';
    consentMarketing: boolean;
    id: string;
}

/**
 * 로그아웃
 */
export async function logoutApi(): Promise<void> {
    const response = await authFetch(`${AUTH_BASE}/logout`, {
        method: 'POST',
    });

    if (!response.ok) {
        throw new Error(`Failed to logout: ${response.status}`);
    }
}

/**
 * 회원 탈퇴
 */
export async function withdrawApi(): Promise<void> {
    const response = await authFetch(`${AUTH_BASE}/withdraw`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error(`Failed to withdraw: ${response.status}`);
    }
}

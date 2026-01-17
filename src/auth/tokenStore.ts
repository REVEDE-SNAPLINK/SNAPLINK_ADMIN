const REFRESH_TOKEN_KEY = 'snaplink_refresh_token';
const USER_ID_KEY = 'snaplink_user_id';
const USER_TYPE_KEY = 'snaplink_user_type';
const ACCESS_TOKEN_KEY = 'snaplink_access_token';

export async function saveRefreshToken(token: string): Promise<void> {
    try {
        localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch (e) {
        console.error('Failed to save refresh token:', e);
    }
}

export async function loadRefreshToken(): Promise<string | null> {
    try {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (e) {
        console.error('Failed to load refresh token:', e);
        return null;
    }
}

export async function clearRefreshToken(): Promise<void> {
    try {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (e) {
        console.error('Failed to clear refresh token:', e);
    }
}

export async function saveAccessToken(token: string): Promise<void> {
    try {
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } catch (e) {
        console.error('Failed to save access token:', e);
    }
}

export async function loadAccessToken(): Promise<string | null> {
    try {
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch (e) {
        console.error('Failed to load access token:', e);
        return null;
    }
}

export async function clearAccessToken(): Promise<void> {
    try {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
    } catch (e) {
        console.error('Failed to clear access token:', e);
    }
}

export async function saveUserId(userId: string): Promise<void> {
    try {
        localStorage.setItem(USER_ID_KEY, userId);
    } catch (e) {
        console.error('Failed to save user id:', e);
    }
}

export async function loadUserId(): Promise<string | null> {
    try {
        return localStorage.getItem(USER_ID_KEY);
    } catch (e) {
        console.error('Failed to load user id:', e);
        return null;
    }
}

export async function clearUserId(): Promise<void> {
    try {
        localStorage.removeItem(USER_ID_KEY);
    } catch (e) {
        console.error('Failed to clear user id:', e);
    }
}

export async function saveUserType(userType: 'user' | 'photographer'): Promise<void> {
    try {
        localStorage.setItem(USER_TYPE_KEY, userType);
    } catch (e) {
        console.error('Failed to save user type:', e);
    }
}

export async function loadUserType(): Promise<'user' | 'photographer' | null> {
    try {
        const type = localStorage.getItem(USER_TYPE_KEY);
        return type === 'user' || type === 'photographer' ? type : null;
    } catch (e) {
        console.error('Failed to load user type:', e);
        return null;
    }
}

export async function clearUserType(): Promise<void> {
    try {
        localStorage.removeItem(USER_TYPE_KEY);
    } catch (e) {
        console.error('Failed to clear user type:', e);
    }
}

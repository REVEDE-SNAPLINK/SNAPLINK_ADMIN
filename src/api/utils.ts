import { useAuthStore } from '@/store/authStore';

export type AuthRequestInit = RequestInit & {
    json?: unknown;
};

/**
 * 인증이 필요한 API 요청을 위한 fetch wrapper
 * Authorization 헤더를 자동으로 추가하고, 401 발생 시 토큰 갱신 후 재시도
 */
export const authFetch = async (
    input: Parameters<typeof fetch>[0],
    init: AuthRequestInit = {},
): Promise<Response> => {
    const { getAccessToken } = useAuthStore.getState();
    const accessToken = await getAccessToken();

    const headers = new Headers(init.headers);
    if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
    }

    let body = init.body;
    if (init.json !== undefined) {
        body = JSON.stringify(init.json);
        if (!headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
        }
    }

    const nextInit: RequestInit & { json?: unknown } = { ...init, headers, body };
    delete nextInit.json;

    const doFetch = async (reqInit: RequestInit) => {
        const res = await fetch(input as RequestInfo | URL, reqInit);

        // 로깅
        console.log('--------------------------------------');
        console.log('url:', input);
        console.log('request:', {
            method: reqInit.method || 'GET',
            headers: Object.fromEntries((reqInit.headers as Headers).entries()),
            body: typeof reqInit.body === 'string' ? reqInit.body.slice(0, 500) : reqInit.body,
        });

        const text = await res.clone().text();
        let json: unknown = null;
        try {
            json = JSON.parse(text);
        } catch {
            // JSON 파싱 실패 시 무시
        }

        console.log('response:', {
            ok: res.ok,
            status: res.status,
            statusText: res.statusText,
            body: text.slice(0, 500),
            json,
        });
        console.log('--------------------------------------');

        return res;
    };

    try {
        let response = await doFetch(nextInit);

        // 401이면 토큰 갱신 후 1회 재시도
        if (response.status === 401 && accessToken) {
            const { accessToken: currentToken } = useAuthStore.getState();
            if (currentToken) {
                useAuthStore.setState({ accessToken: null });
            }

            const refreshed = await getAccessToken();
            if (!refreshed) return response;

            const retryHeaders = new Headers(init.headers);
            retryHeaders.set('Authorization', `Bearer ${refreshed}`);
            if (init.json !== undefined && !retryHeaders.has('Content-Type')) {
                retryHeaders.set('Content-Type', 'application/json');
            }

            const retryInit: RequestInit & { json?: unknown } = { ...init, headers: retryHeaders, body };
            delete retryInit.json;

            response = await doFetch(retryInit);
        }

        return response;
    } catch (error) {
        console.error('Network error:', error);
        throw error;
    }
};

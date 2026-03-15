import axios from 'axios';

// --- Types ---

export type TargetType =
  | 'photographer_profile'
  | 'portfolio_post'
  | 'community_post'
  | 'landing'
  | 'store';

export type LinkChannel =
  | 'blogger'
  | 'instagram_ads'
  | 'instagram_profile'
  | 'creator_personal'
  | 'app_share'
  | 'landing_download'
  | 'manual_campaign';

export type OwnerType =
  | 'system'
  | 'marketer'
  | 'creator'
  | 'blogger'
  | 'app_user';

export type CreateLinkRequest = {
  targetType: TargetType;
  targetId?: string;
  path?: string;

  channel: LinkChannel;
  ownerType: OwnerType;
  ownerId?: string;

  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;

  label?: string;
};

export type LinkEntry = {
  code: string;
  shareUrl: string;
  path: string;
  trackingCode: string;

  targetType: TargetType;
  targetId?: string;

  channel: LinkChannel;
  ownerType: OwnerType;
  ownerId?: string;

  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;

  label?: string;
  isActive: boolean;
  createdAt: string;
};

export type UpdateLinkRequest = Partial<
  Pick<
    LinkEntry,
    | 'label'
    | 'isActive'
    | 'ownerId'
    | 'utmSource'
    | 'utmMedium'
    | 'utmCampaign'
    | 'utmContent'
    | 'path'
  >
>;

// --- Channel Meta (UTM 자동 매핑) ---

export const CHANNEL_LABELS: Record<LinkChannel, string> = {
  blogger:           '블로거',
  instagram_ads:     '인스타 광고',
  instagram_profile: '인스타 프로필',
  creator_personal:  '작가 개인 홍보',
  app_share:         '앱 내 공유',
  landing_download:  '랜딩 다운로드',
  manual_campaign:   '수동 캠페인',
};

export const CHANNEL_UTM_MAP: Record<LinkChannel, { source: string; medium: string } | null> = {
  blogger:           { source: 'blogger',   medium: 'referral'    },
  instagram_ads:     { source: 'instagram', medium: 'paid_social' },
  instagram_profile: { source: 'instagram', medium: 'social'      },
  creator_personal:  { source: 'creator',   medium: 'referral'    },
  app_share:         { source: 'app',       medium: 'share'       },
  landing_download:  { source: 'landing',   medium: 'cta'         },
  manual_campaign:   null, // 수동 입력
};

// --- API Client ---

const BASE_URL = 'https://go.snaplink.run';

const linkHubApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

linkHubApi.interceptors.request.use(async (config) => {
  const { useAuthStore } = await import('@/store/authStore');
  const accessToken = await useAuthStore.getState().getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const listLinks = async (params?: {
  q?: string;
  targetType?: string;
  channel?: string;
  ownerType?: string;
  isActive?: string | boolean;
}): Promise<{ items: LinkEntry[]; total: number }> => {
  const response = await linkHubApi.get('/api/links', { params });
  return response.data;
};

export const getLink = async (code: string): Promise<LinkEntry> => {
  const response = await linkHubApi.get(`/api/links/${code}`);
  return response.data;
};

export const createLink = async (payload: CreateLinkRequest): Promise<{
  code: string;
  trackingCode: string;
  shareUrl: string;
  path: string;
}> => {
  const response = await linkHubApi.post('/api/links', payload);
  return response.data;
};

export const updateLink = async (code: string, payload: UpdateLinkRequest): Promise<LinkEntry> => {
  const response = await linkHubApi.patch(`/api/links/${code}`, payload);
  return response.data;
};

export const deactivateLink = async (code: string): Promise<LinkEntry> => {
  const response = await linkHubApi.delete(`/api/links/${code}`);
  return response.data;
};

// --- Presets API ---

export const getCampaignPresets = async (): Promise<string[]> => {
  const response = await linkHubApi.get('/api/presets', { params: { type: 'campaign' } });
  return (response.data as { items: string[] }).items;
};

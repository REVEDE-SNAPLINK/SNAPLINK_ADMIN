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

// --- API Client ---

const BASE_URL = 'https://go.snaplink.run';

const linkHubApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
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

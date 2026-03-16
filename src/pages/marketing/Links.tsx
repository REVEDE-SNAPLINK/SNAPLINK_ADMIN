import { useState, useEffect, useCallback, useRef } from 'react';
import PageLayout from '@/layouts/PageLayout';
import { Table, type Column } from '@/components/common/Table';
import {
  Plus, Copy, ExternalLink, Edit2, Trash2, MoreVertical,
  CheckCircle2, XCircle, Link as LinkIcon, ChevronDown
} from 'lucide-react';
import {
  listLinks, createLink, updateLink, deactivateLink, deleteLinkPermanent, getCampaignPresets,
  CHANNEL_LABELS, CHANNEL_UTM_MAP,
  type LinkEntry, type CreateLinkRequest, type UpdateLinkRequest,
  type TargetType, type LinkChannel, type OwnerType,
} from '@/api/linkHub';

// --- 채널별 ownerType 자동 추론 ---
const CHANNEL_OWNER_MAP: Record<LinkChannel, OwnerType> = {
  blogger:           'blogger',
  instagram_ads:     'marketer',
  instagram_profile: 'marketer',
  creator_personal:  'creator',
  app_share:         'app_user',
  landing_download:  'marketer',
  manual_campaign:   'marketer',
};

// --- Components ---

const Badge = ({ active }: { active: boolean }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
    active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
  }`}>
    {active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
    {active ? 'Active' : 'Inactive'}
  </span>
);

const CopyButton = ({ text, label }: { text: string, label?: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={(e) => { e.stopPropagation(); handleCopy(); }}
      className="flex items-center gap-1.5 px-2 py-1 hover:bg-gray-100 rounded text-xs text-gray-500 transition-colors"
      title={`${label || text} 복사`}
    >
      <Copy className={`w-3.5 h-3.5 ${copied ? 'text-[#00A980]' : ''}`} />
      {copied ? '복사됨!' : (label || '복사')}
    </button>
  );
};

// --- Main Page ---

export default function LinksPage() {
  const [links, setLinks] = useState<LinkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<LinkEntry | null>(null);

  const [filters, setFilters] = useState({
    q: '',
    targetType: '',
    channel: '',
    ownerType: '',
    isActive: '' as string | boolean
  });

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listLinks(filters);
      setLinks(data.items);
    } catch (err) {
      console.error('Failed to fetch links:', err);
      setError('링크 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const handleDeactivate = async (code: string) => {
    if (!window.confirm('정말 이 링크를 비활성화하시겠습니까?')) return;
    try {
      await deactivateLink(code);
      fetchLinks();
    } catch {
      alert('링크 비활성화에 실패했습니다.');
    }
  };

  const handleDeletePermanent = async (code: string) => {
    if (!window.confirm('정말 이 링크를 영구 삭제하시겠습니까? 관련 통계 데이터 추적이 불가능해질 수 있습니다.')) return;
    try {
      await deleteLinkPermanent(code);
      fetchLinks();
    } catch {
      alert('링크 삭제에 실패했습니다.');
    }
  };

  const columns: Column<LinkEntry>[] = [
    {
      header: '라벨 / 이름',
      accessor: (item) => (
        <div className="flex flex-col">
          <span className="font-bold text-gray-900">{item.label || 'No Label'}</span>
          <span className="text-[10px] text-gray-400">{item.code}</span>
        </div>
      ),
      className: 'min-w-[200px]'
    },
    {
      header: '상태',
      accessor: (item) => <Badge active={item.isActive} />,
    },
    {
      header: '목적지 (Target)',
      accessor: (item) => (
        <div className="flex flex-col">
          <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded w-fit mb-1 font-medium">{item.targetType}</span>
          <span className="text-sm text-gray-600 truncate max-w-[150px]">{item.targetId || item.path}</span>
        </div>
      )
    },
    {
      header: '채널',
      accessor: (item) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-gray-700">{CHANNEL_LABELS[item.channel] ?? item.channel}</span>
          <span className="text-[11px] text-gray-400">{item.ownerId || '-'}</span>
        </div>
      )
    },
    {
      header: 'UTM 캠페인',
      accessor: (item) => (
        <div className="flex flex-col gap-0.5 text-[11px] text-gray-600">
          <div className="font-medium">{item.utmCampaign || '-'}</div>
          <div className="text-gray-400">{item.utmContent || ''}</div>
        </div>
      )
    },
    {
      header: '공유 URL',
      accessor: (item) => (
        <div className="flex items-center gap-2">
          <CopyButton text={item.shareUrl} label="URL" />
          <a
            href={item.shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-500 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )
    },
    {
      header: '액션',
      accessor: (item) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedLink(item); setIsEditModalOpen(true); }}
            className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600 transition-colors"
            title="수정"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {item.isActive ? (
            <button
              onClick={(e) => { e.stopPropagation(); handleDeactivate(item.code); }}
              className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-orange-500 transition-colors"
              title="비활성화"
            >
              <XCircle className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); handleDeletePermanent(item.code); }}
              className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500 transition-colors"
              title="영구 삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <PageLayout
      title="링크 관리 (Link Hub)"
      onSearch={(q) => setFilters(prev => ({ ...prev, q }))}
      searchPlaceholder="라벨, 코드, 캠페인 검색..."
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Target Type Filter */}
          <select
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#00A980] bg-white shadow-sm"
            value={filters.targetType}
            onChange={(e) => setFilters(prev => ({ ...prev, targetType: e.target.value }))}
          >
            <option value="">적용 대상 전체</option>
            <option value="photographer_profile">작가 프로필</option>
            <option value="portfolio_post">포트폴리오</option>
            <option value="community_post">커뮤니티 게시글</option>
            <option value="landing">랜딩 페이지</option>
            <option value="store">스토어</option>
          </select>

          {/* Channel Filter */}
          <select
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#00A980] bg-white shadow-sm"
            value={filters.channel}
            onChange={(e) => setFilters(prev => ({ ...prev, channel: e.target.value }))}
          >
            <option value="">채널 전체</option>
            {(Object.entries(CHANNEL_LABELS) as [LinkChannel, string][]).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#00A980] bg-white shadow-sm"
            value={typeof filters.isActive === 'string' ? filters.isActive : (filters.isActive ? 'true' : 'false')}
            onChange={(e) => {
              const val = e.target.value;
              setFilters(prev => ({ ...prev, isActive: val === '' ? '' : (val === 'true') }));
            }}
          >
            <option value="">상태 전체</option>
            <option value="true">활성</option>
            <option value="false">비활성</option>
          </select>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-[#00A980] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#008f6b] transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <Plus className="w-5 h-5" />
          새 링크 생성
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 flex items-center gap-3">
          <XCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-[#00A980] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-bold text-gray-500">데이터를 불러오는 중...</span>
            </div>
          </div>
        )}
        <Table
          data={links}
          columns={columns}
          onRowClick={(item) => {
            setSelectedLink(item);
            setIsDetailDrawerOpen(true);
          }}
        />
      </div>

      {/* Detail Drawer */}
      {isDetailDrawerOpen && selectedLink && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsDetailDrawerOpen(false)} />
          <div className="relative w-full max-w-[500px] bg-white h-full shadow-2xl animate-slide-in-right overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{selectedLink.label || '상세 정보'}</h2>
                    <Badge active={selectedLink.isActive} />
                  </div>
                  <p className="text-gray-400 text-sm font-mono">{selectedLink.code}</p>
                </div>
                <button onClick={() => setIsDetailDrawerOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <MoreVertical className="w-6 h-6 text-gray-400 rotate-90" />
                </button>
              </div>

              <div className="space-y-8">
                <Section title="공유 정보">
                  <InfoRow label="Share URL" value={selectedLink.shareUrl} copyable />
                  <InfoRow label="Tracking Code" value={selectedLink.trackingCode} copyable />
                  <InfoRow label="Path" value={selectedLink.path} />
                </Section>

                <Section title="타겟 설정">
                  <InfoRow label="Target Type" value={selectedLink.targetType} />
                  <InfoRow label="Target ID" value={selectedLink.targetId || '-'} />
                </Section>

                <Section title="운영 정보">
                  <InfoRow label="채널" value={CHANNEL_LABELS[selectedLink.channel] ?? selectedLink.channel} />
                  <InfoRow label="UTM Source" value={selectedLink.utmSource || '-'} />
                  <InfoRow label="UTM Medium" value={selectedLink.utmMedium || '-'} />
                  <InfoRow label="Owner ID" value={selectedLink.ownerId || '-'} />
                </Section>

                <Section title="캠페인 정보">
                  <InfoRow label="Campaign" value={selectedLink.utmCampaign || '-'} />
                  <InfoRow label="Content" value={selectedLink.utmContent || '-'} />
                </Section>

                <div className="pt-8 border-t border-gray-100 flex gap-3">
                  <button
                    onClick={() => { setIsDetailDrawerOpen(false); setIsEditModalOpen(true); }}
                    className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-colors"
                  >
                    수정하기
                  </button>
                  {selectedLink.isActive ? (
                    <button
                      onClick={() => handleDeactivate(selectedLink.code)}
                      className="px-6 py-3 border border-orange-200 text-orange-600 rounded-xl font-bold hover:bg-orange-50 transition-colors"
                    >
                      비활성화
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        handleDeletePermanent(selectedLink.code);
                        setIsDetailDrawerOpen(false);
                      }}
                      className="px-6 py-3 border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-colors"
                    >
                      영구 삭제
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {(isCreateModalOpen || (isEditModalOpen && selectedLink)) && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }} />
          <div className="relative w-full max-w-[650px] bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="px-8 py-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {isCreateModalOpen ? '새 링크 만들기' : '링크 정보 수정'}
              </h2>
              <button onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="p-8 max-h-[70vh] overflow-y-auto">
              <LinkForm
                initialData={isEditModalOpen ? selectedLink : undefined}
                onSubmit={async (payload) => {
                  try {
                    if (isCreateModalOpen) {
                      const result = await createLink(payload as CreateLinkRequest);
                      alert(`링크가 생성되었습니다!\n코드: ${result.code}\nTracking: ${result.trackingCode}`);
                    } else {
                      await updateLink(selectedLink!.code, payload as UpdateLinkRequest);
                    }
                    fetchLinks();
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                  } catch {
                    alert('실패했습니다. 입력값을 확인해주세요.');
                  }
                }}
                onCancel={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out; }
      `}</style>
    </PageLayout>
  );
}

// --- Form Sub-component ---

type LinkFormData = Omit<LinkEntry, 'code' | 'shareUrl' | 'trackingCode' | 'createdAt'>;

function LinkForm({
  initialData,
  onSubmit,
  onCancel,
}: {
  initialData?: LinkEntry | null,
  onSubmit: (data: LinkFormData) => void,
  onCancel: () => void
}) {
  const isEdit = !!initialData;

  const defaultChannel: LinkChannel = 'instagram_ads';
  const defaultUtm = CHANNEL_UTM_MAP[defaultChannel];

  const [formData, setFormData] = useState<LinkFormData>(initialData || {
    targetType: 'photographer_profile',
    targetId: '',
    path: '',
    channel: defaultChannel,
    ownerType: CHANNEL_OWNER_MAP[defaultChannel],
    ownerId: '',
    utmSource: defaultUtm?.source ?? '',
    utmMedium: defaultUtm?.medium ?? '',
    utmCampaign: '',
    utmContent: '',
    label: '',
    isActive: true,
  });

  const [campaignPresets, setCampaignPresets] = useState<string[]>([]);
  const [showCampaignDropdown, setShowCampaignDropdown] = useState(false);
  const campaignInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getCampaignPresets()
      .then(setCampaignPresets)
      .catch(() => {/* 프리셋 로드 실패는 무시 */});
  }, []);

  const filteredPresets = campaignPresets.filter(p =>
    p.includes((formData.utmCampaign ?? '').toLowerCase().replace(/\s+/g, '_'))
  );

  const handleChannelChange = (channel: LinkChannel) => {
    const utm = CHANNEL_UTM_MAP[channel];
    const ownerType = CHANNEL_OWNER_MAP[channel];
    setFormData(prev => ({
      ...prev,
      channel,
      ownerType,
      utmSource: utm?.source ?? prev.utmSource,
      utmMedium: utm?.medium ?? prev.utmMedium,
    }));
  };

  const isInternalTarget = ['photographer_profile', 'portfolio_post', 'community_post'].includes(formData.targetType);
  const isManualChannel = formData.channel === 'manual_campaign';
  const utmPreview = CHANNEL_UTM_MAP[formData.channel];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <FormItem label="링크 라벨 (관리용)" required>
          <input
            className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#00A980] transition-colors"
            placeholder="예: 인스타 광고 3월 봄 배너"
            value={formData.label}
            onChange={e => setFormData({ ...formData, label: e.target.value })}
          />
        </FormItem>
        <FormItem label="활성화 여부">
          <div className="flex items-center gap-3 pt-3">
            <input
              type="checkbox"
              id="isActive"
              className="w-5 h-5 accent-[#00A980]"
              checked={formData.isActive}
              onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <label htmlFor="isActive" className="text-sm text-gray-600">사용 가능</label>
          </div>
        </FormItem>
      </div>

      {/* Destination */}
      <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50">
        <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
          <LinkIcon className="w-4 h-4" /> 목적지 설정
        </h4>
        <div className="grid grid-cols-2 gap-6">
          <FormItem label="Target Type" required disabled={isEdit}>
            <select
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#00A980] bg-white disabled:bg-gray-100"
              disabled={isEdit}
              value={formData.targetType}
              onChange={e => setFormData({ ...formData, targetType: e.target.value as TargetType, targetId: '', path: '' })}
            >
              <option value="photographer_profile">작가 프로필</option>
              <option value="portfolio_post">포트폴리오</option>
              <option value="community_post">커뮤니티 글</option>
              <option value="landing">랜딩 페이지</option>
              <option value="store">스토어</option>
            </select>
          </FormItem>

          {isInternalTarget ? (
            <FormItem label="Target ID" required disabled={isEdit}>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#00A980] disabled:bg-gray-100"
                placeholder="숫자 혹은 코드 입력"
                disabled={isEdit}
                value={formData.targetId}
                onChange={e => setFormData({ ...formData, targetId: e.target.value })}
              />
            </FormItem>
          ) : (
            <FormItem label="상세 경로 (Path)" required={formData.targetType === 'landing'}>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#00A980]"
                placeholder="예: /landing/main"
                value={formData.path}
                onChange={e => setFormData({ ...formData, path: e.target.value })}
              />
            </FormItem>
          )}
        </div>
      </div>

      {/* Channel */}
      <div className="p-5 bg-orange-50/40 rounded-2xl border border-orange-100/50">
        <h4 className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-4">유입 채널</h4>
        <div className="grid grid-cols-2 gap-6">
          <FormItem label="채널 선택" required disabled={isEdit}>
            <select
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#00A980] bg-white disabled:bg-gray-100"
              disabled={isEdit}
              value={formData.channel}
              onChange={e => handleChannelChange(e.target.value as LinkChannel)}
            >
              {(Object.entries(CHANNEL_LABELS) as [LinkChannel, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </FormItem>

          <FormItem label="소유자 ID (선택)">
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#00A980]"
              placeholder="예: blogger_anna"
              value={formData.ownerId}
              onChange={e => setFormData({ ...formData, ownerId: e.target.value })}
            />
          </FormItem>
        </div>

        {/* UTM 자동 설정 안내 */}
        {!isManualChannel && utmPreview && (
          <div className="mt-3 flex items-center gap-2 text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>UTM 자동 설정: <strong>source={utmPreview.source}</strong>, <strong>medium={utmPreview.medium}</strong></span>
          </div>
        )}

        {/* manual_campaign 일 때만 UTM 직접 입력 */}
        {isManualChannel && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <FormItem label="UTM Source">
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#00A980]"
                placeholder="naver, instagram..."
                value={formData.utmSource}
                onChange={e => setFormData({ ...formData, utmSource: e.target.value })}
              />
            </FormItem>
            <FormItem label="UTM Medium">
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#00A980]"
                placeholder="blog, ads, social..."
                value={formData.utmMedium}
                onChange={e => setFormData({ ...formData, utmMedium: e.target.value })}
              />
            </FormItem>
          </div>
        )}
      </div>

      {/* Campaign */}
      <div className="pt-2 border-t border-gray-100">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">캠페인 정보</h4>
        <div className="grid grid-cols-2 gap-6">
          {/* Campaign 자동완성 */}
          <FormItem label="캠페인명 (UTM Campaign)">
            <div className="relative" ref={campaignInputRef as React.RefObject<HTMLDivElement>}>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#00A980] pr-10"
                placeholder="spring_promo_2503"
                value={formData.utmCampaign}
                onChange={e => {
                  setFormData({ ...formData, utmCampaign: e.target.value });
                  setShowCampaignDropdown(true);
                }}
                onFocus={() => setShowCampaignDropdown(true)}
                onBlur={() => setTimeout(() => setShowCampaignDropdown(false), 150)}
              />
              <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
              {showCampaignDropdown && filteredPresets.length > 0 && (
                <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white rounded-xl border border-gray-200 shadow-lg max-h-[180px] overflow-y-auto">
                  {filteredPresets.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#00A980]/10 text-gray-700 transition-colors"
                      onMouseDown={() => {
                        setFormData({ ...formData, utmCampaign: preset });
                        setShowCampaignDropdown(false);
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </FormItem>

          <FormItem label="콘텐츠 식별자 (UTM Content)">
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#00A980]"
              placeholder="cta_top_banner"
              value={formData.utmContent}
              onChange={e => setFormData({ ...formData, utmContent: e.target.value })}
            />
          </FormItem>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          캠페인명은 <code className="bg-gray-100 px-1 rounded">소문자_언더스코어</code> 형식 권장 (예: spring_promo_2503)
        </p>
      </div>

      <div className="flex gap-4 pt-8">
        <button
          onClick={onCancel}
          className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-colors"
        >
          취소
        </button>
        <button
          onClick={() => onSubmit(formData)}
          className="flex-1 py-4 bg-[#00A980] text-white rounded-2xl font-bold hover:bg-[#008f6b] transition-colors shadow-lg shadow-green-100"
        >
          {isEdit ? '수정 사항 저장' : '링크 생성하기'}
        </button>
      </div>
    </div>
  );
}

// --- UI Helpers ---

function FormItem({ label, children, required, disabled }: { label: string, children: React.ReactNode, required?: boolean, disabled?: boolean }) {
  return (
    <div className={`flex flex-col gap-2 ${disabled ? 'opacity-60' : ''}`}>
      <label className="text-sm font-bold text-gray-700 ml-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{title}</h3>
      <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value, copyable }: { label: string, value: string, copyable?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">{value}</span>
        {copyable && <CopyButton text={value} />}
      </div>
    </div>
  );
}

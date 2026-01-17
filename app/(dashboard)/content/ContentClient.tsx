'use client';

import { useState, useCallback, useTransition } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageUpload } from '@/components/ui/ImageUpload';
import {
  HeroBanner,
  createHeroBanner,
  updateHeroBanner,
  deleteHeroBanner,
  fetchHeroBanners,
} from './actions';

interface ContentClientProps {
  initialBanners: HeroBanner[];
}

interface BannerForm {
  title: string;
  subtitle: string;
  link: string;
  tags: string;
  image_link: string;
  is_active: boolean;
  display_order: number;
}

const defaultFormState: BannerForm = {
  title: '',
  subtitle: '',
  link: '',
  tags: '',
  image_link: '',
  is_active: true,
  display_order: 0,
};

export default function ContentClient({ initialBanners }: ContentClientProps) {
  const [banners, setBanners] = useState(initialBanners);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [form, setForm] = useState<BannerForm>(defaultFormState);
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshBanners = useCallback(async () => {
    setIsRefreshing(true);
    const result = await fetchHeroBanners();
    if (!result.error) {
      setBanners(result.banners);
    }
    setIsRefreshing(false);
  }, []);

  const openCreateDialog = () => {
    setEditingBanner(null);
    setForm({
      ...defaultFormState,
      display_order: banners.length,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (banner: HeroBanner) => {
    setEditingBanner(banner);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle || '',
      link: banner.link || '',
      tags: banner.tags?.join(', ') || '',
      image_link: banner.image_link,
      is_active: banner.is_active ?? true,
      display_order: banner.display_order ?? 0,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingBanner(null);
    setForm(defaultFormState);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.image_link) return;

    const bannerData = {
      title: form.title,
      subtitle: form.subtitle || null,
      link: form.link || null,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
      image_link: form.image_link,
      is_active: form.is_active,
      display_order: form.display_order,
    };

    startTransition(async () => {
      if (editingBanner) {
        const result = await updateHeroBanner(editingBanner.id, bannerData);
        if (result.success) {
          setBanners(prev => prev.map(b =>
            b.id === editingBanner.id ? { ...b, ...bannerData, updated_at: new Date().toISOString() } : b
          ));
          closeDialog();
        }
      } else {
        const result = await createHeroBanner(bannerData);
        if (result.success && result.banner) {
          setBanners(prev => [...prev, result.banner!]);
          closeDialog();
        }
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말로 이 배너를 삭제하시겠습니까?')) return;

    startTransition(async () => {
      const result = await deleteHeroBanner(id);
      if (result.success) {
        setBanners(prev => prev.filter(b => b.id !== id));
      }
    });
  };

  const handleToggleActive = async (banner: HeroBanner) => {
    startTransition(async () => {
      const result = await updateHeroBanner(banner.id, { is_active: !banner.is_active });
      if (result.success) {
        setBanners(prev => prev.map(b =>
          b.id === banner.id ? { ...b, is_active: !b.is_active } : b
        ));
      }
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">콘텐츠 관리</h1>
      </div>

      <Tabs defaultValue="banners" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="banners">히어로 배너</TabsTrigger>
        </TabsList>

        <TabsContent value="banners">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">배너 목록</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={refreshBanners} disabled={isRefreshing}>
                  <svg className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {isRefreshing ? '로딩중...' : '새로고침'}
                </Button>
                <Button onClick={openCreateDialog}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  배너 추가
                </Button>
              </div>
            </div>

            {banners.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-500">
                등록된 배너가 없습니다
              </div>
            ) : (
              <div className="grid gap-4">
                {banners.map((banner) => (
                  <div
                    key={banner.id}
                    className="bg-white rounded-xl border border-gray-100 overflow-hidden"
                  >
                    <div className="flex flex-col md:flex-row">
                      <div className="relative w-full md:w-64 h-40 md:h-auto flex-shrink-0 bg-gray-100">
                        <Image
                          src={banner.image_link}
                          alt={banner.title}
                          fill
                          className="object-cover"
                        />
                        {!banner.is_active && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white text-sm font-medium px-3 py-1 bg-black/50 rounded-full">
                              비활성화
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 truncate">{banner.title}</h3>
                              <span className="text-xs text-gray-400">#{banner.display_order}</span>
                            </div>
                            {banner.subtitle && (
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{banner.subtitle}</p>
                            )}
                            {banner.link && (
                              <p className="text-xs text-blue-600 truncate mb-2">{banner.link}</p>
                            )}
                            {banner.tags && banner.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {banner.tags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Switch
                              checked={banner.is_active ?? true}
                              onCheckedChange={() => handleToggleActive(banner)}
                              disabled={isPending}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(banner)}
                              disabled={isPending}
                            >
                              수정
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(banner.id)}
                              disabled={isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              삭제
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingBanner ? '배너 수정' : '새 배너 추가'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="image">배너 이미지 *</Label>
              <div className="mt-1.5">
                <ImageUpload
                  value={form.image_link}
                  onChange={(url) => setForm(prev => ({ ...prev, image_link: url as string }))}
                  aspectRatio="banner"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="배너 제목"
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label htmlFor="subtitle">부제목</Label>
              <Input
                id="subtitle"
                value={form.subtitle}
                onChange={(e) => setForm(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="배너 부제목"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="link">링크 URL</Label>
              <Input
                id="link"
                value={form.link}
                onChange={(e) => setForm(prev => ({ ...prev, link: e.target.value }))}
                placeholder="https://..."
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="tags">태그 (쉼표로 구분)</Label>
              <Input
                id="tags"
                value={form.tags}
                onChange={(e) => setForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="신상품, 할인, 추천"
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="display_order">표시 순서</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  className="mt-1.5"
                />
              </div>
              <div className="flex items-center gap-2 pt-7">
                <Switch
                  id="is_active"
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active" className="cursor-pointer">활성화</Label>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={closeDialog}>
                취소
              </Button>
              <Button type="submit" disabled={isPending || !form.title || !form.image_link}>
                {isPending ? '저장 중...' : editingBanner ? '수정' : '추가'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

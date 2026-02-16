'use client';

import { useState, useCallback, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
import { ImageUpload } from '@/components/ui/ImageUpload';
import { BrandHeroBanner, Brand } from '@/types';
import {
  fetchBrandHeroBanners,
  createBrandHeroBanner,
  updateBrandHeroBanner,
  deleteBrandHeroBanner,
} from './actions';

interface BrandHeroBannersClientProps {
  brand: Brand;
  initialBanners: BrandHeroBanner[];
  embedded?: boolean;
}

interface BannerForm {
  title: string;
  subtitle: string;
  link: string;
  color: string;
  image_link: string;
  is_active: boolean;
  display_order: number;
}

const defaultFormState: BannerForm = {
  title: '',
  subtitle: '',
  link: '',
  color: '',
  image_link: '',
  is_active: true,
  display_order: 0,
};

export default function BrandHeroBannersClient({
  brand,
  initialBanners,
  embedded,
}: BrandHeroBannersClientProps) {
  const [banners, setBanners] = useState(initialBanners);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BrandHeroBanner | null>(null);
  const [form, setForm] = useState<BannerForm>(defaultFormState);
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshBanners = useCallback(async () => {
    setIsRefreshing(true);
    const result = await fetchBrandHeroBanners(brand.id);
    if (!result.error) {
      setBanners(result.banners);
    }
    setIsRefreshing(false);
  }, [brand.id]);

  const openCreateDialog = () => {
    setEditingBanner(null);
    setForm({ ...defaultFormState, display_order: banners.length });
    setIsDialogOpen(true);
  };

  const openEditDialog = (banner: BrandHeroBanner) => {
    setEditingBanner(banner);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle || '',
      link: banner.link || '',
      color: banner.color || '',
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
      color: form.color || null,
      image_link: form.image_link,
      is_active: form.is_active,
      display_order: form.display_order,
    };

    startTransition(async () => {
      if (editingBanner) {
        const result = await updateBrandHeroBanner(brand.id, editingBanner.id, bannerData);
        if (result.success) {
          setBanners(prev =>
            prev.map(b =>
              b.id === editingBanner.id
                ? { ...b, ...bannerData, updated_at: new Date().toISOString() }
                : b
            )
          );
          closeDialog();
        }
      } else {
        const result = await createBrandHeroBanner(brand.id, bannerData);
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
      const result = await deleteBrandHeroBanner(brand.id, id);
      if (result.success) {
        setBanners(prev => prev.filter(b => b.id !== id));
      }
    });
  };

  const handleToggleActive = async (banner: BrandHeroBanner) => {
    startTransition(async () => {
      const result = await updateBrandHeroBanner(brand.id, banner.id, {
        is_active: !banner.is_active,
      });
      if (result.success) {
        setBanners(prev =>
          prev.map(b => (b.id === banner.id ? { ...b, is_active: !b.is_active } : b))
        );
      }
    });
  };

  return (
    <div>
      {!embedded && (
        <>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
            <Link href="/brands" className="hover:text-blue-600 transition-colors">
              브랜드
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{brand.name}</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">히어로 배너</span>
          </nav>

          {/* Brand Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-4">
            <div className="relative h-20 md:h-28">
              {brand.banner && (
                <Image src={brand.banner} alt={brand.name} fill className="object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-2 left-3 flex items-center gap-2">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-white bg-white">
                  {brand.logo && (
                    <Image
                      src={brand.logo}
                      alt={brand.name}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <h1 className="text-sm md:text-base font-bold text-white">{brand.name} 히어로 배너</h1>
                  <p className="text-xs text-gray-200">{banners.length}개 배너</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm md:text-base font-semibold text-gray-900">배너 목록</h2>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" onClick={refreshBanners} disabled={isRefreshing}>
            <svg
              className={`w-3.5 h-3.5 mr-1 ${isRefreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="hidden sm:inline">{isRefreshing ? '로딩중...' : '새로고침'}</span>
          </Button>
          <Button size="sm" onClick={openCreateDialog}>
            <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            배너 추가
          </Button>
        </div>
      </div>

      {/* Banner List */}
      {banners.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-100 p-8 text-center text-xs text-gray-500">
          등록된 배너가 없습니다
        </div>
      ) : (
        <div className="grid gap-3">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="bg-white rounded-lg border border-gray-100 overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row">
                <div className="relative w-full sm:w-48 md:w-56 h-32 sm:h-auto shrink-0 bg-gray-100">
                  <Image
                    src={banner.image_link}
                    alt={banner.title}
                    fill
                    className="object-cover"
                  />
                  {!banner.is_active && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-xs font-medium px-2 py-0.5 bg-black/50 rounded-full">
                        비활성화
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 p-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{banner.title}</h3>
                        <span className="text-[10px] text-gray-400">#{banner.display_order}</span>
                      </div>
                      {banner.subtitle && (
                        <p className="text-xs text-gray-600 mb-1 line-clamp-2">
                          {banner.subtitle}
                        </p>
                      )}
                      {banner.link && (
                        <p className="text-[10px] text-blue-600 truncate">{banner.link}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
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
                        className="h-7 px-2 text-xs"
                      >
                        수정
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(banner.id)}
                        disabled={isPending}
                        className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
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

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {editingBanner ? '배너 수정' : '새 배너 추가'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label htmlFor="image" className="text-xs">배너 이미지 *</Label>
              <div className="mt-1">
                <ImageUpload
                  value={form.image_link}
                  onChange={(url) => setForm(prev => ({ ...prev, image_link: url as string }))}
                  aspectRatio="banner"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="title" className="text-xs">제목 *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="배너 제목"
                className="mt-1 text-sm"
                required
              />
            </div>

            <div>
              <Label htmlFor="subtitle" className="text-xs">부제목</Label>
              <Input
                id="subtitle"
                value={form.subtitle}
                onChange={(e) => setForm(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="배너 부제목"
                className="mt-1 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="link" className="text-xs">링크 URL</Label>
              <Input
                id="link"
                value={form.link}
                onChange={(e) => setForm(prev => ({ ...prev, link: e.target.value }))}
                placeholder="https://..."
                className="mt-1 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="color" className="text-xs">배경 색상</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  id="color-picker"
                  value={form.color || '#000000'}
                  onChange={(e) => setForm(prev => ({ ...prev, color: e.target.value }))}
                  className="w-9 h-9 rounded border border-gray-200 cursor-pointer p-0.5"
                />
                <Input
                  id="color"
                  value={form.color}
                  onChange={(e) => setForm(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="#000000"
                  className="text-sm flex-1"
                  maxLength={7}
                />
                {form.color && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 px-2 text-xs text-gray-400"
                    onClick={() => setForm(prev => ({ ...prev, color: '' }))}
                  >
                    초기화
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="display_order" className="text-xs">표시 순서</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={form.display_order}
                  onChange={(e) =>
                    setForm(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))
                  }
                  className="mt-1 text-sm"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  id="is_active"
                  checked={form.is_active}
                  onCheckedChange={(checked) =>
                    setForm(prev => ({ ...prev, is_active: checked }))
                  }
                />
                <Label htmlFor="is_active" className="cursor-pointer text-xs">
                  활성화
                </Label>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={closeDialog}>
                취소
              </Button>
              <Button type="submit" size="sm" disabled={isPending || !form.title || !form.image_link}>
                {isPending ? '저장 중...' : editingBanner ? '수정' : '추가'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

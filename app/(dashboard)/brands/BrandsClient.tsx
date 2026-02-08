'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { DatePicker } from '@/components/ui/date-picker';
import { Brand, Product } from '@/types';
import { createBrand, updateBrand, deleteBrand } from './actions';

interface BrandsClientProps {
  initialBrands: Brand[];
  products: Pick<Product, 'id' | 'brand_id'>[];
}

export default function BrandsClient({ initialBrands, products }: BrandsClientProps) {
  const [brands, setBrands] = useState(initialBrands);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [isPending, startTransition] = useTransition();
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [validPeriodStart, setValidPeriodStart] = useState<Date | undefined>();
  const [validPeriodEnd, setValidPeriodEnd] = useState<Date | undefined>();

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getProductCount = (brandId: string) => {
    return products.filter(p => p.brand_id === brandId).length;
  };

  const isExpired = (brand: Brand) => {
    if (!brand.valid_period_end) return false;
    return new Date(brand.valid_period_end) < new Date();
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const openEditModal = (brand: Brand) => {
    setEditingBrand(brand);
    setLogoUrl(brand.logo || '');
    setBannerUrl(brand.banner || '');
    setValidPeriodStart(brand.valid_period_start ? new Date(brand.valid_period_start) : undefined);
    setValidPeriodEnd(brand.valid_period_end ? new Date(brand.valid_period_end) : undefined);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingBrand(null);
    setLogoUrl('');
    setBannerUrl('');
    setValidPeriodStart(undefined);
    setValidPeriodEnd(undefined);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Add image URLs from state
    formData.set('logo', logoUrl);
    formData.set('banner', bannerUrl);

    // Add valid period dates
    formData.set('valid_period_start', validPeriodStart?.toISOString() || '');
    formData.set('valid_period_end', validPeriodEnd?.toISOString() || '');

    startTransition(async () => {
      if (editingBrand) {
        const result = await updateBrand(editingBrand.id, formData);
        if (result.success && result.data) {
          setBrands(prev => prev.map(b => b.id === editingBrand.id ? result.data! : b));
        }
      } else {
        const result = await createBrand(formData);
        if (result.success && result.data) {
          setBrands(prev => [result.data!, ...prev]);
        }
      }
      setIsModalOpen(false);
    });
  };

  const handleDelete = async (id: string) => {
    const productCount = getProductCount(id);
    if (productCount > 0) {
      alert(`${productCount}개의 상품이 있는 브랜드는 삭제할 수 없습니다. 먼저 상품을 삭제해주세요.`);
      return;
    }
    if (!confirm('이 브랜드를 삭제하시겠습니까?')) return;

    startTransition(async () => {
      const result = await deleteBrand(id);
      if (result.success) {
        setBrands(prev => prev.filter(b => b.id !== id));
      }
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">브랜드</h1>
        <Button onClick={openAddModal}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          브랜드 추가
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <Input
          placeholder="브랜드 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBrands.map(brand => (
          <div key={brand.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="relative h-32">
              {brand.banner && (
                <Image
                  src={brand.banner}
                  alt={brand.name}
                  fill
                  className="object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-3 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white bg-white">
                  {brand.logo && (
                    <Image
                      src={brand.logo}
                      alt={brand.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white">{brand.name}</h3>
                  <p className="text-xs text-gray-200">{brand.slug}</p>
                </div>
              </div>
              <div className="absolute top-3 right-3 flex gap-1">
                {isExpired(brand) && (
                  <div className="bg-red-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                    종료됨
                  </div>
                )}
                {brand.featured && (
                  <div className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                    추천
                  </div>
                )}
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">{brand.description}</p>
              {(brand.valid_period_start || brand.valid_period_end) && (
                <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>
                    {formatDate(brand.valid_period_start) || '시작일 없음'} ~ {formatDate(brand.valid_period_end) || '종료일 없음'}
                  </span>
                </div>
              )}
              <Link
                href={`/brands/${brand.id}/products`}
                className="flex items-center justify-between w-full px-3 py-2 mb-3 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <span>{getProductCount(brand.id)}개 상품</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(brand)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(brand.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                  disabled={isPending}
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingBrand ? '브랜드 수정' : '새 브랜드 추가'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Input
                name="id"
                label="브랜드 ID"
                defaultValue={editingBrand?.id}
                helperText="브랜드 고유 식별자 (예: nike, adidas)"
                required
                disabled={!!editingBrand}
              />
              <Input
                name="name"
                label="브랜드명"
                defaultValue={editingBrand?.name}
                required
              />
              <Input
                name="eng_name"
                label="영문명"
                defaultValue={editingBrand?.eng_name || ''}
                helperText="브랜드 영문 이름 (선택사항)"
              />
              <Input
                name="slug"
                label="슬러그"
                defaultValue={editingBrand?.slug}
                helperText="URL에 사용될 이름 (예: my-brand)"
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  defaultValue={editingBrand?.description}
                  required
                />
              </div>
              <ImageUpload
                value={logoUrl}
                onChange={(url) => setLogoUrl(url as string)}
                label="로고"
                aspectRatio="square"
                helperText="정사각형 이미지 권장 (예: 200x200)"
              />
              <ImageUpload
                value={bannerUrl}
                onChange={(url) => setBannerUrl(url as string)}
                label="배너"
                aspectRatio="banner"
                helperText="가로형 배너 이미지 (예: 1200x400)"
              />
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="featured"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  defaultChecked={editingBrand?.featured || false}
                />
                <span className="ml-2 text-sm text-gray-700">추천 브랜드</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <DatePicker
                  value={validPeriodStart}
                  onChange={setValidPeriodStart}
                  label="판매 시작일"
                  placeholder="시작일 선택"
                  helperText="비워두면 즉시 시작"
                />
                <DatePicker
                  value={validPeriodEnd}
                  onChange={setValidPeriodEnd}
                  label="판매 종료일"
                  placeholder="종료일 선택"
                  helperText="비워두면 무기한"
                />
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  취소
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? '저장 중...' : editingBrand ? '변경사항 저장' : '브랜드 추가'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

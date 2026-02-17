'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { DatePicker } from '@/components/ui/date-picker';
import { Brand, Product } from '@/types';
import { createBrand } from './actions';

interface BrandsClientProps {
  initialBrands: Brand[];
  products: Pick<Product, 'id' | 'brand_id'>[];
}

export default function BrandsClient({ initialBrands, products }: BrandsClientProps) {
  const [brands, setBrands] = useState(initialBrands);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const openAddModal = () => {
    setLogoUrl('');
    setBannerUrl('');
    setValidPeriodStart(undefined);
    setValidPeriodEnd(undefined);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    formData.set('logo', logoUrl);
    formData.set('banner', bannerUrl);
    formData.set('valid_period_start', validPeriodStart?.toISOString() || '');
    formData.set('valid_period_end', validPeriodEnd?.toISOString() || '');

    startTransition(async () => {
      const result = await createBrand(formData);
      if (result.success && result.data) {
        setBrands(prev => [result.data!, ...prev]);
      }
      setIsModalOpen(false);
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg md:text-xl font-bold text-gray-900">브랜드</h1>
        <Button size="sm" onClick={openAddModal}>
          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          브랜드 추가
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 mb-4">
        <Input
          placeholder="브랜드 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {filteredBrands.map(brand => (
          <Link
            key={brand.id}
            href={`/brands/${brand.id}`}
            className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="relative h-24 md:h-28">
              {brand.banner && (
                <Image
                  src={brand.banner}
                  alt={brand.name}
                  fill
                  className="object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-2 left-2.5 flex items-center gap-2">
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
                  <h3 className="text-sm font-bold text-white">{brand.name}</h3>
                  <p className="text-[10px] text-gray-200">{brand.slug}</p>
                </div>
              </div>
              <div className="absolute top-2 right-2 flex gap-1">
                {isExpired(brand) && (
                  <div className="bg-red-600 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                    종료됨
                  </div>
                )}
                {brand.featured && (
                  <div className="bg-blue-600 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                    추천
                  </div>
                )}
              </div>
            </div>
            <div className="p-3">
              <p className="text-xs text-gray-600 line-clamp-2 mb-1.5">{brand.description}</p>
              {(brand.valid_period_start || brand.valid_period_end) && (
                <div className="text-[10px] text-gray-500 mb-1.5 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>
                    {formatDate(brand.valid_period_start) || '시작일 없음'} ~ {formatDate(brand.valid_period_end) || '종료일 없음'}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                <span>{getProductCount(brand.id)}개 상품</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Add Brand Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto m-3">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">새 브랜드 추가</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <Input
                name="id"
                label="브랜드 ID"
                helperText="브랜드 고유 식별자 (예: nike, adidas)"
                required
                className="text-sm"
              />
              <Input
                name="name"
                label="브랜드명"
                required
                className="text-sm"
              />
              <Input
                name="eng_name"
                label="영문명"
                helperText="브랜드 영문 이름 (선택사항)"
                className="text-sm"
              />
              <Input
                name="slug"
                label="슬러그"
                helperText="URL에 사용될 이름 (예: my-brand)"
                required
                className="text-sm"
              />
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  name="description"
                  rows={2}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  required
                />
              </div>
              <div className="max-w-35">
                <ImageUpload
                  value={logoUrl}
                  onChange={(url) => setLogoUrl(url as string)}
                  label="로고"
                  aspectRatio="square"
                  helperText="정사각형 이미지 권장"
                />
              </div>
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
                  className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-xs text-gray-700">추천 브랜드</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
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
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  취소
                </Button>
                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending ? '저장 중...' : '브랜드 추가'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { DatePicker } from '@/components/ui/date-picker';
import { Brand } from '@/types';
import { updateBrand, deleteBrand } from '../actions';
import { useRouter } from 'next/navigation';

interface BrandInfoTabProps {
  brand: Brand;
  productCount: number;
}

export default function BrandInfoTab({ brand, productCount }: BrandInfoTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [logoUrl, setLogoUrl] = useState(brand.logo || '');
  const [bannerUrl, setBannerUrl] = useState(brand.banner || '');
  const [validPeriodStart, setValidPeriodStart] = useState<Date | undefined>(
    brand.valid_period_start ? new Date(brand.valid_period_start) : undefined
  );
  const [validPeriodEnd, setValidPeriodEnd] = useState<Date | undefined>(
    brand.valid_period_end ? new Date(brand.valid_period_end) : undefined
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    formData.set('logo', logoUrl);
    formData.set('banner', bannerUrl);
    formData.set('valid_period_start', validPeriodStart?.toISOString() || '');
    formData.set('valid_period_end', validPeriodEnd?.toISOString() || '');

    startTransition(async () => {
      const result = await updateBrand(brand.id, formData);
      if (result.success) {
        router.refresh();
      }
    });
  };

  const handleDelete = async () => {
    if (productCount > 0) {
      alert(`${productCount}개의 상품이 있는 브랜드는 삭제할 수 없습니다. 먼저 상품을 삭제해주세요.`);
      return;
    }
    if (!confirm('이 브랜드를 삭제하시겠습니까?')) return;

    startTransition(async () => {
      const result = await deleteBrand(brand.id);
      if (result.success) {
        router.push('/brands');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        name="name"
        label="브랜드명"
        defaultValue={brand.name}
        required
        className="text-sm"
      />
      <Input
        name="eng_name"
        label="영문명"
        defaultValue={brand.eng_name || ''}
        helperText="브랜드 영문 이름 (선택사항)"
        className="text-sm"
      />
      <Input
        name="slug"
        label="슬러그"
        defaultValue={brand.slug}
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
          defaultValue={brand.description}
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
          className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          defaultChecked={brand.featured || false}
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
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={handleDelete}
          className="text-red-600 hover:text-red-800 text-xs font-medium"
          disabled={isPending}
        >
          브랜드 삭제
        </button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? '저장 중...' : '변경사항 저장'}
        </Button>
      </div>
    </form>
  );
}

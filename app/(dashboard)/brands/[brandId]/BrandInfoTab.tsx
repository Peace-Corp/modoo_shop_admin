'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { DatePicker } from '@/components/ui/date-picker';
import { Brand } from '@/types';
import { updateBrand, deleteBrand } from '../actions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface BrandInfoTabProps {
  brand: Brand;
  productCount: number;
}

export default function BrandInfoTab({ brand, productCount }: BrandInfoTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [logoUrl, setLogoUrl] = useState(brand.logo || '');
  const [bannerUrl, setBannerUrl] = useState(brand.banner || '');
  const [detailImageEntries, setDetailImageEntries] = useState<(string | string[])[]>(
    brand.order_detail_image ?? []
  );
  const [validPeriodStart, setValidPeriodStart] = useState<Date | undefined>(
    brand.valid_period_start ? new Date(brand.valid_period_start) : undefined
  );
  const [validPeriodEnd, setValidPeriodEnd] = useState<Date | undefined>(
    brand.valid_period_end ? new Date(brand.valid_period_end) : undefined
  );
  const [domesticEnabled, setDomesticEnabled] = useState(brand.delivery_domestic_enabled);
  const [domesticPrice, setDomesticPrice] = useState(brand.delivery_domestic_price);
  const [internationalEnabled, setInternationalEnabled] = useState(brand.delivery_international_enabled);
  const [internationalPrice, setInternationalPrice] = useState(brand.delivery_international_price);
  const [pickupEnabled, setPickupEnabled] = useState(brand.delivery_pickup_enabled);
  const [pickupPrice, setPickupPrice] = useState(brand.delivery_pickup_price);
  const [pickupAddress, setPickupAddress] = useState(brand.delivery_pickup_address || '');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    formData.set('logo', logoUrl);
    formData.set('banner', bannerUrl);
    formData.set('order_detail_image', JSON.stringify(detailImageEntries.filter(e =>
      Array.isArray(e) ? e.length > 0 : e !== ''
    )));
    formData.set('valid_period_start', validPeriodStart?.toISOString() || '');
    formData.set('valid_period_end', validPeriodEnd?.toISOString() || '');
    if (domesticEnabled) formData.set('delivery_domestic_enabled', 'on');
    formData.set('delivery_domestic_price', String(domesticPrice));
    if (internationalEnabled) formData.set('delivery_international_enabled', 'on');
    formData.set('delivery_international_price', String(internationalPrice));
    if (pickupEnabled) formData.set('delivery_pickup_enabled', 'on');
    formData.set('delivery_pickup_price', String(pickupPrice));
    formData.set('delivery_pickup_address', pickupAddress);

    startTransition(async () => {
      const result = await updateBrand(brand.id, formData);
      if (result.success) {
        router.refresh();
        toast.success('변경사항이 저장되었습니다.');
      } else {
        toast.error(result.error || '저장에 실패했습니다.');
      }
    });
  };

  const handleDelete = async () => {
    if (productCount > 0) {
      toast.error(`${productCount}개의 상품이 있는 브랜드는 삭제할 수 없습니다. 먼저 상품을 삭제해주세요.`);
      return;
    }
    if (!confirm('이 브랜드를 삭제하시겠습니까?')) return;

    startTransition(async () => {
      const result = await deleteBrand(brand.id);
      if (result.success) {
        toast.success('브랜드가 삭제되었습니다.');
        router.push('/brands');
      } else {
        toast.error(result.error || '삭제에 실패했습니다.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* 2-column grid for desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-3">
        {/* Left column: Text fields */}
        <div className="space-y-3">
          <Input
            name="name"
            label="브랜드명"
            defaultValue={brand.name}
            required
            className="text-xs"
          />
          <Input
            name="eng_name"
            label="영문명"
            defaultValue={brand.eng_name || ''}
            helperText="브랜드 영문 이름 (선택사항)"
            className="text-xs"
          />
          <Input
            name="slug"
            label="슬러그"
            defaultValue={brand.slug}
            helperText="URL에 사용될 이름 (예: my-brand)"
            required
            className="text-xs"
          />
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">설명</label>
            <textarea
              name="description"
              rows={2}
              className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              defaultValue={brand.description}
              required
            />
          </div>
        </div>

        {/* Right column: Images, color, featured, dates */}
        <div className="space-y-3">
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
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">브랜드 컬러</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                name="brand_color"
                defaultValue={brand.brand_color || '#ffffff'}
                className="w-9 h-9 rounded border border-gray-200 cursor-pointer p-0.5"
              />
              <span className="text-xs text-gray-500">페이지 배경색으로 사용됩니다</span>
            </div>
          </div>
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
        </div>
      </div>

      {/* Detail Images List */}
      <div className="max-w-lg">
        <label className="block text-xs font-medium text-gray-700 mb-1">상세 이미지</label>
        <p className="text-[10px] text-gray-400 mb-2">각 항목은 단일 이미지 또는 스와이퍼 그룹(여러 이미지)이 될 수 있습니다.</p>
        <div className="space-y-2">
          {detailImageEntries.map((entry, index) => {
            const isGroup = Array.isArray(entry);
            return (
              <div key={index} className="border border-gray-200 rounded-md p-2">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-500 font-medium">#{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...detailImageEntries];
                        updated[index] = isGroup ? (entry[0] || '') : [entry || ''];
                        setDetailImageEntries(updated);
                      }}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                    >
                      {isGroup ? '스와이퍼 그룹' : '단일 이미지'} ↔
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => {
                        const updated = [...detailImageEntries];
                        [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
                        setDetailImageEntries(updated);
                      }}
                      className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >↑</button>
                    <button
                      type="button"
                      disabled={index === detailImageEntries.length - 1}
                      onClick={() => {
                        const updated = [...detailImageEntries];
                        [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
                        setDetailImageEntries(updated);
                      }}
                      className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >↓</button>
                    <button
                      type="button"
                      onClick={() => setDetailImageEntries(detailImageEntries.filter((_, i) => i !== index))}
                      className="text-xs text-red-400 hover:text-red-600 ml-1"
                    >✕</button>
                  </div>
                </div>
                {isGroup ? (
                  <ImageUpload
                    value={entry}
                    onChange={(urls) => {
                      const updated = [...detailImageEntries];
                      updated[index] = Array.isArray(urls) ? urls : [urls];
                      setDetailImageEntries(updated);
                    }}
                    multiple
                    label=""
                    aspectRatio="video"
                  />
                ) : (
                  <ImageUpload
                    value={entry}
                    onChange={(url) => {
                      const updated = [...detailImageEntries];
                      updated[index] = url as string;
                      setDetailImageEntries(updated);
                    }}
                    label=""
                    aspectRatio="video"
                  />
                )}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setDetailImageEntries([...detailImageEntries, ''])}
          className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          + 이미지 항목 추가
        </button>
      </div>
      {/* Delivery Options */}
      <div className="pt-3 border-t border-gray-100">
        <label className="block text-xs font-medium text-gray-700 mb-2">배송 옵션</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Domestic */}
          <div className="border border-gray-200 rounded-md p-2.5">
            <div className="flex items-center gap-2 mb-1.5">
              <input
                type="checkbox"
                checked={domesticEnabled}
                onChange={(e) => setDomesticEnabled(e.target.checked)}
                className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-xs font-medium text-gray-700">국내배송</span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={domesticPrice}
                onChange={(e) => setDomesticPrice(parseInt(e.target.value) || 0)}
                disabled={!domesticEnabled}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black disabled:bg-gray-100 disabled:text-gray-400"
              />
              <span className="text-xs text-gray-500 shrink-0">원</span>
            </div>
          </div>
          {/* International */}
          <div className="border border-gray-200 rounded-md p-2.5">
            <div className="flex items-center gap-2 mb-1.5">
              <input
                type="checkbox"
                checked={internationalEnabled}
                onChange={(e) => setInternationalEnabled(e.target.checked)}
                className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-xs font-medium text-gray-700">해외배송</span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={internationalPrice}
                onChange={(e) => setInternationalPrice(parseInt(e.target.value) || 0)}
                disabled={!internationalEnabled}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black disabled:bg-gray-100 disabled:text-gray-400"
              />
              <span className="text-xs text-gray-500 shrink-0">원</span>
            </div>
          </div>
          {/* Pickup */}
          <div className="border border-gray-200 rounded-md p-2.5">
            <div className="flex items-center gap-2 mb-1.5">
              <input
                type="checkbox"
                checked={pickupEnabled}
                onChange={(e) => setPickupEnabled(e.target.checked)}
                className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-xs font-medium text-gray-700">현장수령</span>
            </div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <input
                type="number"
                value={pickupPrice}
                onChange={(e) => setPickupPrice(parseInt(e.target.value) || 0)}
                disabled={!pickupEnabled}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black disabled:bg-gray-100 disabled:text-gray-400"
              />
              <span className="text-xs text-gray-500 shrink-0">원</span>
            </div>
            {pickupEnabled && (
              <input
                type="text"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="수령 장소 주소"
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
            )}
          </div>
        </div>
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

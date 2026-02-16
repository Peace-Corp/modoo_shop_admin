'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Brand, Product, BrandHeroBanner } from '@/types';
import BrandProductsClient from './products/BrandProductsClient';
import BrandHeroBannersClient from './hero-banners/BrandHeroBannersClient';
import BrandInfoTab from './BrandInfoTab';

interface BrandDetailClientProps {
  brand: Brand;
  initialProducts: Product[];
  initialBanners: BrandHeroBanner[];
}

const TABS = [
  { id: 'products', label: '상품' },
  { id: 'banners', label: '배너' },
  { id: 'info', label: '정보' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function BrandDetailClient({ brand, initialProducts, initialBanners }: BrandDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>('products');

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
        <Link href="/brands" className="hover:text-blue-600 transition-colors">
          브랜드
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{brand.name}</span>
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
              <h1 className="text-sm md:text-base font-bold text-white">{brand.name}</h1>
              <p className="text-xs text-gray-200">
                {initialProducts.length}개 상품 · {initialBanners.length}개 배너
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-4">
        <div className="flex">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 text-xs font-medium text-center border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'products' && (
        <BrandProductsClient brand={brand} initialProducts={initialProducts} embedded />
      )}
      {activeTab === 'banners' && (
        <BrandHeroBannersClient brand={brand} initialBanners={initialBanners} embedded />
      )}
      {activeTab === 'info' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <BrandInfoTab brand={brand} productCount={initialProducts.length} />
        </div>
      )}
    </div>
  );
}

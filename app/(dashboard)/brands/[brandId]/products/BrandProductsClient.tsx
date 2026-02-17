'use client';

import { useState, useTransition, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Product, Brand, ProductVariant } from '@/types';
import { createProduct, updateProduct, deleteProduct, getProductVariants, createVariant, updateVariant, deleteVariant } from './actions';

interface BrandProductsClientProps {
  brand: Brand;
  initialProducts: Product[];
  embedded?: boolean;
}

export default function BrandProductsClient({ brand, initialProducts, embedded }: BrandProductsClientProps) {
  const [products, setProducts] = useState(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isPending, startTransition] = useTransition();
  const [productImages, setProductImages] = useState<string[]>([]);
  const [sizeChartImage, setSizeChartImage] = useState<string>('');
  const [descriptionImage, setDescriptionImage] = useState<string>('');

  // Tab state for modal
  const [activeTab, setActiveTab] = useState<'info' | 'variants'>('info');

  // Variant state
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [isAddingVariant, setIsAddingVariant] = useState(false);
  const [newVariantSize, setNewVariantSize] = useState('');
  const [newVariantStock, setNewVariantStock] = useState(0);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [editingStock, setEditingStock] = useState(0);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openEditModal = async (product: Product) => {
    setEditingProduct(product);
    setProductImages(product.images || []);
    setSizeChartImage(product.size_chart_image || '');
    setDescriptionImage(product.description_image || '');
    setActiveTab('info');
    setIsModalOpen(true);

    // Fetch variants for this product
    const result = await getProductVariants(product.id);
    if (result.success && result.data) {
      setVariants(result.data);
    } else {
      setVariants([]);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setProductImages([]);
    setSizeChartImage('');
    setDescriptionImage('');
    setVariants([]);
    setActiveTab('info');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setVariants([]);
    setIsAddingVariant(false);
    setNewVariantSize('');
    setNewVariantStock(0);
    setEditingVariantId(null);
  };

  // Variant handlers
  const handleAddVariant = async () => {
    if (!editingProduct || !newVariantSize.trim()) return;

    startTransition(async () => {
      const result = await createVariant(brand.id, editingProduct.id, newVariantSize.trim(), newVariantStock, variants.length);
      if (result.success && result.data) {
        const updatedVariants = [...variants, result.data];
        setVariants(updatedVariants);
        setNewVariantSize('');
        setNewVariantStock(0);
        setIsAddingVariant(false);
        // Update product stock display
        const totalStock = updatedVariants.reduce((sum, v) => sum + v.stock, 0);
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, stock: totalStock } : p));
        setEditingProduct({ ...editingProduct, stock: totalStock });
      }
    });
  };

  const handleUpdateVariantStock = async (variantId: string) => {
    if (!editingProduct) return;

    startTransition(async () => {
      const result = await updateVariant(brand.id, editingProduct.id, variantId, { stock: editingStock });
      if (result.success && result.data) {
        const updatedVariants = variants.map(v => v.id === variantId ? result.data! : v);
        setVariants(updatedVariants);
        setEditingVariantId(null);
        // Update product stock display
        const totalStock = updatedVariants.reduce((sum, v) => sum + v.stock, 0);
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, stock: totalStock } : p));
        setEditingProduct({ ...editingProduct, stock: totalStock });
      }
    });
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!editingProduct || !confirm('이 사이즈 옵션을 삭제하시겠습니까?')) return;

    startTransition(async () => {
      const result = await deleteVariant(brand.id, editingProduct.id, variantId);
      if (result.success) {
        const updatedVariants = variants.filter(v => v.id !== variantId);
        setVariants(updatedVariants);
        // Update product stock display
        const totalStock = updatedVariants.reduce((sum, v) => sum + v.stock, 0);
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, stock: totalStock } : p));
        setEditingProduct({ ...editingProduct, stock: totalStock });
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Add images from state
    formData.delete('images');
    productImages.forEach((url) => {
      formData.append('images', url);
    });

    // Add size chart and description images
    formData.set('size_chart_image', sizeChartImage);
    formData.set('description_image', descriptionImage);

    startTransition(async () => {
      if (editingProduct) {
        const result = await updateProduct(brand.id, editingProduct.id, formData);
        if (result.success && result.data) {
          setProducts(prev => prev.map(p => p.id === editingProduct.id ? result.data! : p));
          setEditingProduct(result.data);
        }
      } else {
        const result = await createProduct(brand.id, formData);
        if (result.success && result.data) {
          setProducts(prev => [result.data!, ...prev]);
          // Switch to edit mode for the new product to allow adding variants
          setEditingProduct(result.data);
          setActiveTab('variants');
        }
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 상품을 삭제하시겠습니까?')) return;

    startTransition(async () => {
      const result = await deleteProduct(brand.id, id);
      if (result.success) {
        setProducts(prev => prev.filter(p => p.id !== id));
      }
    });
  };

  return (
    <div>
      {!embedded && (
        <>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/brands" className="hover:text-blue-600">브랜드</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{brand.name}</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">상품</span>
          </nav>

          {/* Brand Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="relative h-24 md:h-32">
              {brand.banner && (
                <Image
                  src={brand.banner}
                  alt={brand.name}
                  fill
                  className="object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-4 flex items-center gap-3">
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
                  <h1 className="text-xl font-bold text-white">{brand.name} 상품</h1>
                  <p className="text-sm text-gray-200">{products.length}개 상품</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 flex-1 w-full sm:w-auto">
          <Input
            placeholder="상품 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-sm"
          />
        </div>
        <Button size="sm" onClick={openAddModal}>
          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          상품 추가
        </Button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 md:px-4 py-2.5 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">상품</th>
                <th className="px-3 md:px-4 py-2.5 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">카테고리</th>
                <th className="px-3 md:px-4 py-2.5 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">가격</th>
                <th className="px-3 md:px-4 py-2.5 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">재고</th>
                <th className="px-3 md:px-4 py-2.5 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">상태</th>
                <th className="px-3 md:px-4 py-2.5 text-right text-[11px] font-medium text-gray-500 uppercase tracking-wider">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-xs text-gray-500">
                    상품이 없습니다. 첫 번째 상품을 추가해보세요!
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-3 md:px-4 py-2.5 whitespace-nowrap">
                      <button onClick={() => openEditModal(product)} className="flex items-center group text-left w-full">
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg overflow-hidden bg-gray-100 mr-2.5 shrink-0">
                          {product.images[0] && (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-900 group-hover:text-blue-600 truncate">{product.name}</p>
                          <p className="text-[10px] text-gray-500 truncate sm:hidden">{product.category}</p>
                        </div>
                      </button>
                    </td>
                    <td className="px-3 md:px-4 py-2.5 whitespace-nowrap text-xs text-gray-600 hidden sm:table-cell">
                      {product.category}
                    </td>
                    <td className="px-3 md:px-4 py-2.5 whitespace-nowrap">
                      <div>
                        <p className="text-xs font-medium text-gray-900">₩{product.price.toLocaleString('ko-KR')}</p>
                        {product.original_price && (
                          <p className="text-[10px] text-gray-400 line-through">
                            ₩{product.original_price.toLocaleString('ko-KR')}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-3 md:px-4 py-2.5 whitespace-nowrap hidden md:table-cell">
                      <span className={`text-xs font-medium ${product.stock < 20 ? 'text-red-600' : 'text-gray-900'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-3 md:px-4 py-2.5 whitespace-nowrap hidden lg:table-cell">
                      <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${
                        product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {product.stock > 0 ? '재고 있음' : '품절'}
                      </span>
                    </td>
                    <td className="px-3 md:px-4 py-2.5 whitespace-nowrap text-right">
                      <button
                        onClick={() => openEditModal(product)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium mr-2.5"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                        disabled={isPending}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-3 md:px-4 py-2.5 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            {products.length}개 상품 중 {filteredProducts.length}개 표시
          </p>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">
                  {editingProduct ? '상품 수정' : '새 상품 추가'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tabs - only show when editing */}
              {editingProduct && (
                <div className="flex gap-3 mt-3 border-b border-gray-200">
                  <button
                    type="button"
                    onClick={() => setActiveTab('info')}
                    className={`pb-2 px-1 text-xs font-medium border-b-2 transition-colors ${
                      activeTab === 'info'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    상품 정보
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('variants')}
                    className={`pb-2 px-1 text-xs font-medium border-b-2 transition-colors ${
                      activeTab === 'variants'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    사이즈 옵션 ({variants.length})
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {/* Product Info Tab */}
              {(activeTab === 'info' || !editingProduct) && (
                <form onSubmit={handleSubmit} className="p-4 space-y-3">
                  <Input
                    name="name"
                    label="상품명"
                    defaultValue={editingProduct?.name}
                    required
                    className="text-sm"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      name="category"
                      label="카테고리"
                      defaultValue={editingProduct?.category}
                      required
                      className="text-sm"
                    />
                    <Input
                      name="stock"
                      label="기본 재고"
                      type="number"
                      defaultValue={editingProduct?.stock}
                      required
                      className="text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      name="price"
                      label="가격"
                      type="number"
                      defaultValue={editingProduct?.price}
                      required
                      className="text-sm"
                    />
                    <Input
                      name="original_price"
                      label="정가 (선택사항)"
                      type="number"
                      defaultValue={editingProduct?.original_price || ''}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">설명</label>
                    <textarea
                      name="description"
                      rows={2}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      defaultValue={editingProduct?.description}
                      required
                    />
                  </div>
                  <ImageUpload
                    value={productImages}
                    onChange={(urls) => setProductImages(urls as string[])}
                    multiple
                    label="상품 이미지"
                    aspectRatio="square"
                    maxFiles={5}
                    helperText="최대 5개 이미지 업로드. 드래그하여 순서 변경."
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <ImageUpload
                      value={sizeChartImage}
                      onChange={(url) => setSizeChartImage(url as string)}
                      label="사이즈 차트 이미지"
                      aspectRatio="square"
                      helperText="사이즈 측정 가이드 이미지"
                    />
                    <ImageUpload
                      value={descriptionImage}
                      onChange={(url) => setDescriptionImage(url as string)}
                      label="상품 상세 이미지"
                      aspectRatio="square"
                      helperText="상품 상세 설명 이미지"
                    />
                  </div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="featured"
                      className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      defaultChecked={editingProduct?.featured || false}
                    />
                    <span className="ml-2 text-xs text-gray-700">추천 상품</span>
                  </label>
                  <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                    <Button type="button" variant="outline" size="sm" onClick={closeModal}>
                      {editingProduct ? '닫기' : '취소'}
                    </Button>
                    <Button type="submit" size="sm" disabled={isPending}>
                      {isPending ? '저장 중...' : editingProduct ? '변경사항 저장' : '상품 추가'}
                    </Button>
                  </div>
                </form>
              )}

              {/* Size Variants Tab */}
              {activeTab === 'variants' && editingProduct && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-500">사이즈별 재고 관리</p>
                      {variants.length > 0 && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          총 재고: {variants.reduce((sum, v) => sum + v.stock, 0)}개
                        </p>
                      )}
                    </div>
                    {!isAddingVariant && (
                      <Button onClick={() => setIsAddingVariant(true)} size="sm">
                        사이즈 추가
                      </Button>
                    )}
                  </div>

                  {/* Add Variant Form */}
                  {isAddingVariant && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-700 mb-1">사이즈</label>
                          <input
                            type="text"
                            value={newVariantSize}
                            onChange={(e) => setNewVariantSize(e.target.value)}
                            placeholder="예: S, M, L, XL, 95, 100..."
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="w-full sm:w-28">
                          <label className="block text-xs font-medium text-gray-700 mb-1">재고</label>
                          <input
                            type="number"
                            value={newVariantStock}
                            onChange={(e) => setNewVariantStock(parseInt(e.target.value) || 0)}
                            min={0}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex gap-2 items-end">
                          <Button onClick={handleAddVariant} disabled={isPending || !newVariantSize.trim()} size="sm">
                            {isPending ? '추가 중...' : '추가'}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => {
                            setIsAddingVariant(false);
                            setNewVariantSize('');
                            setNewVariantStock(0);
                          }}>
                            취소
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Variants Table */}
                  {variants.length > 0 ? (
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">사이즈</th>
                            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">재고</th>
                            <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">관리</th>
                          </tr>
                        </thead>
                        <tbody>
                          {variants.map((variant) => (
                            <tr key={variant.id} className="border-t border-gray-100 hover:bg-gray-50">
                              <td className="py-2 px-3">
                                <span className="text-xs font-medium text-gray-900">{variant.size}</span>
                              </td>
                              <td className="py-2 px-3">
                                {editingVariantId === variant.id ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      value={editingStock}
                                      onChange={(e) => setEditingStock(parseInt(e.target.value) || 0)}
                                      min={0}
                                      className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => handleUpdateVariantStock(variant.id)}
                                      disabled={isPending}
                                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                    >
                                      저장
                                    </button>
                                    <button
                                      onClick={() => setEditingVariantId(null)}
                                      className="text-gray-500 hover:text-gray-700 text-xs"
                                    >
                                      취소
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setEditingVariantId(variant.id);
                                      setEditingStock(variant.stock);
                                    }}
                                    className={`text-xs font-medium hover:underline ${variant.stock < 10 ? 'text-red-600' : 'text-gray-900'}`}
                                  >
                                    {variant.stock}개
                                  </button>
                                )}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  onClick={() => handleDeleteVariant(variant.id)}
                                  disabled={isPending}
                                  className="text-red-600 hover:text-red-800 text-xs font-medium"
                                >
                                  삭제
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-50 border-t border-gray-200">
                            <td className="py-2 px-3 text-xs font-medium text-gray-700">합계</td>
                            <td className="py-2 px-3 text-xs font-bold text-gray-900">
                              {variants.reduce((sum, v) => sum + v.stock, 0)}개
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-gray-500 border border-gray-200 rounded-lg bg-gray-50">
                      <p>아직 사이즈 옵션이 없습니다.</p>
                      <p className="text-[10px] mt-1">사이즈를 추가하여 사이즈별 재고를 관리하세요.</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-3 mt-3 border-t border-gray-100">
                    <Button type="button" variant="outline" size="sm" onClick={closeModal}>
                      닫기
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

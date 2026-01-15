'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getProductCount = (brandId: string) => {
    return products.filter(p => p.brand_id === brandId).length;
  };

  const openEditModal = (brand: Brand) => {
    setEditingBrand(brand);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingBrand(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

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
      alert(`Cannot delete brand with ${productCount} products. Remove products first.`);
      return;
    }
    if (!confirm('Are you sure you want to delete this brand?')) return;

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
        <h1 className="text-2xl font-bold text-gray-900">Brands</h1>
        <Button onClick={openAddModal}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Brand
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <Input
          placeholder="Search brands..."
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
              {brand.featured && (
                <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                  Featured
                </div>
              )}
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 line-clamp-2 mb-4">{brand.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {getProductCount(brand.id)} products
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(brand)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(brand.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                    disabled={isPending}
                  >
                    Delete
                  </button>
                </div>
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
                {editingBrand ? 'Edit Brand' : 'Add New Brand'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Input
                name="id"
                label="Brand ID"
                defaultValue={editingBrand?.id}
                helperText="Unique identifier for the brand (e.g., nike, adidas)"
                required
                disabled={!!editingBrand}
              />
              <Input
                name="name"
                label="Brand Name"
                defaultValue={editingBrand?.name}
                required
              />
              <Input
                name="slug"
                label="Slug"
                defaultValue={editingBrand?.slug}
                helperText="URL-friendly name (e.g., my-brand)"
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue={editingBrand?.description}
                  required
                />
              </div>
              <Input
                name="logo"
                label="Logo URL"
                defaultValue={editingBrand?.logo}
                required
              />
              <Input
                name="banner"
                label="Banner URL"
                defaultValue={editingBrand?.banner}
                required
              />
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="featured"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  defaultChecked={editingBrand?.featured || false}
                />
                <span className="ml-2 text-sm text-gray-700">Featured Brand</span>
              </label>
              <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Saving...' : editingBrand ? 'Save Changes' : 'Add Brand'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Product, Brand } from '@/types';
import { createProduct, updateProduct, deleteProduct } from './actions';

interface BrandProductsClientProps {
  brand: Brand;
  initialProducts: Product[];
}

export default function BrandProductsClient({ brand, initialProducts }: BrandProductsClientProps) {
  const [products, setProducts] = useState(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isPending, startTransition] = useTransition();
  const [productImages, setProductImages] = useState<string[]>([]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setProductImages(product.images || []);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setProductImages([]);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Add images from state
    formData.delete('images');
    productImages.forEach((url) => {
      formData.append('images', url);
    });

    startTransition(async () => {
      if (editingProduct) {
        const result = await updateProduct(brand.id, editingProduct.id, formData);
        if (result.success && result.data) {
          setProducts(prev => prev.map(p => p.id === editingProduct.id ? result.data! : p));
        }
      } else {
        const result = await createProduct(brand.id, formData);
        if (result.success && result.data) {
          setProducts(prev => [result.data!, ...prev]);
        }
      }
      setIsModalOpen(false);
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    startTransition(async () => {
      const result = await deleteProduct(brand.id, id);
      if (result.success) {
        setProducts(prev => prev.filter(p => p.id !== id));
      }
    });
  };

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/brands" className="hover:text-blue-600">Brands</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{brand.name}</span>
        <span>/</span>
        <span className="text-gray-900 font-medium">Products</span>
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
              <h1 className="text-xl font-bold text-white">{brand.name} Products</h1>
              <p className="text-sm text-gray-200">{products.length} products</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex-1 w-full sm:w-auto">
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={openAddModal}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </Button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 md:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-4 md:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Category</th>
                <th className="px-4 md:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-4 md:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Stock</th>
                <th className="px-4 md:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Status</th>
                <th className="px-4 md:px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No products found. Add your first product!
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <Link href={`/brands/${brand.id}/products/${product.id}`} className="flex items-center group">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden bg-gray-100 mr-3 md:mr-4 flex-shrink-0">
                          {product.images[0] && (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 group-hover:text-blue-600 truncate">{product.name}</p>
                          <p className="text-xs text-gray-500 truncate sm:hidden">{product.category}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-gray-600 hidden sm:table-cell">
                      {product.category}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-gray-900">${product.price.toLocaleString()}</p>
                        {product.original_price && (
                          <p className="text-xs text-gray-400 line-through">
                            ${product.original_price.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <span className={`font-medium ${product.stock < 20 ? 'text-red-600' : 'text-gray-900'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => openEditModal(product)}
                        className="text-blue-600 hover:text-blue-800 font-medium mr-3 md:mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                        disabled={isPending}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 md:px-6 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Showing {filteredProducts.length} of {products.length} products
          </p>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Input
                name="name"
                label="Product Name"
                defaultValue={editingProduct?.name}
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  name="category"
                  label="Category"
                  defaultValue={editingProduct?.category}
                  required
                />
                <Input
                  name="stock"
                  label="Stock"
                  type="number"
                  defaultValue={editingProduct?.stock}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  name="price"
                  label="Price"
                  type="number"
                  defaultValue={editingProduct?.price}
                  required
                />
                <Input
                  name="original_price"
                  label="Original Price (optional)"
                  type="number"
                  defaultValue={editingProduct?.original_price || ''}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue={editingProduct?.description}
                  required
                />
              </div>
              <ImageUpload
                value={productImages}
                onChange={(urls) => setProductImages(urls as string[])}
                multiple
                label="Product Images"
                aspectRatio="square"
                maxFiles={5}
                helperText="Upload up to 5 images. Drag to reorder."
              />
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="featured"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  defaultChecked={editingProduct?.featured || false}
                />
                <span className="ml-2 text-sm text-gray-700">Featured Product</span>
              </label>
              <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Saving...' : editingProduct ? 'Save Changes' : 'Add Product'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

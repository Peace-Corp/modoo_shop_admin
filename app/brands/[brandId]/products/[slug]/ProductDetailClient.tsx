'use client';

import { useState, useTransition, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Product, Brand, ProductVariant } from '@/types';
import { updateProduct, deleteProduct, getProductVariants, createVariant, updateVariant, deleteVariant } from '../actions';

interface ProductDetailClientProps {
  brand: Brand;
  initialProduct: Product;
}

export default function ProductDetailClient({ brand, initialProduct }: ProductDetailClientProps) {
  const router = useRouter();
  const [product, setProduct] = useState(initialProduct);
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [productImages, setProductImages] = useState<string[]>(initialProduct.images || []);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Variant state
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [isAddingVariant, setIsAddingVariant] = useState(false);
  const [newVariantSize, setNewVariantSize] = useState('');
  const [newVariantStock, setNewVariantStock] = useState(0);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [editingStock, setEditingStock] = useState(0);

  // Fetch variants on mount
  useEffect(() => {
    const fetchVariants = async () => {
      const result = await getProductVariants(product.id);
      if (result.success && result.data) {
        setVariants(result.data);
      }
    };
    fetchVariants();
  }, [product.id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Add images from state
    formData.delete('images');
    productImages.forEach((url) => {
      formData.append('images', url);
    });

    startTransition(async () => {
      const result = await updateProduct(brand.id, product.id, formData);
      if (result.success && result.data) {
        setProduct(result.data);
        setProductImages(result.data.images || []);
        setIsEditing(false);
      }
    });
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;

    startTransition(async () => {
      const result = await deleteProduct(brand.id, product.id);
      if (result.success) {
        router.push(`/brands/${brand.id}/products`);
      }
    });
  };

  // Variant handlers
  const handleAddVariant = async () => {
    if (!newVariantSize.trim()) return;

    startTransition(async () => {
      const result = await createVariant(brand.id, product.id, newVariantSize.trim(), newVariantStock, variants.length);
      if (result.success && result.data) {
        setVariants([...variants, result.data]);
        setNewVariantSize('');
        setNewVariantStock(0);
        setIsAddingVariant(false);
        // Update product stock display (trigger refresh)
        const totalStock = [...variants, result.data].reduce((sum, v) => sum + v.stock, 0);
        setProduct({ ...product, stock: totalStock });
      }
    });
  };

  const handleUpdateVariantStock = async (variantId: string) => {
    startTransition(async () => {
      const result = await updateVariant(brand.id, product.id, variantId, { stock: editingStock });
      if (result.success && result.data) {
        setVariants(variants.map(v => v.id === variantId ? result.data! : v));
        setEditingVariantId(null);
        // Update product stock display
        const totalStock = variants.map(v => v.id === variantId ? result.data! : v).reduce((sum, v) => sum + v.stock, 0);
        setProduct({ ...product, stock: totalStock });
      }
    });
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('Are you sure you want to delete this size variant?')) return;

    startTransition(async () => {
      const result = await deleteVariant(brand.id, product.id, variantId);
      if (result.success) {
        const updatedVariants = variants.filter(v => v.id !== variantId);
        setVariants(updatedVariants);
        // Update product stock display
        const totalStock = updatedVariants.reduce((sum, v) => sum + v.stock, 0);
        setProduct({ ...product, stock: totalStock });
      }
    });
  };

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4 flex-wrap">
        <Link href="/brands" className="hover:text-blue-600">Brands</Link>
        <span>/</span>
        <Link href={`/brands/${brand.id}/products`} className="hover:text-blue-600">{brand.name}</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate">{product.name}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Product Images */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="aspect-square relative">
              {product.images[selectedImageIndex] ? (
                <Image
                  src={product.images[selectedImageIndex]}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                  No Image
                </div>
              )}
            </div>
            {/* Image Thumbnails */}
            {product.images.length > 1 && (
              <div className="p-3 border-t border-gray-100">
                <div className="flex gap-2 overflow-x-auto">
                  {product.images.map((img, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${
                        selectedImageIndex === index
                          ? 'border-blue-500'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="p-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
                {product.featured && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                    Featured
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Product Details / Edit Form */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">{product.name}</h1>
              <div className="flex gap-2">
                {!isEditing && (
                  <>
                    <Button variant="outline" onClick={() => {
                      setProductImages(product.images || []);
                      setIsEditing(true);
                    }}>
                      Edit
                    </Button>
                    <Button variant="outline" onClick={handleDelete} disabled={isPending}>
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
                <Input
                  name="name"
                  label="Product Name"
                  defaultValue={product.name}
                  required
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    name="category"
                    label="Category"
                    defaultValue={product.category}
                    required
                  />
                  <Input
                    name="stock"
                    label="Stock"
                    type="number"
                    defaultValue={product.stock}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    name="price"
                    label="Price"
                    type="number"
                    defaultValue={product.price}
                    required
                  />
                  <Input
                    name="original_price"
                    label="Original Price (optional)"
                    type="number"
                    defaultValue={product.original_price || ''}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={product.description}
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
                    defaultChecked={product.featured || false}
                  />
                  <span className="ml-2 text-sm text-gray-700">Featured Product</span>
                </label>
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="p-4 md:p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Price</h3>
                    <p className="text-2xl font-bold text-gray-900">${product.price.toLocaleString()}</p>
                    {product.original_price && (
                      <p className="text-sm text-gray-400 line-through">
                        ${product.original_price.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Stock</h3>
                    <p className={`text-2xl font-bold ${product.stock < 20 ? 'text-red-600' : 'text-gray-900'}`}>
                      {product.stock} units
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Category</h3>
                  <p className="text-gray-900">{product.category}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 pt-4 border-t border-gray-100">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Product ID</h3>
                    <p className="text-xs text-gray-600 font-mono break-all">{product.id}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Created</h3>
                    <p className="text-gray-600">
                      {product.created_at ? new Date(product.created_at).toLocaleDateString() : '-'}
                    </p>
                  </div>
                </div>

                {product.rating && (
                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Rating</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500">{'★'.repeat(Math.round(product.rating))}</span>
                      <span className="text-gray-600">
                        {product.rating.toFixed(1)} ({product.review_count || 0} reviews)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Size Variants Section */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Size Variants</h2>
            <p className="text-sm text-gray-500">Manage inventory for each size option</p>
          </div>
          {!isAddingVariant && (
            <Button onClick={() => setIsAddingVariant(true)}>
              Add Size
            </Button>
          )}
        </div>

        <div className="p-4 md:p-6">
          {/* Add Variant Form */}
          {isAddingVariant && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                  <input
                    type="text"
                    value={newVariantSize}
                    onChange={(e) => setNewVariantSize(e.target.value)}
                    placeholder="e.g., S, M, L, XL, 95, 100..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="w-full sm:w-32">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input
                    type="number"
                    value={newVariantStock}
                    onChange={(e) => setNewVariantStock(parseInt(e.target.value) || 0)}
                    min={0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2 items-end">
                  <Button onClick={handleAddVariant} disabled={isPending || !newVariantSize.trim()}>
                    {isPending ? 'Adding...' : 'Add'}
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setIsAddingVariant(false);
                    setNewVariantSize('');
                    setNewVariantStock(0);
                  }}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Variants Table */}
          {variants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Size</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Stock</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((variant) => (
                    <tr key={variant.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">{variant.size}</span>
                      </td>
                      <td className="py-3 px-4">
                        {editingVariantId === variant.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={editingStock}
                              onChange={(e) => setEditingStock(parseInt(e.target.value) || 0)}
                              min={0}
                              className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <button
                              onClick={() => handleUpdateVariantStock(variant.id)}
                              disabled={isPending}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingVariantId(null)}
                              className="text-gray-500 hover:text-gray-700 text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingVariantId(variant.id);
                              setEditingStock(variant.stock);
                            }}
                            className={`font-medium hover:underline ${variant.stock < 10 ? 'text-red-600' : 'text-gray-900'}`}
                          >
                            {variant.stock} units
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteVariant(variant.id)}
                          disabled={isPending}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-700">Total</td>
                    <td className="py-3 px-4 font-bold text-gray-900">
                      {variants.reduce((sum, v) => sum + v.stock, 0)} units
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No size variants added yet.</p>
              <p className="text-sm mt-1">Add sizes to enable per-size inventory tracking.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

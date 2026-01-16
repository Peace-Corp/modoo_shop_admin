'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

interface ImageUploadProps {
  value?: string | string[];
  onChange: (urls: string | string[]) => void;
  multiple?: boolean;
  label?: string;
  helperText?: string;
  aspectRatio?: 'square' | 'video' | 'banner';
  maxFiles?: number;
  disabled?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  multiple = false,
  label,
  helperText,
  aspectRatio = 'square',
  maxFiles = 5,
  disabled = false,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const images = multiple
    ? (Array.isArray(value) ? value : value ? [value] : [])
    : (value ? [value as string] : []);

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    banner: 'aspect-[3/1]',
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      return data.url;
    } catch (err) {
      console.error('Upload error:', err);
      throw err;
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    if (disabled) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const filesToUpload = multiple
      ? validFiles.slice(0, maxFiles - images.length)
      : [validFiles[0]];

    if (filesToUpload.length === 0) {
      setError(`Maximum ${maxFiles} images allowed`);
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const uploadPromises = filesToUpload.map(uploadFile);
      const urls = await Promise.all(uploadPromises);
      const validUrls = urls.filter((url): url is string => url !== null);

      if (multiple) {
        onChange([...images, ...validUrls]);
      } else {
        onChange(validUrls[0] || '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [images, multiple, maxFiles, disabled]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeImage = (index: number) => {
    if (disabled) return;
    const newImages = images.filter((_, i) => i !== index);
    onChange(multiple ? newImages : newImages[0] || '');
  };

  // Reorder functions for drag-and-drop
  const handleImageDragStart = (e: React.DragEvent, index: number) => {
    if (disabled || !multiple) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleImageDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleImageDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newImages = [...images];
    const [draggedImage] = newImages.splice(draggedIndex, 1);
    newImages.splice(targetIndex, 0, draggedImage);

    onChange(newImages);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleImageDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const canAddMore = multiple ? images.length < maxFiles : images.length === 0;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className={`grid gap-3 mb-3 ${multiple ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid-cols-1'}`}>
          {images.map((url, index) => (
            <div
              key={`${url}-${index}`}
              draggable={multiple && !disabled}
              onDragStart={(e) => handleImageDragStart(e, index)}
              onDragOver={(e) => handleImageDragOver(e, index)}
              onDragLeave={handleImageDragLeave}
              onDrop={(e) => handleImageDrop(e, index)}
              onDragEnd={handleImageDragEnd}
              className={`
                relative group rounded-lg overflow-hidden border bg-gray-50 ${aspectClasses[aspectRatio]}
                ${multiple && !disabled ? 'cursor-grab active:cursor-grabbing' : ''}
                ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
                ${dragOverIndex === index ? 'border-blue-500 border-2 ring-2 ring-blue-200' : 'border-gray-200'}
                transition-all duration-150
              `}
            >
              <Image
                src={url}
                alt={`Preview ${index + 1}`}
                fill
                className="object-cover pointer-events-none"
              />
              {/* Position indicator for multiple images */}
              {multiple && images.length > 1 && (
                <div className="absolute top-2 left-2 w-6 h-6 bg-black/60 text-white text-xs font-medium rounded-full flex items-center justify-center">
                  {index + 1}
                </div>
              )}
              {/* Drag handle indicator */}
              {multiple && !disabled && images.length > 1 && (
                <div className="absolute bottom-2 left-2 p-1 bg-black/60 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                </div>
              )}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Zone */}
      {canAddMore && (
        <div
          onClick={() => !disabled && !isUploading && inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg transition-all cursor-pointer
            ${aspectClasses[aspectRatio]}
            ${isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${isUploading ? 'pointer-events-none' : ''}
          `}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            {isUploading ? (
              <>
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-sm text-gray-600">Uploading...</p>
              </>
            ) : (
              <>
                <svg
                  className={`w-10 h-10 mb-2 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm text-gray-600 text-center">
                  <span className="text-blue-600 font-medium">Click to upload</span>
                  {' '}or drag and drop
                </p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP up to 5MB</p>
              </>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple={multiple}
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled || isUploading}
          />
        </div>
      )}

      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-500">{helperText}</p>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

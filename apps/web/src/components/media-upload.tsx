'use client';

import { useState, useRef } from 'react';
import { Image as ImageIcon, FileText, X, Upload, Loader2 } from 'lucide-react';

export interface MediaFile {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
}

interface MediaUploadProps {
  mediaFiles: MediaFile[];
  onMediaAdd: (file: MediaFile) => void;
  onMediaRemove: (id: string) => void;
  maxImages?: number;
  disabled?: boolean;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PDF_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_PDF_TYPES = ['application/pdf'];

export function MediaUpload({
  mediaFiles,
  onMediaAdd,
  onMediaRemove,
  maxImages = 9,
  disabled = false,
}: MediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const imageCount = mediaFiles.filter((f) => ALLOWED_IMAGE_TYPES.includes(f.mimeType)).length;
  const hasPdf = mediaFiles.some((f) => ALLOWED_PDF_TYPES.includes(f.mimeType));

  const canUploadImage = imageCount < maxImages && !hasPdf;
  const canUploadPdf = !hasPdf && imageCount === 0;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileUpload = async (file: File) => {
    setUploadError(null);
    setIsUploading(true);

    try {
      const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
      const isPdf = ALLOWED_PDF_TYPES.includes(file.type);

      if (!isImage && !isPdf) {
        throw new Error('Invalid file type. Only images and PDFs are allowed.');
      }

      const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_PDF_SIZE;
      if (file.size > maxSize) {
        const maxSizeMB = maxSize / (1024 * 1024);
        throw new Error(`File too large. Maximum size is ${maxSizeMB}MB.`);
      }

      if (isImage && !canUploadImage) {
        throw new Error(hasPdf ? 'Cannot add images when PDF is attached.' : `Maximum ${maxImages} images allowed.`);
      }

      if (isPdf && !canUploadPdf) {
        throw new Error(imageCount > 0 ? 'Cannot add PDF when images are attached.' : 'Only one PDF allowed per post.');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      onMediaAdd({
        id: data.id,
        url: data.url,
        filename: data.filename,
        mimeType: data.mimeType,
        size: data.size,
      });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
    e.target.value = '';
  };

  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
    e.target.value = '';
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/media/upload?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onMediaRemove(id);
      }
    } catch (error) {
      console.error('Failed to delete media:', error);
    }
  };

  return (
    <div className="space-y-3">
      {/* Upload Buttons */}
      <div className="flex items-center gap-2">
        {/* Image Upload Button */}
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          disabled={disabled || isUploading || !canUploadImage}
          className={`flex items-center gap-2 font-retro text-base border-2 border-[#f4f4f4] px-3 py-2 transition-all ${
            canUploadImage && !disabled && !isUploading
              ? 'bg-[#3a4466] hover:bg-[#4a5476] text-[#f4f4f4] hover:translate-x-[1px] hover:translate-y-[1px]'
              : 'bg-[#2a2f44] text-[#5a6080] cursor-not-allowed border-[#5a6080]'
          }`}
          style={canUploadImage && !disabled && !isUploading ? { boxShadow: '2px 2px 0 #0a0a0f' } : {}}
          title={!canUploadImage ? (hasPdf ? 'Remove PDF to add images' : 'Max images reached') : 'Add image'}
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
          <span className="hidden sm:inline">Image</span>
        </button>

        {/* PDF Upload Button */}
        <button
          type="button"
          onClick={() => pdfInputRef.current?.click()}
          disabled={disabled || isUploading || !canUploadPdf}
          className={`flex items-center gap-2 font-retro text-base border-2 border-[#f4f4f4] px-3 py-2 transition-all ${
            canUploadPdf && !disabled && !isUploading
              ? 'bg-[#3a4466] hover:bg-[#4a5476] text-[#f4f4f4] hover:translate-x-[1px] hover:translate-y-[1px]'
              : 'bg-[#2a2f44] text-[#5a6080] cursor-not-allowed border-[#5a6080]'
          }`}
          style={canUploadPdf && !disabled && !isUploading ? { boxShadow: '2px 2px 0 #0a0a0f' } : {}}
          title={!canUploadPdf ? (imageCount > 0 ? 'Remove images to add PDF' : 'Only one PDF allowed') : 'Add PDF'}
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          <span className="hidden sm:inline">PDF</span>
        </button>

        {/* Hidden file inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          onChange={handleImageSelect}
          className="hidden"
        />
        <input
          ref={pdfInputRef}
          type="file"
          accept={ALLOWED_PDF_TYPES.join(',')}
          onChange={handlePdfSelect}
          className="hidden"
        />
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="p-2 bg-[#4a2a2a] border-2 border-[#ff6b6b] font-retro text-xs text-[#ff6b6b]">
          {uploadError}
        </div>
      )}

      {/* Media Preview Grid */}
      {mediaFiles.length > 0 && (
        <div className="border-2 border-[#3a4466] bg-[#1a1f35] p-3">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="w-4 h-4 text-[#8bd450]" />
            <span className="font-retro text-sm text-[#a0a8c0]">
              Attached Media ({mediaFiles.length})
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {mediaFiles.map((file) => (
              <div
                key={file.id}
                className="relative group border-2 border-[#3a4466] bg-[#262b44] overflow-hidden"
              >
                {ALLOWED_IMAGE_TYPES.includes(file.mimeType) ? (
                  <div className="aspect-square">
                    <img
                      src={file.url}
                      alt={file.filename}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-square flex flex-col items-center justify-center p-2">
                    <FileText className="w-8 h-8 text-[#8bd450] mb-1" />
                    <span className="font-retro text-xs text-[#f4f4f4] text-center truncate w-full px-1">
                      {file.filename}
                    </span>
                    <span className="font-retro text-xs text-[#5a6080]">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                )}

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDelete(file.id)}
                  className="absolute top-1 right-1 p-1 bg-[#ff6b6b] text-[#0a0a0f] opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Hints */}
      {mediaFiles.length === 0 && (
        <div className="font-retro text-xs text-[#5a6080]">
          Images: max 5MB each, up to {maxImages} • PDF: max 100MB, 1 per post
        </div>
      )}
    </div>
  );
}

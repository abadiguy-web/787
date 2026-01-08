import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { cn } from "@/lib/utils";

export default function ImageUploadField({ label, imageUrl, onImageChange }) {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onImageChange(file_url);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onImageChange('');
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      
      {imageUrl ? (
        <div className="relative border-2 border-slate-200 rounded-lg overflow-hidden">
          <img
            src={imageUrl}
            alt={label}
            className="w-full max-h-48 object-contain bg-slate-50"
          />
          <Button
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <ImageIcon className="w-8 h-8 text-slate-400" />
            <p className="text-sm text-slate-500">No image attached</p>
            <label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
              />
              <Button asChild disabled={uploading}>
                <span>
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </>
                  )}
                </span>
              </Button>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
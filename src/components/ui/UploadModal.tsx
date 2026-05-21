'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, UploadCloud, File as FileIcon, CheckCircle, AlertCircle } from 'lucide-react';

import { Input } from '@/components/forms/Input';
import { Button } from '@/components/forms/Button';
import { validateFileUpload } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

const uploadSchema = z.object({
  title: z.string().min(3, 'A descriptive label is required'),
});

type UploadForm = z.infer<typeof uploadSchema>;

interface UploadModalProps {
  isOpen: boolean;
  uploadType: 'document' | 'asset';
  onClose: () => void;
  onSuccess: () => void; 
  ipId?: string;
}

export function UploadModal({ isOpen, uploadType, onClose, onSuccess, ipId }: UploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema),
  });

  if (!isOpen) return null;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = event.target.files?.[0];
    if (!file) return;

    const { isValid, error } = validateFileUpload(file, 50); 
    if (!isValid) {
      setFileError(error || 'Invalid file');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const onSubmit = async (data: UploadForm) => {
    if (!selectedFile || !ipId) {
      setFileError('Please select a document and ensure an IP is selected.');
      return;
    }

    setIsUploading(true);
    setFileError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");

      const fileExt = selectedFile.name.split('.').pop() || 'unknown';
      
      const safeFileName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${ipId}/${Date.now()}_${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vault-assets')
        .upload(filePath, selectedFile);

      if (uploadError) {
        console.error("Storage Error:", uploadError);
        throw new Error(`Storage Error: ${uploadError.message}`);
      }

      if (uploadType === 'document') {
        const { error: dbError } = await supabase
          .from('ip_documents')
          .insert({
            ip_id: ipId,
            file_name: selectedFile.name,
            file_url: filePath,
            file_type: fileExt,
            file_size_bytes: selectedFile.size,
            uploaded_by: user.id
          });
        if (dbError) throw new Error(`Database Error: ${dbError.message}`);
      } 
      else if (uploadType === 'asset') {
        const { error: dbError } = await supabase
          .from('ip_assets')
          .insert({
            ip_id: ipId,
            title: data.title,              
            file_name: selectedFile.name,   
            file_url: filePath,             
            price: null,                    
            uploaded_by: user.id            
          });
        if (dbError) throw new Error(`Database Error: ${dbError.message}`);
      }

      reset();
      setSelectedFile(null);
      onSuccess();
      onClose();   

    } catch (error) {
      if (error instanceof Error) {
        setFileError(error.message);
      } else {
        setFileError('An unexpected error occurred during upload.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const isDocument = uploadType === 'document';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-lg rounded-lg border border-border bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            {isDocument ? 'Upload Internal Document' : 'Upload Commercial Asset'}
          </h2>
          <button onClick={onClose} className="text-foreground opacity-50 transition-colors hover:text-foreground hover:opacity-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
          
          <Input 
            label={isDocument ? "Document Label" : "Asset Title"} 
            placeholder={isDocument ? "e.g., Initial Patent Filing" : "e.g., Source Code Zip"} 
            error={errors.title?.message}
            {...register('title')}
          />

          <div>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
            
            {!selectedFile ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-background py-10 transition-colors hover:border-primary hover:bg-primary/5"
              >
                <UploadCloud className="mb-3 h-10 w-10 text-primary" />
                <p className="text-sm font-medium text-foreground">Click to browse or drag and drop</p>
                <p className="mt-1 text-xs text-foreground opacity-50">
                  {isDocument ? "PDF, DOCX, JPEG (Max 50MB)" : "ZIP, PNG, MP4 (Max 50MB)"}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded border border-green-200 bg-green-50 px-4 py-3 text-green-900">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <FileIcon className="h-6 w-6 flex-shrink-0 text-green-600" />
                  <span className="truncate text-sm font-medium">{selectedFile.name}</span>
                </div>
                <button type="button" onClick={() => setSelectedFile(null)} className="ml-4 text-sm font-bold text-red-600 hover:underline">
                  Remove
                </button>
              </div>
            )}
            
            {fileError && (
              <div className="mt-2 flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4"/> {fileError}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 border-t border-border pt-4">
            <Button variant="ghost" type="button" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isUploading}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Confirm Upload
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
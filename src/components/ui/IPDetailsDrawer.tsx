'use client';

import { useState, useEffect } from 'react';
import { X, FileText, Package, CheckCircle, ShieldAlert, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/forms/Button';
import { formatAuditDate } from '@/lib/formatters';
import { UploadModal } from './UploadModal';
import type { IntellectualProperty, IPDocument, IPAsset } from '@/types/database';
import { supabase } from '@/lib/supabase';

interface IPDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: () => void;
  ip: IntellectualProperty | null;
}

export function IPDetailsDrawer({ isOpen, onClose, onStatusChange, ip }: IPDetailsDrawerProps) {
  const [uploadTarget, setUploadTarget] = useState<'document' | 'asset' | null>(null);
  
  const [documents, setDocuments] = useState<IPDocument[]>([]);
  const [assets, setAssets] = useState<IPAsset[]>([]);
  
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!ip?.id || !isOpen) return;

    const fetchFiles = async () => {
      setIsLoadingFiles(true);

      const [docsResponse, assetsResponse] = await Promise.all([
        supabase
          .from('ip_documents')
          .select('*')
          .eq('ip_id', ip.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('ip_assets')
          .select('*')
          .eq('ip_id', ip.id)
          .order('created_at', { ascending: false })
      ]);

      if (docsResponse.data) setDocuments(docsResponse.data as IPDocument[]);
      if (assetsResponse.data) setAssets(assetsResponse.data as IPAsset[]);

      setIsLoadingFiles(false);
    };

    fetchFiles();
  }, [ip?.id, isOpen, refreshTrigger]);

  const handleView = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('vault-assets')
        .createSignedUrl(filePath, 60);

      if (error) throw error;

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error accessing file:', error);
      alert('Failed to access file. Please try again.');
    }
  };

  const handleStatusUpdate = async (newStatus: 'approved' | 'rejected') => {
    if (!ip) return;
    
    setIsUpdatingStatus(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");

      const timestamp = new Date().toISOString();

      const { error } = await supabase
        .from('intellectual_properties')
        .update({
          status: newStatus,
          reviewed_by: user.id,
          reviewed_at: timestamp
        })
        .eq('id', ip.id);

      if (error) throw error;

      if (onStatusChange) onStatusChange();
      onClose();

    } catch (error: any) {
      console.error('Error updating status:', error);
      alert(`Failed to update status: ${error.message}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (!ip) return null;

  const creatorName = Array.isArray(ip.creator) ? ip.creator[0]?.display_name : ip.creator?.display_name;

  return (
    <>
      <div 
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      <div 
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-2xl transform border-l border-border bg-surface shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-xl font-semibold text-foreground">Project Details</h2>
            <button 
              onClick={onClose}
              className="rounded-full p-2 text-foreground opacity-50 transition-colors hover:bg-background hover:opacity-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            
            <div className="mb-8 rounded-lg border border-border bg-background p-5">
              <h3 className="text-lg font-bold text-foreground">{ip.title}</h3>
              <p className="mt-2 text-sm text-foreground opacity-70">
                {ip.description || "No description provided for this project."}
              </p>
              <div className="mt-4 flex items-center gap-4 text-xs text-foreground opacity-50">
                <span>Created: {formatAuditDate(ip.created_at)}</span>
                <span>•</span>
                <span>By: {creatorName || ip.creator_id.substring(0, 8)}</span>
              </div>
            </div>

            <div className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-amber-500" />
                  <h4 className="font-semibold text-foreground">Internal Documentation</h4>
                </div>
                <Button 
                  variant="outline" 
                  className="px-3 py-1.5 text-xs"
                  onClick={() => setUploadTarget('document')}
                >
                  Upload Doc
                </Button>
              </div>
              
              {isLoadingFiles ? (
                <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : documents.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-background/50 p-6 text-center">
                  <FileText className="mx-auto mb-2 h-6 w-6 text-foreground opacity-30" />
                  <p className="text-sm text-foreground opacity-70">No legal documents attached yet.</p>
                  <p className="text-xs text-foreground opacity-50">These files remain hidden from the marketplace.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-3 transition-colors hover:border-primary/50">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="h-8 w-8 flex-shrink-0 text-amber-500 opacity-80" />
                        <div className="overflow-hidden">
                          <p className="truncate text-sm font-medium text-foreground">{doc.file_name}</p>
                          <p className="text-xs text-foreground opacity-50">
                            {(doc.file_size_bytes / 1024).toFixed(1)} KB • {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        className="h-8 px-2 text-xs" 
                        onClick={() => handleView(doc.file_url)}
                      >
                        <Eye className="mr-1 h-3 w-3" /> View
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold text-foreground">Commercial Assets</h4>
                </div>
                <Button 
                  variant="outline" 
                  className="px-3 py-1.5 text-xs"
                  onClick={() => setUploadTarget('asset')}
                >
                  Upload Asset
                </Button>
              </div>

              {isLoadingFiles ? (
                <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : assets.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-background/50 p-6 text-center">
                  <Package className="mx-auto mb-2 h-6 w-6 text-foreground opacity-30" />
                  <p className="text-sm text-foreground opacity-70">No commercial assets attached yet.</p>
                  <p className="text-xs text-foreground opacity-50">These are the deliverables sold to the buyer.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assets.map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-3 transition-colors hover:border-primary/50">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Package className="h-8 w-8 flex-shrink-0 text-primary opacity-80" />
                        <div className="overflow-hidden">
                          <p className="truncate text-sm font-medium text-foreground">{asset.title}</p>
                          <p className="text-xs text-foreground opacity-50">
                            {asset.file_name} • {new Date(asset.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        className="h-8 px-2 text-xs" 
                        onClick={() => handleView(asset.file_url)}
                      >
                        <Eye className="mr-1 h-3 w-3" /> View
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          <div className="border-t border-border bg-background px-6 py-4">
            <div className="flex items-center justify-between">
              
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground opacity-70">
                  Current Status: 
                  <span className={`ml-2 uppercase font-bold ${
                    ip.status === 'approved' ? 'text-green-600' : 
                    ip.status === 'rejected' ? 'text-red-600' : 
                    'text-primary'
                  }`}>
                    {ip.status.replace('_', ' ')}
                  </span>
                </span>
                
                {ip.reviewed_by && ip.reviewed_at && (
                  <span className="mt-1 text-xs text-foreground opacity-50">
                    Reviewed on {new Date(ip.reviewed_at).toLocaleDateString()} • By Admin ID: {ip.reviewed_by.substring(0, 8)}
                  </span>
                )}
              </div>

              {ip.status === 'pending' && (
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => handleStatusUpdate('rejected')}
                    disabled={isUpdatingStatus}
                  >
                    Reject
                  </Button>
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleStatusUpdate('approved')}
                    isLoading={isUpdatingStatus}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" /> Approve for Marketplace
                  </Button>
                </div>
              )}
              
            </div>
          </div>

        </div>
      </div>

      <UploadModal 
        isOpen={!!uploadTarget} 
        uploadType={uploadTarget || 'document'}
        onClose={() => setUploadTarget(null)} 
        onSuccess={() => {
          setUploadTarget(null);
          setRefreshTrigger(prev => prev + 1);
        }}
        ipId={ip.id} 
      />
    </>
  );
}
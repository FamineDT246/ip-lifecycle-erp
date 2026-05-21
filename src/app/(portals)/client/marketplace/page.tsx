'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, ShoppingBag, FolderOpen, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/forms/Button';
import { Input } from '@/components/forms/Input';
import { supabase } from '@/lib/supabase';
import { useDebounce } from '@/hooks/useDebounce';
import { formatAuditDate } from '@/lib/formatters';
import { MarketplaceService, MarketplaceIP } from '@/lib/services/marketplace.service';

export default function MarketplacePage() {
  const [ips, setIps] = useState<MarketplaceIP[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 400);

  const [selectedIp, setSelectedIp] = useState<MarketplaceIP | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  const loadMarketplace = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delegating complex query logic to the service layer
      const availableIPs = await MarketplaceService.fetchAvailableIPs(user.id, debouncedSearch);
      setIps(availableIPs);

    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error("Failed to load marketplace:", errorMsg);
      setIps([]); 
    } finally {
      setIsLoading(false); 
    }
  }, [debouncedSearch]);

  useEffect(() => {
    loadMarketplace();
  }, [loadMarketplace]);

  const handleRequestLicense = async () => {
    if (!selectedIp) return;
    setIsRequesting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Must be logged in to request a license");

      await MarketplaceService.requestLicenseLead(selectedIp.id, user.id);
      
      setRequestSuccess(true);
      await loadMarketplace();

      setTimeout(() => {
        setSelectedIp(null);
        setRequestSuccess(false);
      }, 2000);

    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to request license.';
      console.error("Deal request failed:", errorMsg);
      alert(errorMsg);
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">IP Marketplace</h1>
        <p className="mt-2 text-foreground opacity-70">
          Browse approved intellectual properties available for licensing and acquisition.
        </p>
      </div>

      <div className="mb-8 flex max-w-md items-center">
        <Input 
          icon={Search} 
          placeholder="Search available assets by title..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
        </div>
      ) : ips.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface text-center shadow-sm">
          <FolderOpen className="mb-4 h-12 w-12 text-foreground opacity-30" />
          <h3 className="text-lg font-semibold text-foreground">No assets found</h3>
          <p className="mt-1 text-sm text-foreground opacity-70">
            {debouncedSearch ? "Try adjusting your search terms." : "There are currently no new IPs available for licensing."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ips.map((ip) => (
            <div 
              key={ip.id}
              onClick={() => { setSelectedIp(ip); setRequestSuccess(false); }}
              className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-all hover:border-primary hover:shadow-md"
            >
              <div className="border-b border-border bg-background px-6 py-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Available
                  </span>
                  <ShoppingBag className="h-4 w-4 text-primary opacity-50 group-hover:opacity-100" />
                </div>
                <h3 className="mt-3 truncate text-lg font-bold text-foreground">{ip.title}</h3>
                <p className="mt-1 text-xs text-foreground opacity-60">
                  By {ip.creator?.display_name || 'Anonymous'}
                </p>
              </div>
              <div className="px-6 py-4">
                <p className="line-clamp-3 text-sm text-foreground opacity-80">
                  {ip.description || "No public description available for this asset."}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedIp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedIp(null)} />
          <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
            
            <div className="border-b border-border bg-background px-6 py-5">
              <h2 className="text-2xl font-bold text-foreground">{selectedIp.title}</h2>
              <div className="mt-2 flex items-center gap-4 text-sm text-foreground opacity-60">
                <span>Created: {formatAuditDate(selectedIp.created_at)}</span>
                <span>•</span>
                <span>Creator: {selectedIp.creator?.display_name || 'Anonymous'}</span>
              </div>
            </div>

            <div className="p-6">
              <h4 className="mb-2 font-semibold text-foreground">Project Overview</h4>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground opacity-80">
                {selectedIp.description || "Detailed description not provided."}
              </p>

              <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
                <h4 className="font-semibold text-blue-900 dark:text-blue-200">Interested in licensing this IP?</h4>
                <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
                  Submitting a request will alert our sales team. A representative will contact you shortly to discuss pricing, terms, and provide access to commercial assets.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border bg-background px-6 py-4">
              <Button variant="ghost" onClick={() => setSelectedIp(null)}>
                Close
              </Button>
              {requestSuccess ? (
                <Button disabled className="bg-green-600 text-white disabled:opacity-100 dark:bg-green-700">
                  Request Sent Successfully!
                </Button>
              ) : (
                <Button onClick={handleRequestLicense} isLoading={isRequesting}>
                  Request License <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
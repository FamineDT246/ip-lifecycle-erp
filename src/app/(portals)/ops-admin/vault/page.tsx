'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, FolderOpen, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/forms/Button';
import { Input } from '@/components/forms/Input';
import { formatAuditDate } from '@/lib/formatters';
import { IPDetailsDrawer } from '@/components/ui/IPDetailsDrawer';
import { CreateIPModal } from '@/components/ui/CreateIPModal';
import { supabase } from '@/lib/supabase';
import { useDebounce } from '@/hooks/useDebounce'; // <-- Update path if needed
import type { IntellectualProperty } from '@/types/database';

const ITEMS_PER_PAGE = 10;

export default function OperationsVaultPage() {
  const [ips, setIps] = useState<IntellectualProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  const [selectedIp, setSelectedIp] = useState<IntellectualProperty | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Reset to page 1 whenever the search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const loadIPs = async () => {
    try {
      setIsLoading(true);
      
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('intellectual_properties')
        .select('*, creator:creator_id(display_name), reviewer:reviewed_by(display_name)', { count: 'exact' });

      // Apply server-side search if there's a term
      if (debouncedSearch) {
        query = query.ilike('title', `%${debouncedSearch}%`);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setIps((data as unknown as IntellectualProperty[]) || []);
      
      if (count !== null) {
        setTotalRecords(count);
        setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
      }
      
    } catch (error) {
      console.error('Failed to fetch IPs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch whenever the page or debounced search changes
  useEffect(() => {
    loadIPs();
  }, [currentPage, debouncedSearch]);

  const getStatusBadge = (status: IntellectualProperty['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      under_review: 'bg-blue-100 text-blue-800 border-blue-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
    };
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status]}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Operations Vault</h1>
          <p className="mt-2 text-sm text-foreground opacity-70">
            Manage master Intellectual Property records and their nested assets.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create New IP
          </Button>
        </div>
      </div>

      <div className="mb-6 flex max-w-md items-center">
        <Input 
          icon={Search} 
          placeholder="Search projects by title..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
          </div>
        ) : ips.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <FolderOpen className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">No IP records found</h3>
            <p className="mt-1 text-sm text-foreground opacity-70">
              {debouncedSearch ? "No projects match your search." : "Create a parent IP to start uploading documents and assets."}
            </p>
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-background">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground opacity-70">Project Title</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground opacity-70">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground opacity-70">Date Created</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground opacity-70">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {ips.map((ip) => {
                  const authorName = Array.isArray(ip.creator) ? ip.creator[0]?.display_name : ip.creator?.display_name;
                  return (
                    <tr 
                      key={ip.id} 
                      onClick={() => { setSelectedIp(ip); setIsDrawerOpen(true); }}
                      className="cursor-pointer transition-colors hover:bg-background/50"
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-foreground">
                        <div className="flex items-center">
                          <FolderOpen className="mr-3 h-5 w-5 text-primary opacity-70" />
                          {ip.title}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        {getStatusBadge(ip.status)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground opacity-70">
                        {formatAuditDate(ip.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground font-medium">
                        {authorName || 'Unknown'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-border bg-background px-6 py-3">
              <span className="text-sm text-foreground opacity-70">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalRecords)} of {totalRecords} entries
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="px-3 py-1 text-xs" 
                  disabled={currentPage === 1 || isLoading}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button 
                  variant="outline" 
                  className="px-3 py-1 text-xs" 
                  disabled={currentPage === totalPages || totalPages === 0 || isLoading}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <IPDetailsDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        onStatusChange={loadIPs}
        ip={selectedIp} 
      />

      <CreateIPModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={loadIPs} 
      />
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/forms/Button';
import { supabase } from '@/lib/supabase';
import { formatAuditDate } from '@/lib/formatters';

export default function CreatorApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('creator_applications')
        .select(`
          id, status, created_at, user_id,
          user:user_id(display_name, company_name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (appId: string, userId: string, action: 'approve' | 'reject') => {
    setProcessingId(appId);
    try {
      const newStatus = action === 'approve' ? 'approved' : 'rejected';

      // 1. Update the application status
      const { error: appError } = await supabase
        .from('creator_applications')
        .update({ status: newStatus })
        .eq('id', appId);
      if (appError) throw appError;

      // 2. If approved, upgrade the user's role
      if (action === 'approve') {
        const { error: userError } = await supabase
          .from('users')
          .update({ role: 'creator' })
          .eq('id', userId);
        if (userError) throw userError;
      }

      // 3. Remove from UI
      setApplications(prev => prev.filter(app => app.id !== appId));

    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error processing application (${action}):`, error.message);
        alert(`Failed to process request: ${error.message}`);
      }
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Creator Applications</h2>
        <p className="mt-1 text-sm text-foreground opacity-70">
          Review and approve requests from buyers wishing to submit IPs.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
          </div>
        ) : applications.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <ShieldAlert className="mb-3 h-10 w-10 text-foreground opacity-30" />
            <h3 className="text-sm font-semibold text-foreground">No Pending Applications</h3>
            <p className="mt-1 text-sm text-foreground opacity-70">All caught up! There are no users waiting for creator access.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-background">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-foreground opacity-70">Applicant</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-foreground opacity-70">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-foreground opacity-70">Date Applied</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-foreground opacity-70">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {applications.map((app) => {
                const userName = Array.isArray(app.user) ? app.user[0]?.display_name : app.user?.display_name;
                const company = Array.isArray(app.user) ? app.user[0]?.company_name : app.user?.company_name;

                return (
                  <tr key={app.id} className="transition-colors hover:bg-background/50">
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-foreground">{userName || 'Unknown'}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-foreground opacity-80">{company || 'N/A'}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground opacity-70">{formatAuditDate(app.created_at)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={processingId === app.id}
                          onClick={() => handleAction(app.id, app.user_id, 'reject')}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                        >
                          <X className="mr-1 h-4 w-4" /> Reject
                        </Button>
                        <Button 
                          size="sm"
                          disabled={processingId === app.id}
                          onClick={() => handleAction(app.id, app.user_id, 'approve')}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {processingId === app.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
                          Approve
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
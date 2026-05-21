'use client';

import { useState, useEffect } from 'react';
import { X, ShieldAlert, FolderOpen, UserX, UserCheck, Loader2, Building2, Phone } from 'lucide-react';
import { Button } from '@/components/forms/Button';
import { formatAuditDate } from '@/lib/formatters';
import { supabase } from '@/lib/supabase';
import type { IntellectualProperty, User } from '@/types/database';

interface UserDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onUserUpdate?: () => void;
  user: User | null; // Now using the global User interface
}

export function UserDetailsDrawer({ isOpen, onClose, onUserUpdate, user }: UserDetailsDrawerProps) {
  const [userIPs, setUserIPs] = useState<IntellectualProperty[]>([]);
  const [isLoadingIPs, setIsLoadingIPs] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!user?.id || !isOpen) return;

    const fetchUserIPs = async () => {
      setIsLoadingIPs(true);
      const { data, error } = await supabase
        .from('intellectual_properties')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setUserIPs(data as IntellectualProperty[]);
      }
      setIsLoadingIPs(false);
    };

    fetchUserIPs();
  }, [user?.id, isOpen]);

  const handleAccountStatusChange = async (action: 'suspend' | 'restore') => {
    if (!user) return;
    setIsUpdatingStatus(true);
    
    try {
      const timestamp = action === 'suspend' ? new Date().toISOString() : null;

      const { error } = await supabase
        .from('users')
        .update({ deleted_at: timestamp })
        .eq('id', user.id);

      if (error) throw error;

      if (onUserUpdate) onUserUpdate();
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error trying to ${action} user:`, error.message);
        alert(`Failed to ${action} user: ${error.message}`);
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (!user) return null;

  const isSuspended = !!user.deleted_at;

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
            <h2 className="text-xl font-semibold text-foreground">User Profile Overview</h2>
            <button 
              onClick={onClose}
              className="rounded-full p-2 text-foreground opacity-50 transition-colors hover:bg-background hover:opacity-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            
            <div className={`mb-8 rounded-lg border p-5 ${isSuspended ? 'border-red-200 bg-red-50' : 'border-border bg-background'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className={`text-xl font-bold ${isSuspended ? 'text-red-900' : 'text-foreground'}`}>
                    {user.display_name || 'Unnamed User'}
                  </h3>
                  <div className="mt-3 space-y-2 text-sm opacity-80">
                    <div className="flex items-center gap-2"><Building2 className="h-4 w-4" /> {user.company_name || 'Independent / No Company'}</div>
                    <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {user.phone_number || 'No phone provided'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase ${
                    isSuspended ? 'border-red-300 bg-red-100 text-red-800' : 'border-green-300 bg-green-100 text-green-800'
                  }`}>
                    {isSuspended ? 'Suspended' : 'Active'}
                  </span>
                  <p className="mt-2 text-xs opacity-50">Joined {formatAuditDate(user.created_at)}</p>
                  <p className="text-xs opacity-50 font-mono mt-1">ID: {user.id.substring(0,8)}</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="mb-4 flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                <h4 className="font-semibold text-foreground">Intellectual Property Portfolio</h4>
              </div>
              
              {isLoadingIPs ? (
                <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : userIPs.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-background/50 p-6 text-center">
                  <FolderOpen className="mx-auto mb-2 h-6 w-6 text-foreground opacity-30" />
                  <p className="text-sm text-foreground opacity-70">This user has not submitted any IP projects.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userIPs.map((ip) => (
                    <div key={ip.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                      <div>
                        <p className="font-medium text-foreground">{ip.title}</p>
                        <p className="text-xs text-foreground opacity-50">Submitted {formatAuditDate(ip.created_at)}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase ${
                        ip.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' : 
                        ip.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-200' : 
                        'bg-yellow-100 text-yellow-800 border-yellow-200'
                      }`}>
                        {ip.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          <div className="border-t border-border bg-background px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-foreground opacity-70">
                <ShieldAlert className="h-4 w-4" />
                Admin Actions
              </div>
              
              {isSuspended ? (
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleAccountStatusChange('restore')}
                  isLoading={isUpdatingStatus}
                >
                  <UserCheck className="mr-2 h-4 w-4" /> Restore Account
                </Button>
              ) : (
                <Button 
                  variant="outline"
                  className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                  onClick={() => handleAccountStatusChange('suspend')}
                  disabled={isUpdatingStatus}
                >
                  <UserX className="mr-2 h-4 w-4" /> Suspend User
                </Button>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
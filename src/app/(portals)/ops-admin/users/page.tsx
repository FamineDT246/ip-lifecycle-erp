'use client';

import { useState, useEffect } from 'react';
import { Search, Users as UsersIcon, Shield, Building2, ChevronRight, Loader2, UserX, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/forms/Button';
import { Input } from '@/components/forms/Input';
import { formatAuditDate } from '@/lib/formatters';
import { supabase } from '@/lib/supabase';
import { UserDetailsDrawer } from '@/components/ui/UserDetailsDrawer';
import { useDebounce } from '@/hooks/useDebounce';
import type { User } from '@/types/database'; // Import the global type

const ITEMS_PER_PAGE = 10;

export default function UserManagementPage() {
  // Utilizing the global User interface
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'active' | 'suspended'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, activeTab]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('users')
        .select('*', { count: 'exact' });

      if (activeTab === 'active') {
        query = query.is('deleted_at', null);
      } else {
        query = query.not('deleted_at', 'is', null);
      }

      if (debouncedSearch) {
        query = query.or(`display_name.ilike.%${debouncedSearch}%,company_name.ilike.%${debouncedSearch}%`);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      setUsers((data as User[]) || []);
      
      if (count !== null) {
        setTotalRecords(count);
        setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
      }

    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [currentPage, debouncedSearch, activeTab]);

  const getRoleBadge = (role: string) => {
    const roleStyles: Record<string, string> = {
      buyer: 'bg-blue-100 text-blue-800 border-blue-200',
      admin: 'bg-purple-100 text-purple-800 border-purple-200',
      ops: 'bg-amber-100 text-amber-800 border-amber-200',
    };
    const style = roleStyles[role.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}>
        <Shield className="mr-1 h-3 w-3 opacity-70" />
        {role.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="mt-2 text-sm text-foreground opacity-70">
            View system access, monitor portfolios, and manage user suspensions.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Button>
            <UsersIcon className="mr-2 h-4 w-4" />
            Invite User
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex space-x-1 rounded-lg bg-surface p-1 border border-border">
          <button
            onClick={() => setActiveTab('active')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'active' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-foreground opacity-70 hover:bg-background'
            }`}
          >
            Active Users
          </button>
          <button
            onClick={() => setActiveTab('suspended')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'suspended' ? 'bg-red-600 text-white shadow-sm' : 'text-foreground opacity-70 hover:bg-background'
            }`}
          >
            Suspended Profiles
          </button>
        </div>

        <div className="w-full sm:max-w-xs">
          <Input 
            icon={Search} 
            placeholder="Search name or company..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${activeTab === 'active' ? 'bg-primary/10 text-primary' : 'bg-red-100 text-red-600'}`}>
              {activeTab === 'active' ? <UsersIcon className="h-6 w-6" /> : <UserX className="h-6 w-6" />}
            </div>
            <h3 className="text-sm font-semibold text-foreground">No users found</h3>
            <p className="mt-1 text-sm text-foreground opacity-70">
              {debouncedSearch ? "No users match your search." : `No ${activeTab} users found.`}
            </p>
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-background">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground opacity-70">Profile</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground opacity-70">Company</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground opacity-70">Role</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground opacity-70">Joined</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {users.map((user) => (
                  <tr 
                    key={user.id} 
                    onClick={() => { setSelectedUser(user); setIsDrawerOpen(true); }}
                    className="cursor-pointer transition-colors hover:bg-background/50"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold ${
                          user.deleted_at ? 'bg-red-100 text-red-700' : 'bg-primary/10 text-primary'
                        }`}>
                          {user.display_name ? user.display_name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="ml-4">
                          <div className={`text-sm font-medium ${user.deleted_at ? 'text-red-700 line-through' : 'text-foreground'}`}>
                            {user.display_name || 'Unnamed User'}
                          </div>
                          <div className="text-sm text-foreground opacity-50">{user.phone_number || 'No phone'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center text-sm text-foreground">
                        <Building2 className="mr-2 h-4 w-4 opacity-50" />
                        {user.company_name || 'Independent'}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground opacity-70">
                      {formatAuditDate(user.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <ChevronRight className="ml-auto h-5 w-5 text-foreground opacity-30" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

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

      <UserDetailsDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)}
        onUserUpdate={loadUsers} 
        user={selectedUser} 
      />
    </div>
  );
}
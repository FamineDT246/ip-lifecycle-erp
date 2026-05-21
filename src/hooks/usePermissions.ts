// src/hooks/usePermissions.ts
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/**
 * Client-side security wrapper for portal routing.
 * Checks the active session and role, automatically redirecting unauthorized users.
 * 
 * @param allowedRoles - Array of roles allowed to view the current page (e.g., ['ops_admin', 'sales_rep'])
 * @returns { isAuthorized, isLoading } - State variables to control rendering UI spinners
 */
export function usePermissions(allowedRoles: string[]) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // 1. Kick out unauthenticated users
      if (!session) {
        router.push('/login');
        return;
      }

      // 2. Fetch their specific enterprise role from our custom users table
      const { data: userRecord } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      // 3. Verify role against allowed array
      if (userRecord && allowedRoles.includes(userRecord.role)) {
        setIsAuthorized(true);
      } else {
        // Redirect unauthorized users to their appropriate default dashboard
        router.push('/client'); 
      }
      
      setIsLoading(false);
    };

    checkPermissions();
  }, [allowedRoles, router]);

  return { isAuthorized, isLoading };
}
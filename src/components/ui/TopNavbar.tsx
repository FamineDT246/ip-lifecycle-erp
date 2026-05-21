'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Box, Bell, UserCircle, LogOut, Accessibility, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useDebounce } from '@/hooks/useDebounce';
import { Container } from '@/components/ui/Container';

/**
 * Global Navigation and Accessibility Control Center.
 * * ARCHITECTURE NOTE:
 * The accessibility settings (font size, colorblind mode) are managed via Zustand
 * in `useAccessibility`. To prevent React from bottlenecking the DOM during continuous
 * slider dragging, we use a local state for the slider UI and a debounced hook to 
 * push the final value to the global store only when the user stops dragging.
 */
export function TopNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const { 
    theme, setTheme, 
    fontSize, setFontSize, 
    fontFamily, setFontFamily,
    colorBlindMode, setColorBlindMode,
    resetAll
  } = useAccessibility();
  
  const [profileData, setProfileData] = useState<{ name: string; role: string } | null>(null);
  const [isAccMenuOpen, setIsAccMenuOpen] = useState(false);

  const [localFontSize, setLocalFontSize] = useState(fontSize);
  const debouncedFontSize = useDebounce(localFontSize, 300);

  useEffect(() => {
    if (debouncedFontSize !== fontSize) {
      setFontSize(debouncedFontSize);
    }
  }, [debouncedFontSize, fontSize, setFontSize]);

  useEffect(() => {
    setLocalFontSize(fontSize);
  }, [fontSize]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: profile } = await supabase
          .from('users')
          .select('role, display_name')
          .eq('id', session.user.id)
          .single();

        setProfileData({
          name: profile?.display_name || session.user.user_metadata?.full_name || 'System User',
          role: profile?.role || 'buyer',
        });
      }
    };
    
    fetchUser();
  }, []);

  if (
    pathname.startsWith('/login') || 
    pathname.startsWith('/register') || 
    pathname.startsWith('/forgot-password') || 
    pathname.startsWith('/reset-password')
  ) {
    return null;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const formatRole = (role: string) => {
    if (role === 'ops_admin') return 'Ops Admin';
    if (role === 'sales_rep') return 'Sales Rep';
    if (role === 'creator') return 'Creator';
    if (role === 'buyer') return 'Buyer';
    return 'Profile';
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Container isWide>
        <div className="flex h-16 items-center justify-between">
          
          <div className="flex">
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Box className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">NexusERP</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative">
              <button 
                onClick={() => setIsAccMenuOpen(!isAccMenuOpen)}
                title="Accessibility Settings"
                className={`rounded-full p-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${
                  isAccMenuOpen ? 'bg-primary/10 text-primary opacity-100' : 'text-foreground opacity-70 hover:bg-surface hover:opacity-100'
                }`}
              >
                <Accessibility className="h-5 w-5" />
              </button>

              {isAccMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsAccMenuOpen(false)} 
                  />
                  <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-border bg-surface p-4 shadow-xl">
                    <div className="mb-4 flex items-center justify-between border-b border-border pb-2">
                      <h3 className="text-sm font-semibold text-foreground">Accessibility</h3>
                      <button 
                        onClick={resetAll}
                        title="Reset all settings"
                        className="text-foreground opacity-50 transition-opacity hover:opacity-100"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-foreground opacity-70">
                          <span>Font Size</span>
                          <span>{localFontSize}px</span>
                        </div>
                        <input 
                          type="range" 
                          min="12" 
                          max="24" 
                          step="1"
                          value={localFontSize}
                          onChange={(e) => setLocalFontSize(Number(e.target.value))}
                          className="h-1.5 w-full appearance-none rounded-lg bg-border accent-primary outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-foreground opacity-70">Font Style</label>
                        <select 
                          value={fontFamily}
                          onChange={(e) => setFontFamily(e.target.value as 'system' | 'sans' | 'serif' | 'mono' | 'casual')}
                          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="system">System Default</option>
                          <option value="sans">Sans-Serif</option>
                          <option value="serif">Serif</option>
                          <option value="mono">Monospace</option>
                          <option value="casual">Casual (High Legibility)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-foreground opacity-70">Visual Theme</label>
                        <select 
                          value={theme}
                          onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'high-contrast')}
                          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="light">Light Mode</option>
                          <option value="dark">Dark Mode</option>
                          <option value="high-contrast">High Contrast</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-foreground opacity-70">Color Blind Filter</label>
                        <select 
                          value={colorBlindMode}
                          onChange={(e) => setColorBlindMode(e.target.value as 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia')}
                          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="none">Default Colors</option>
                          <option value="protanopia">Protanopia (Red-Blind)</option>
                          <option value="deuteranopia">Deuteranopia (Green-Blind)</option>
                          <option value="tritanopia">Tritanopia (Blue-Blind)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button className="rounded-full p-2 text-foreground opacity-70 transition-all hover:bg-surface hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">
              <Bell className="h-5 w-5" />
            </button>
            
            <div className="h-6 w-px bg-border" aria-hidden="true" />
            
            <button className="flex items-center gap-2 rounded-full p-2 text-foreground opacity-70 transition-all hover:bg-surface hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">
              <UserCircle className="h-5 w-5" />
              <span className="hidden text-sm font-medium sm:block">
                {profileData ? formatRole(profileData.role) : 'Profile'}
              </span>
            </button>

            <button 
              onClick={handleLogout}
              className="ml-2 flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition-all hover:bg-background hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-background"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:block">Logout</span>
            </button>
            
          </div>
        </div>
      </Container>
    </nav>
  );
}
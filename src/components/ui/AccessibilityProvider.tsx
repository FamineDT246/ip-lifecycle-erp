'use client';

import { useEffect, useState } from 'react';
import { useAccessibility } from '@/hooks/useAccessibility';

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const { theme, fontSize, fontFamily, colorBlindMode } = useAccessibility();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const root = document.documentElement;

    // 1. Dynamic Font Size (Changes the base REM value for Tailwind)
    root.style.fontSize = `${fontSize}px`;

    // 2. Dynamic Font Family
    const fontMap: Record<string, string> = {
      system: 'system-ui, -apple-system, sans-serif',
      sans: 'ui-sans-serif, system-ui, sans-serif',
      serif: 'ui-serif, Georgia, serif',
      mono: 'ui-monospace, SFMono-Regular, monospace',
      casual: '"Comic Sans MS", "Chalkboard SE", "Comic Neue", sans-serif',
    };
    root.style.setProperty('--acc-font-family', fontMap[fontFamily] || fontMap.system);

    // 3. Theme & Colorblind Attributes
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-colorblind', colorBlindMode);
    
  }, [theme, fontSize, fontFamily, colorBlindMode, mounted]);

  if (!mounted) return <>{children}</>;

  return (
    <>
      <svg className="hidden" aria-hidden="true">
        <defs>
          <filter id="protanopia-filter">
            <feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0  0.558, 0.442, 0, 0, 0  0, 0.242, 0.758, 0, 0  0, 0, 0, 1, 0" />
          </filter>
          <filter id="deuteranopia-filter">
            <feColorMatrix type="matrix" values="0.625, 0.375, 0, 0, 0  0.7, 0.3, 0, 0, 0  0, 0.3, 0.7, 0, 0  0, 0, 0, 1, 0" />
          </filter>
          <filter id="tritanopia-filter">
            <feColorMatrix type="matrix" values="0.95, 0.05, 0, 0, 0  0, 0.433, 0.567, 0, 0  0, 0.475, 0.525, 0, 0  0, 0, 0, 1, 0" />
          </filter>
        </defs>
      </svg>
      {children}
    </>
  );
}
// src/hooks/useAccessibility.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'high-contrast';
type FontFamily = 'system' | 'sans' | 'serif' | 'mono' | 'casual'; 
type ColorBlindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';

interface AccessibilityState {
  theme: Theme;
  fontSize: number; // Accepts precise numerical values (e.g., 14, 16, 20)
  fontFamily: FontFamily;
  colorBlindMode: ColorBlindMode;
  setTheme: (theme: Theme) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (font: FontFamily) => void;
  setColorBlindMode: (mode: ColorBlindMode) => void;
  resetAll: () => void;
}

/**
 * Global state manager for WCAG-compliant enterprise accessibility.
 * Uses Zustand with localStorage persistence so settings remain when the user returns.
 * Maps directly to global CSS variables in globals.css.
 */
export const useAccessibility = create<AccessibilityState>()(
  persist(
    (set) => ({
      theme: 'light',
      fontSize: 16, // Default base font size is 16px
      fontFamily: 'system',
      colorBlindMode: 'none',
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),
      setFontFamily: (fontFamily) => set({ fontFamily }),
      setColorBlindMode: (colorBlindMode) => set({ colorBlindMode }),
      resetAll: () => set({ 
        theme: 'light', 
        fontSize: 16, 
        fontFamily: 'system', 
        colorBlindMode: 'none' 
      }),
    }),
    {
      name: 'erp-accessibility-storage',
    }
  )
);
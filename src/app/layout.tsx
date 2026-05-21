import './globals.css';
import type { Metadata } from 'next';
import { AccessibilityProvider } from '@/components/ui/AccessibilityProvider';
import { TopNavbar } from '@/components/ui/TopNavbar';

export const metadata: Metadata = {
  title: 'IP Vault Management System',
  description: 'Secure platform for intellectual property management and licensing.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground flex flex-col">
        <AccessibilityProvider>
          <TopNavbar />
          {/* Removed pt-16 here to fix the double-spacing gap */}
          <main className="flex-1 w-full">
            {children}
          </main>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
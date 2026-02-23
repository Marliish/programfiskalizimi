import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { QueryProvider } from '@/lib/providers/QueryProvider';

// ⚡ Optimized font loading with display swap
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: 'FiscalNext Admin - Fiscalization Platform',
  description: 'Admin dashboard for FiscalNext fiscalization platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              // ⚡ Faster toast animations
              duration: 3000,
              style: {
                animation: 'slideIn 0.2s ease-out',
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}

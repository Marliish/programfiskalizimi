'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

/**
 * ⚡ Optimized React Query configuration for SPEED
 * 
 * Features:
 * - Aggressive caching (5min stale time)
 * - Request deduplication
 * - Optimistic updates support
 * - Background refetch disabled for faster perceived performance
 * - Single retry to avoid slow repeated failures
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache data for 5 minutes before marking as stale
        staleTime: 5 * 60 * 1000, // 5 minutes
        
        // Keep data in cache for 10 minutes even if not actively used
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
        
        // Don't refetch on window focus for faster perceived speed
        refetchOnWindowFocus: false,
        
        // Don't refetch on reconnect unless data is actually stale
        refetchOnReconnect: 'always',
        
        // Only retry once on failure (faster error feedback)
        retry: 1,
        
        // Retry delay: 1 second
        retryDelay: 1000,
        
        // Enable request deduplication
        structuralSharing: true,
      },
      mutations: {
        // Single retry for mutations
        retry: 1,
        retryDelay: 1000,
      },
    },
  });
}

// Browser-side singleton to avoid creating new QueryClient on every render
let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
  }
}

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // NOTE: Avoid useState when initializing the query client if you don't
  // have a suspense boundary between this and the code that may need to
  // suspend. Using state here will cause the client to be re-created on
  // every render, which is bad for performance.
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      )}
    </QueryClientProvider>
  );
}

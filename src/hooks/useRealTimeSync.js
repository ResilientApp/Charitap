import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';

/**
 * Custom hook for real-time data synchronization
 * Polls the backend at regular intervals and listens for extension/postMessage updates
 * 
 * @param {Function} fetchFunction - The function to call to fetch fresh data
 * @param {number} pollingInterval - Interval in milliseconds (default: 10000ms = 10 seconds)
 * @param {Array} dependencies - Additional dependencies to trigger refetch
 * @returns {Function} manualRefresh - Function to manually trigger a refresh
 */
export const useRealTimeSync = (fetchFunction, pollingInterval = 10000, dependencies = []) => {
  const { isAuthenticated } = useAuth();
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);
  const lastFetchRef = useRef(0);
  const isFirstFetchRef = useRef(true);

  // Wrap fetch function with error handling and rate limiting
  const safeFetch = useCallback(async () => {
    if (!isAuthenticated || !isMountedRef.current) {
      return;
    }

    // Rate limiting: ensure minimum 5 seconds between fetches
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchRef.current;
    if (timeSinceLastFetch < 5000 && !isFirstFetchRef.current) {
      console.log('[RealTimeSync] Skipping fetch - too soon since last fetch');
      return;
    }

    lastFetchRef.current = now;
    isFirstFetchRef.current = false;

    try {
      await fetchFunction();
    } catch (error) {
      console.error('[RealTimeSync] Error during fetch:', error);
      // Don't propagate error - just log it
    }
  }, [isAuthenticated, fetchFunction]);

  // Manual refresh function that can be called externally
  const manualRefresh = useCallback(() => {
    if (isAuthenticated && isMountedRef.current) {
      console.log('[RealTimeSync] Manual refresh triggered');
      safeFetch();
    }
  }, [isAuthenticated, safeFetch]);

  useEffect(() => {
    isMountedRef.current = true;
    isFirstFetchRef.current = true;

    // Don't start polling if not authenticated
    if (!isAuthenticated) {
      console.log('[RealTimeSync] Not authenticated, skipping sync');
      return;
    }

    console.log(`[RealTimeSync] Starting real-time sync with ${pollingInterval}ms interval`);

    // Initial fetch
    safeFetch();

    // Start polling
    intervalRef.current = setInterval(() => {
      if (isMountedRef.current && isAuthenticated) {
        console.log('[RealTimeSync] Polling interval - fetching fresh data');
        safeFetch();
      }
    }, pollingInterval);

    // Listen for wallet updates from extension
    const handleWalletUpdate = (event) => {
      if (event.data && event.data.type === 'CHARITAP_WALLET_UPDATE') {
        console.log('[RealTimeSync] Received CHARITAP_WALLET_UPDATE, refreshing data');
        if (isMountedRef.current) {
          safeFetch();
        }
      }
    };

    // Listen for postMessage events (from extension)
    window.addEventListener('message', handleWalletUpdate);

    // Cleanup function
    return () => {
      console.log('[RealTimeSync] Cleaning up real-time sync');
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      window.removeEventListener('message', handleWalletUpdate);
    };
  }, [isAuthenticated, safeFetch, pollingInterval, ...dependencies]);

  return manualRefresh;
};

/**
 * Hook specifically for activity/roundup list updates
 * Moderate polling (30 seconds) to avoid rate limiting
 */
export const useActivitySync = (fetchFunction, dependencies = []) => {
  return useRealTimeSync(fetchFunction, 30000, dependencies);
};

/**
 * Hook for wallet balance updates
 * Moderate polling (45 seconds)
 */
export const useWalletSync = (fetchFunction, dependencies = []) => {
  return useRealTimeSync(fetchFunction, 45000, dependencies);
};

/**
 * Hook for dashboard stats
 * Slower polling (60 seconds) since stats change less frequently
 */
export const useDashboardSync = (fetchFunction, dependencies = []) => {
  return useRealTimeSync(fetchFunction, 60000, dependencies);
};

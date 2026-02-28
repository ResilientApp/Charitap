import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useRealTimeSync
 *
 * A smart polling hook that keeps data up-to-date in the background.
 * Features:
 *  - Configurable polling interval (default: 30s)
 *  - Pauses automatically when the browser tab is hidden (Page Visibility API)
 *  - Re-fetches immediately when the user returns to the tab
 *  - Exposes a `refresh()` function to trigger a manual re-sync from any component
 *  - Returns { data, isLoading, error, lastUpdated, refresh }
 *
 * @param {Function} fetchFn    - Async function that fetches and returns data
 * @param {number}   interval   - Polling interval in ms (default: 30000)
 * @param {boolean}  enabled    - Whether polling is active (default: true)
 *
 * @example
 * const { data, isLoading, refresh } = useRealTimeSync(fetchDashboardData, 30000, isAuthenticated);
 */
const useRealTimeSync = (fetchFn, interval = 30000, enabled = true) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Refs to avoid stale closures in event listeners
  const intervalRef = useRef(null);
  const abortControllerRef = useRef(null);
  const fetchFnRef = useRef(fetchFn);
  const enabledRef = useRef(enabled);
  const isMountedRef = useRef(true);

  // Keep refs up to date
  useEffect(() => { fetchFnRef.current = fetchFn; }, [fetchFn]);
  useEffect(() => { enabledRef.current = enabled; }, [enabled]);

  const runFetch = useCallback(async () => {
    if (!enabledRef.current || !isMountedRef.current) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFnRef.current({ signal: controller.signal });
      if (isMountedRef.current && !controller.signal.aborted) {
        setData(result);
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (isMountedRef.current && !controller.signal.aborted) {
        setError(err.message || 'Sync failed');
        console.error('[useRealTimeSync] Fetch error:', err);
      }
    } finally {
      if (isMountedRef.current && !controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []); // stable — uses refs internally

  const startPolling = useCallback(() => {
    stopPolling();
    intervalRef.current = setInterval(() => {
      runFetch();
    }, interval);
  }, [interval, runFetch]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Page Visibility API — pause polling when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        // Re-fetch immediately when user comes back
        runFetch();
        if (enabledRef.current) startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [startPolling, stopPolling, runFetch]);

  // Main effect: start / stop polling based on `enabled`
  useEffect(() => {
    isMountedRef.current = true;

    if (enabled) {
      runFetch(); // immediate first fetch
      startPolling();
    }

    return () => {
      isMountedRef.current = false;
      stopPolling();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [enabled, startPolling, stopPolling, runFetch]);

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    refresh: runFetch, // expose for manual trigger
  };
};

export default useRealTimeSync;

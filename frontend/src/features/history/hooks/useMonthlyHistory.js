import { useState, useEffect, useCallback, useRef } from "react";
import streakService from "../../../../services/streakService.js";

const monthlyCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

/**
 * Hook to fetch monthly DailyStats from /streak/monthly?year=Y&month=M.
 * Returns a Map keyed by productDate ("YYYY-MM-DD") for O(1) cell lookup.
 * Features in-memory caching to eliminate duplicate requests during navigation.
 */
export function useMonthlyHistory(year, month) {
  const cacheKey = `${year}-${month}`;
  const initialCache = monthlyCache.get(cacheKey);

  const [statsMap, setStatsMap] = useState(() => initialCache?.map || new Map());
  const [isLoading, setIsLoading] = useState(() => !initialCache);
  const [error, setError] = useState(null);

  const activeRequestRef = useRef(0);
  const debounceTimerRef = useRef(null);

  const fetchStats = useCallback(async (force = false) => {
    const key = `${year}-${month}`;
    const cached = monthlyCache.get(key);

    // If cache is valid and not forced, reuse cached result without sending network request
    if (!force && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      setStatsMap(cached.map);
      setIsLoading(false);
      setError(null);
      return;
    }

    const requestId = ++activeRequestRef.current;
    if (!cached) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const data = await streakService.fetchMonthly(year, month);
      if (requestId !== activeRequestRef.current) return;

      const map = new Map();
      if (Array.isArray(data)) {
        for (const stat of data) {
          const pDate = stat.productDate || (stat.date ? stat.date.slice(0, 10) : null);
          if (pDate) {
            map.set(pDate, stat);
          }
        }
      }
      monthlyCache.set(key, { map, timestamp: Date.now() });
      setStatsMap(map);
    } catch (err) {
      if (requestId !== activeRequestRef.current) return;
      console.error("Failed to load monthly history:", err);
      setError(err?.message || "Failed to load monthly streak stats");
    } finally {
      if (requestId === activeRequestRef.current) {
        setIsLoading(false);
      }
    }
  }, [year, month]);

  useEffect(() => {
    fetchStats(false);
  }, [fetchStats]);

  useEffect(() => {
    const handleTasksChanged = () => {
      // Clear current month from cache and debounce refetch to avoid multiple calls
      monthlyCache.delete(`${year}-${month}`);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        fetchStats(true);
      }, 300);
    };

    window.addEventListener("athena:tasks-changed", handleTasksChanged);
    return () => {
      window.removeEventListener("athena:tasks-changed", handleTasksChanged);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [year, month, fetchStats]);

  return {
    statsMap,
    isLoading,
    error,
    refetch: () => fetchStats(true),
  };
}

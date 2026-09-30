import { useState, useEffect, useCallback, useRef } from "react";
import streakService from "../../../../services/streakService.js";

/**
 * Hook to fetch monthly DailyStats from /streak/monthly?year=Y&month=M.
 * Returns a Map keyed by productDate ("YYYY-MM-DD") for O(1) cell lookup.
 */
export function useMonthlyHistory(year, month) {
  const [statsMap, setStatsMap] = useState(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const activeRequestRef = useRef(0);

  const fetchStats = useCallback(async () => {
    const requestId = ++activeRequestRef.current;
    setIsLoading(true);
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
    fetchStats();
  }, [fetchStats]);

  return {
    statsMap,
    isLoading,
    error,
    refetch: fetchStats,
  };
}

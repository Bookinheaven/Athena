import { useState, useEffect, useCallback, useRef } from "react";
import taskOccurrenceService from "../../../../services/taskOccurrenceService.js";
import sessionService from "../../../../services/sessionService.js";

const dayHistoryCache = new Map();
const DAY_CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

/**
 * Hook to fetch selected product day's TaskOccurrences and paginated Sessions.
 * Discards stale out-of-order responses if selectedDate or page changes rapidly.
 * Features in-memory caching to eliminate duplicate requests during date navigation.
 */
export function useDayHistory(selectedDate, sessionPage = 1, sessionFilters = {}) {
  const filterType = sessionFilters?.completionType || "all";
  const filterTaskId = sessionFilters?.taskId || "";
  const cacheKey = `${selectedDate}:${sessionPage}:${filterType}:${filterTaskId}`;
  const initialCache = dayHistoryCache.get(cacheKey);

  const [occurrences, setOccurrences] = useState(() => initialCache?.occurrences || []);
  const [sessions, setSessions] = useState(() => initialCache?.sessions || []);
  const [pagination, setPagination] = useState(() => initialCache?.pagination || {
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [isLoadingOccurrences, setIsLoadingOccurrences] = useState(() => !initialCache);
  const [isLoadingSessions, setIsLoadingSessions] = useState(() => !initialCache);
  const [errorOccurrences, setErrorOccurrences] = useState(null);
  const [errorSessions, setErrorSessions] = useState(null);

  const occReqRef = useRef(0);
  const sessReqRef = useRef(0);
  const debounceTimerRef = useRef(null);

  // 1. Fetch occurrences for selected day
  const fetchOccurrences = useCallback(async (force = false) => {
    if (!selectedDate) return;

    const key = `${selectedDate}:${sessionPage}:${filterType}:${filterTaskId}`;
    const cached = dayHistoryCache.get(key);

    if (!force && cached?.occurrences && Date.now() - cached.timestamp < DAY_CACHE_TTL_MS) {
      setOccurrences(cached.occurrences);
      setIsLoadingOccurrences(false);
      setErrorOccurrences(null);
      return;
    }

    const reqId = ++occReqRef.current;
    if (!cached?.occurrences) {
      setIsLoadingOccurrences(true);
    }
    setErrorOccurrences(null);

    try {
      const res = await taskOccurrenceService.getOccurrences({ date: selectedDate });
      if (reqId !== occReqRef.current) return;

      const loadedOccs = res?.occurrences || [];
      setOccurrences(loadedOccs);

      // Update cache
      const prevCache = dayHistoryCache.get(key) || {};
      dayHistoryCache.set(key, {
        ...prevCache,
        occurrences: loadedOccs,
        timestamp: Date.now(),
      });
    } catch (err) {
      if (reqId !== occReqRef.current) return;
      console.error("Failed to load occurrences for date:", selectedDate, err);
      setErrorOccurrences(err?.message || "Failed to load task outcomes");
    } finally {
      if (reqId === occReqRef.current) {
        setIsLoadingOccurrences(false);
      }
    }
  }, [selectedDate, sessionPage, filterType, filterTaskId]);

  // 2. Fetch sessions for selected day
  const fetchSessions = useCallback(async (force = false) => {
    if (!selectedDate) return;

    const key = `${selectedDate}:${sessionPage}:${filterType}:${filterTaskId}`;
    const cached = dayHistoryCache.get(key);

    if (!force && cached?.sessions && Date.now() - cached.timestamp < DAY_CACHE_TTL_MS) {
      setSessions(cached.sessions);
      if (cached.pagination) setPagination(cached.pagination);
      setIsLoadingSessions(false);
      setErrorSessions(null);
      return;
    }

    const reqId = ++sessReqRef.current;
    if (!cached?.sessions) {
      setIsLoadingSessions(true);
    }
    setErrorSessions(null);

    try {
      const queryParams = {
        startDate: selectedDate,
        endDate: selectedDate,
        page: sessionPage,
        limit: 5,
      };

      if (filterType && filterType !== "all") {
        queryParams.completionType = filterType;
      }
      if (filterTaskId) {
        queryParams.taskId = filterTaskId;
      }

      const res = await sessionService.getHistory(queryParams);
      if (reqId !== sessReqRef.current) return;

      const loadedSessions = res?.sessions || [];
      const loadedPagination = res?.pagination || {
        page: sessionPage,
        limit: 5,
        total: loadedSessions.length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      };

      setSessions(loadedSessions);
      setPagination(loadedPagination);

      // Update cache
      const prevCache = dayHistoryCache.get(key) || {};
      dayHistoryCache.set(key, {
        ...prevCache,
        sessions: loadedSessions,
        pagination: loadedPagination,
        timestamp: Date.now(),
      });
    } catch (err) {
      if (reqId !== sessReqRef.current) return;
      console.error("Failed to load sessions for date:", selectedDate, err);
      setErrorSessions(err?.message || "Failed to load focus sessions");
    } finally {
      if (reqId === sessReqRef.current) {
        setIsLoadingSessions(false);
      }
    }
  }, [selectedDate, sessionPage, filterType, filterTaskId]);

  useEffect(() => {
    fetchOccurrences(false);
  }, [fetchOccurrences]);

  useEffect(() => {
    fetchSessions(false);
  }, [fetchSessions]);

  useEffect(() => {
    const handleTasksChanged = () => {
      // Invalidate day cache and debounce refetch
      dayHistoryCache.clear();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        fetchOccurrences(true);
        fetchSessions(true);
      }, 300);
    };

    window.addEventListener("athena:tasks-changed", handleTasksChanged);
    window.addEventListener("athena:routines-changed", handleTasksChanged);
    return () => {
      window.removeEventListener("athena:tasks-changed", handleTasksChanged);
      window.removeEventListener("athena:routines-changed", handleTasksChanged);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [fetchOccurrences, fetchSessions]);

  return {
    occurrences,
    sessions,
    pagination,
    isLoadingOccurrences,
    isLoadingSessions,
    isLoading: isLoadingOccurrences || isLoadingSessions,
    error: errorOccurrences || errorSessions,
    refetchOccurrences: () => fetchOccurrences(true),
    refetchSessions: () => fetchSessions(true),
    refetchAll: () => {
      fetchOccurrences(true);
      fetchSessions(true);
    },
  };
}

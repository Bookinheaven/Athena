import { useState, useEffect, useCallback, useRef } from "react";
import taskOccurrenceService from "../../../../services/taskOccurrenceService.js";
import sessionService from "../../../../services/sessionService.js";

/**
 * Hook to fetch selected product day's TaskOccurrences and paginated Sessions.
 * Discards stale out-of-order responses if selectedDate or page changes rapidly.
 */
export function useDayHistory(selectedDate, sessionPage = 1, sessionFilters = {}) {
  const [occurrences, setOccurrences] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [isLoadingOccurrences, setIsLoadingOccurrences] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [errorOccurrences, setErrorOccurrences] = useState(null);
  const [errorSessions, setErrorSessions] = useState(null);

  const occReqRef = useRef(0);
  const sessReqRef = useRef(0);

  // 1. Fetch occurrences for selected day
  const fetchOccurrences = useCallback(async () => {
    if (!selectedDate) return;
    const reqId = ++occReqRef.current;
    setIsLoadingOccurrences(true);
    setErrorOccurrences(null);

    try {
      const res = await taskOccurrenceService.getOccurrences({ date: selectedDate });
      if (reqId !== occReqRef.current) return;
      setOccurrences(res?.occurrences || []);
    } catch (err) {
      if (reqId !== occReqRef.current) return;
      console.error("Failed to load occurrences for date:", selectedDate, err);
      setErrorOccurrences(err?.message || "Failed to load task outcomes");
    } finally {
      if (reqId === occReqRef.current) {
        setIsLoadingOccurrences(false);
      }
    }
  }, [selectedDate]);

  // 2. Fetch sessions for selected day
  const fetchSessions = useCallback(async () => {
    if (!selectedDate) return;
    const reqId = ++sessReqRef.current;
    setIsLoadingSessions(true);
    setErrorSessions(null);

    try {
      const queryParams = {
        startDate: selectedDate,
        endDate: selectedDate,
        page: sessionPage,
        limit: 10,
      };

      if (sessionFilters.completionType && sessionFilters.completionType !== "all") {
        queryParams.completionType = sessionFilters.completionType;
      }
      if (sessionFilters.taskId) {
        queryParams.taskId = sessionFilters.taskId;
      }

      const res = await sessionService.getHistory(queryParams);
      if (reqId !== sessReqRef.current) return;

      setSessions(res?.sessions || []);
      if (res?.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      if (reqId !== sessReqRef.current) return;
      console.error("Failed to load sessions for date:", selectedDate, err);
      setErrorSessions(err?.message || "Failed to load focus sessions");
    } finally {
      if (reqId === sessReqRef.current) {
        setIsLoadingSessions(false);
      }
    }
  }, [selectedDate, sessionPage, sessionFilters.completionType, sessionFilters.taskId]);

  useEffect(() => {
    fetchOccurrences();
  }, [fetchOccurrences]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    occurrences,
    sessions,
    pagination,
    isLoadingOccurrences,
    isLoadingSessions,
    isLoading: isLoadingOccurrences || isLoadingSessions,
    error: errorOccurrences || errorSessions,
    refetchOccurrences: fetchOccurrences,
    refetchSessions: fetchSessions,
    refetchAll: () => {
      fetchOccurrences();
      fetchSessions();
    },
  };
}

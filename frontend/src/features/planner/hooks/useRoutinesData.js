import { useState, useEffect, useCallback, useMemo } from "react";
import routineService from "../../../../services/routineService.js";
import toast from "react-hot-toast";

export function useRoutinesData() {
  const [routines, setRoutines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Filter & Search
  const [activeFilter, setActiveFilter] = useState("active_paused"); // 'active_paused' | 'all' | 'active' | 'paused' | 'archived'
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);

  const [routineToDelete, setRoutineToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch routines
  const loadRoutines = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const data = await routineService.getRoutines({ includeArchived: true });
      setRoutines(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load routines:", err);
      setIsError(true);
      toast.error(err.message || "Failed to load routines");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoutines();
  }, [loadRoutines]);

  // Derived filtered routines
  const filteredRoutines = useMemo(() => {
    let result = [...routines];

    // Status filter
    if (activeFilter === "active_paused") {
      result = result.filter((r) => r.status === "active" || r.status === "paused");
    } else if (activeFilter === "active") {
      result = result.filter((r) => r.status === "active");
    } else if (activeFilter === "paused") {
      result = result.filter((r) => r.status === "paused");
    } else if (activeFilter === "archived") {
      result = result.filter((r) => r.status === "archived");
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [routines, activeFilter, searchQuery]);

  // Stats counts
  const stats = useMemo(() => {
    const active = routines.filter((r) => r.status === "active").length;
    const paused = routines.filter((r) => r.status === "paused").length;
    const archived = routines.filter((r) => r.status === "archived").length;
    return {
      active,
      paused,
      archived,
      totalActivePaused: active + paused,
      total: routines.length,
    };
  }, [routines]);

  // Actions
  const openCreateRoutine = () => {
    setEditingRoutine(null);
    setIsModalOpen(true);
  };

  const openEditRoutine = (routine) => {
    setEditingRoutine(routine);
    setIsModalOpen(true);
  };

  const saveRoutine = async (formData, routineId) => {
    try {
      if (routineId) {
        const updated = await routineService.updateRoutine(routineId, formData);
        setRoutines((prev) =>
          prev.map((r) => ((r.id || r._id) === routineId ? updated : r))
        );
        toast.success("Routine updated");
      } else {
        const created = await routineService.createRoutine(formData);
        setRoutines((prev) => [created, ...prev]);
        toast.success("Routine created");
      }
      return true;
    } catch (err) {
      toast.error(err.message || "Failed to save routine");
      throw err;
    }
  };

  const toggleRoutineStatus = async (routine) => {
    const rId = routine.id || routine._id;
    const nextStatus = routine.status === "active" ? "paused" : "active";
    try {
      const updated = await routineService.updateStatus(rId, nextStatus);
      setRoutines((prev) =>
        prev.map((r) => ((r.id || r._id) === rId ? updated : r))
      );
      toast.success(
        nextStatus === "active" ? "Routine resumed" : "Routine paused"
      );
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const archiveRoutine = async (routine) => {
    const rId = routine.id || routine._id;
    const nextStatus = routine.status === "archived" ? "active" : "archived";
    try {
      const updated = await routineService.updateStatus(rId, nextStatus);
      setRoutines((prev) =>
        prev.map((r) => ((r.id || r._id) === rId ? updated : r))
      );
      toast.success(
        nextStatus === "archived" ? "Routine archived" : "Routine restored"
      );
    } catch (err) {
      toast.error(err.message || "Failed to update routine");
    }
  };

  const confirmDeleteRoutine = async () => {
    if (!routineToDelete) return;
    const rId = routineToDelete.id || routineToDelete._id;
    setIsDeleting(true);
    try {
      await routineService.deleteRoutine(rId);
      setRoutines((prev) => prev.filter((r) => (r.id || r._id) !== rId));
      toast.success("Routine deleted");
      setRoutineToDelete(null);
    } catch (err) {
      toast.error(err.message || "Failed to delete routine");
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    routines,
    filteredRoutines,
    stats,
    isLoading,
    isError,
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,
    isModalOpen,
    setIsModalOpen,
    editingRoutine,
    routineToDelete,
    setRoutineToDelete,
    isDeleting,
    loadRoutines,
    openCreateRoutine,
    openEditRoutine,
    saveRoutine,
    toggleRoutineStatus,
    archiveRoutine,
    confirmDeleteRoutine,
  };
}

import { useState, useEffect, useCallback } from "react";
import notesService from "@services/notesService.js";

export const useNotes = () => {
  const [notes, setNotes] = useState([]);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await notesService.getNotes();

      const notesArray = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];

      setNotes(
        notesArray.map((n) => ({
          ...n,
          id: n._id,
          taskId: n.task?._id || n.task || null,
        }))
      );
    } catch (err) {
      console.error("[useNotes] Fetch notes failed:", err);
    }
  }, []);

  const createNote = useCallback(async (payload) => {
    try {
      const backendPayload = {
        ...payload,
        task: payload.task || payload.taskId || null,
      };
      const res = await notesService.createNotes(backendPayload);

      const noteRaw = res?.data ?? res;

      if (!noteRaw || !noteRaw._id) {
        console.error("[useNotes] Invalid createNote response:", res);
        return null;
      }

      const newNote = {
        ...noteRaw,
        id: noteRaw._id,
        taskId: noteRaw.task?._id || noteRaw.task || null,
      };

      setNotes((prev) => [newNote, ...prev]);

      return newNote;
    } catch (err) {
      console.error("[useNotes] Create note failed:", err);
      return null;
    }
  }, []);

  const updateNote = useCallback(async (id, payload) => {
    try {
      const backendPayload = { ...payload };
      if (payload.taskId !== undefined && payload.task === undefined) {
        backendPayload.task = payload.taskId;
      }
      await notesService.updateNote(id, backendPayload);

      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...payload } : n))
      );
    } catch (err) {
      console.error("[useNotes] Update note failed:", err);
    }
  }, []);

  const deleteNote = useCallback(async (id) => {
    try {
      await notesService.deleteNote(id);

      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("[useNotes] Delete note failed:", err);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return {
    notes,
    setNotes,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
  };
};

export default useNotes;

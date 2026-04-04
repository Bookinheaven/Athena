import { useState, useEffect } from "react";
import notesService from "../../../../../services/notesService";

export const useNotes = () => {
  const [notes, setNotes] = useState([]);

  const fetchNotes = async () => {
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
          taskId: n.task,
        })),
      );
    } catch (err) {
      console.error("Fetch notes failed", err);
    }
  };

  const createNote = async (payload) => {
    try {
      const res = await notesService.createNotes(payload);

      const noteRaw = res?.data ?? res;

      if (!noteRaw || !noteRaw._id) {
        console.error("Invalid createNote response:", res);
        return null;
      }

      const newNote = {
        ...noteRaw,
        id: noteRaw._id,
        taskId: noteRaw.task,
      };

      setNotes((prev) => [newNote, ...prev]);

      return newNote;
    } catch (err) {
      console.error("Create note failed", err);
      return null;
    }
  };

  const updateNote = async (id, payload) => {
    try {
      await notesService.updateNote(id, payload);

      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...payload } : n)),
      );
    } catch (err) {
      console.error("Update note failed", err);
    }
  };

  const deleteNote = async (id) => {
    try {
      await notesService.deleteNote(id);

      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Delete note failed", err);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  return {
    notes,
    setNotes,
    createNote,
    updateNote,
    deleteNote,
  };
};

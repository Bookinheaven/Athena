import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  X,
  Trash2,
  Plus,
  Link,
  ChevronDown,
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  NotebookPen,
  FolderOpen,
  CheckCircle2,
  Search,
  Calendar,
  Clock,
  ArrowLeft,
  Layers,
  FileText,
  ListTodo,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";

const MenuBar = ({ editor }) => {
  if (!editor) return null;

  const Button = ({ onClick, disabled, isActive, children }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-1.5 rounded-full transition-all duration-200 ${isActive
        ? "bg-primary/20 text-primary shadow-xs"
        : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
        }`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex items-center gap-1 p-1 bg-secondary/50 border border-border rounded-full mb-4 w-fit shrink-0 shadow-xs">
      <Button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
      >
        <Bold size={16} strokeWidth={2.5} />
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
      >
        <Italic size={16} strokeWidth={2.5} />
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
      >
        <Strikethrough size={16} strokeWidth={2.5} />
      </Button>
      <div className="w-px h-5 bg-border-secondary mx-1" />
      <Button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
      >
        <List size={16} strokeWidth={2.5} />
      </Button>
      <Button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
      >
        <ListOrdered size={16} strokeWidth={2.5} />
      </Button>
      <div className="w-px h-5 bg-border-secondary mx-1" />
      <Button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
      >
        <Quote size={16} strokeWidth={2.5} />
      </Button>
    </div>
  );
};

export const Notes = ({
  show = true,
  onClose,
  hideHeader = false,
  notes = [],
  todos = [],
  tasks = [],
  createNote,
  updateNote,
  deleteNote,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debounceRef = useRef(null);
  const titleDebounceRef = useRef(null);
  const [localTitle, setLocalTitle] = useState("");

  const pendingChangesRef = useRef({ id: null, title: undefined, content: undefined });
  const previousEditingId = useRef(editingId);
  const notesRef = useRef(notes);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  const flushPendingSave = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (titleDebounceRef.current) {
      clearTimeout(titleDebounceRef.current);
      titleDebounceRef.current = null;
    }

    const pending = pendingChangesRef.current;
    if (!pending.id) return;

    const payload = {};
    if (pending.content !== undefined) payload.content = pending.content;
    if (pending.title !== undefined) payload.title = pending.title;

    if (Object.keys(payload).length > 0) {
      const targetId = pending.id;
      pendingChangesRef.current = { id: null, title: undefined, content: undefined };
      updateNote(targetId, payload);
    }
  }, [updateNote]);

  // Flush pending changes before editingId changes
  useEffect(() => {
    return () => {
      flushPendingSave();
    };
  }, [editingId, flushPendingSave]);

  // Flush pending changes when drawer closes or unmounts
  useEffect(() => {
    if (!show) {
      flushPendingSave();
    }
  }, [show, flushPendingSave]);

  useEffect(() => {
    return () => {
      flushPendingSave();
    };
  }, [flushPendingSave]);

  useEffect(() => {
    const prevId = previousEditingId.current;
    if (prevId && prevId !== editingId) {
      const prevNote = notesRef.current.find((n) => n.id === prevId);
      if (prevNote) {
        const hasPendingTitle =
          pendingChangesRef.current.id === prevId &&
          Boolean(pendingChangesRef.current.title?.trim());
        const hasPendingContent =
          pendingChangesRef.current.id === prevId &&
          Boolean(
            pendingChangesRef.current.content &&
            pendingChangesRef.current.content !== "<p></p>"
          );

        const isEmpty =
          (!prevNote.title || !prevNote.title.trim()) &&
          (!prevNote.content || prevNote.content === "<p></p>") &&
          !localTitle.trim() &&
          !hasPendingTitle &&
          !hasPendingContent;

        const isCurrentlyEditing = prevId === editingId;
        if (isEmpty && !isCurrentlyEditing) {
          deleteNote(prevId);
        }
      }
    }

    previousEditingId.current = editingId;
  }, [editingId, deleteNote, localTitle]);

  const allAvailableTasks = useMemo(() => {
    const map = new Map();
    // 1. Tasks from tasks prop (hydrated by useFocusTasks)
    (tasks || []).forEach((t) => {
      const id = String(t._id || t.id);
      if (id) {
        map.set(id, {
          id,
          _id: id,
          title: t.title || t.name || t.text || "Untitled Task",
          status: t.status,
        });
      }
    });
    // 2. Todos from session checklist
    (todos || []).forEach((t) => {
      const id = String(t.id || t._id);
      if (id) {
        const existing = map.get(id);
        map.set(id, {
          id,
          _id: id,
          title: t.title || t.text || existing?.title || "Untitled Task",
          status: t.status || existing?.status,
        });
      }
    });
    // 3. Notes referencing tasks
    notes.forEach((n) => {
      const raw = n.taskId || (typeof n.task === "object" ? n.task?._id : n.task);
      if (raw) {
        const id = String(raw);
        if (!map.has(id)) {
          const title =
            (typeof n.task === "object" && n.task?.title) ||
            n.taskTitle ||
            "Linked Task";
          map.set(id, { id, _id: id, title, status: null });
        }
      }
    });
    return Array.from(map.values());
  }, [tasks, todos, notes]);

  const selectedTask = useMemo(
    () => allAvailableTasks.find((t) => String(t.id) === String(selectedTaskId)),
    [selectedTaskId, allAvailableTasks],
  );

  const filteredNotes = useMemo(() => {
    let baseNotes = notes;
    if (selectedTaskId === "all") {
      baseNotes = notes;
    } else if (selectedTaskId === "general" || !selectedTaskId) {
      baseNotes = notes.filter((n) => {
        const raw = n.taskId || (typeof n.task === "object" ? n.task?._id : n.task);
        return !raw;
      });
    } else {
      baseNotes = notes.filter((n) => {
        const raw = n.taskId || (typeof n.task === "object" ? n.task?._id : n.task);
        return String(raw) === String(selectedTaskId);
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return baseNotes.filter(n =>
        n.title?.toLowerCase().includes(query) ||
        n.content?.toLowerCase().includes(query)
      );
    }
    return baseNotes;
  }, [notes, selectedTaskId, searchQuery]);

  const currentNote = notes.find((n) => n.id === editingId);

  const noteCounts = useMemo(() => {
    return notes.reduce((acc, note) => {
      const raw = note.taskId || (typeof note.task === "object" ? note.task?._id : note.task);
      const key = raw ? String(raw) : "general";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [notes]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Placeholder.configure({
        placeholder: "Start typing… Press '/' for commands",
      }),
    ],
    content: "",
    onUpdate: ({ editor }) => {
      if (!editingId) return;
      const html = editor.getHTML();
      pendingChangesRef.current.id = editingId;
      pendingChangesRef.current.content = html;

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        flushPendingSave();
      }, 800);
    },
    editorProps: {
      attributes: {
        class: "ProseMirror prose prose-invert max-w-none focus:outline-none text-[15px] leading-relaxed cursor-text min-h-[150px]",
      },
      handleDOMEvents: {
        blur: () => {
          flushPendingSave();
          return false;
        },
      },
    },
  });

  useEffect(() => {
    setLocalTitle(currentNote?.title || "");
  }, [currentNote?.id, currentNote?.title]);

  useEffect(() => {
    if (!editor) return;
    const currentEditorContent = editor.getHTML();
    const newContent = currentNote?.content || "<p></p>";
    if (currentEditorContent !== newContent) {
      editor.commands.setContent(newContent);
    }
  }, [currentNote?.id, currentNote?.content, editor]);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setLocalTitle(newTitle);

    if (!editingId) return;
    pendingChangesRef.current.id = editingId;
    pendingChangesRef.current.title = newTitle;

    if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
    titleDebounceRef.current = setTimeout(() => {
      flushPendingSave();
    }, 600);
  };

  const handlePaste = (event) => {
    if (!editor) return;
    const items = event.clipboardData?.items;
    if (!items) return;
    for (let item of items) {
      const file = item.getAsFile();
      if (file && file.type.startsWith("image")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          editor.chain().focus().setImage({ src: e.target.result }).run();
        };
        reader.readAsDataURL(file);
        event.preventDefault();
        return;
      }
    }
  };

  const handleDrop = (event) => {
    if (!editor) return;
    const file = event.dataTransfer?.files?.[0];
    if (file && file.type.startsWith("image")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        editor.chain().focus().setImage({ src: e.target.result }).run();
      };
      reader.readAsDataURL(file);
      event.preventDefault();
    }
  };

  const handleCreateNote = async () => {
    flushPendingSave();
    if (editingId) {
      const activeNote = notes.find((n) => n.id === editingId);
      const isEmpty =
        !activeNote?.title?.trim() &&
        (!activeNote?.content || activeNote?.content === "<p></p>");
      if (isEmpty) return;
    }
    const existingEmptyNote = filteredNotes.find(
      (n) => !n.title?.trim() && (!n.content || n.content === "<p></p>")
    );
    if (existingEmptyNote) {
      setEditingId(existingEmptyNote.id);
      return;
    }
    const targetTaskId =
      selectedTaskId === "all" || selectedTaskId === "general" || !selectedTaskId
        ? null
        : selectedTaskId;

    const res = await createNote({
      title: "",
      content: "<p></p>",
      task: targetTaskId,
      taskId: targetTaskId,
    });
    if (!res) return;
    setEditingId(res.id);
  };

  const handleDelete = async (id) => {
    if (pendingChangesRef.current.id === id) {
      pendingChangesRef.current = { id: null, title: undefined, content: undefined };
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
    }
    await deleteNote(id);
    if (editingId === id) setEditingId(null);
  };

  const handleDeleteGroup = async () => {
    const contextName =
      selectedTaskId === "all"
        ? "All Notes"
        : selectedTask
          ? `"${selectedTask.title || selectedTask.text}"`
          : "General Notes";
    if (window.confirm(`Delete all notes for ${contextName}?`)) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
      pendingChangesRef.current = { id: null, title: undefined, content: undefined };
      for (let note of filteredNotes) {
        await deleteNote(note.id);
      }
      setEditingId(null);
    }
  };

  if (!show) return null;

  return (
    <div className="flex flex-col h-full w-full bg-card">
      {!hideHeader && (
        <div className="flex justify-between items-center px-5 py-4 border-b border-border bg-card/80 backdrop-blur-md shrink-0 z-20">
          <h3 className="text-sm font-black tracking-wide text-foreground flex items-center gap-2">
            {selectedTaskId === "all"
              ? "All Notes"
              : selectedTaskId === "general" || !selectedTaskId
                ? "General Notes"
                : `${selectedTask?.title || "Task"} Notes`}
          </h3>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <div className="px-5 py-3 border-b border-border shrink-0 bg-muted/20 z-10">
        <div className="flex justify-between items-center text-xs mb-3">
          <span className="flex items-center gap-1.5 font-bold text-muted-foreground uppercase tracking-wider">
            <Link size={12} strokeWidth={2.5} /> Link Context
          </span>
          {filteredNotes.length > 0 && (
            <button
              type="button"
              onClick={handleDeleteGroup}
              className="text-[11px] font-bold text-destructive bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 px-2 py-1 rounded transition-all duration-200"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-border bg-secondary/50 hover:bg-secondary/80 text-foreground text-xs font-semibold transition-all duration-200 shadow-2xs"
          >
            <div className="flex items-center gap-2 truncate">
              {selectedTaskId === "all" ? (
                <Layers size={14} className="text-primary shrink-0" />
              ) : selectedTaskId === "general" || !selectedTaskId ? (
                <FileText size={14} className="text-primary shrink-0" />
              ) : (
                <ListTodo size={14} className="text-primary shrink-0" />
              )}
              <span className="truncate">
                {selectedTaskId === "all"
                  ? "All Notes"
                  : selectedTaskId === "general" || !selectedTaskId
                    ? "General Notes (No Task)"
                    : selectedTask?.title || selectedTask?.text || "Task Notes"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-1.5 py-0.5 rounded-md bg-muted text-[10px] text-muted-foreground font-mono">
                {selectedTaskId === "all"
                  ? notes.length
                  : selectedTaskId === "general" || !selectedTaskId
                    ? (noteCounts["general"] || 0)
                    : (noteCounts[selectedTaskId] || 0)}
              </span>
              <ChevronDown
                size={14}
                className={`text-muted-foreground transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""
                  }`}
              />
            </div>
          </button>

          {isDropdownOpen && (
            <>
              {/* Dismiss backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute top-full left-0 right-0 mt-1.5 p-1.5 bg-popover text-popover-foreground border border-border rounded-xl shadow-xl z-50 flex flex-col gap-1 max-h-64 overflow-y-auto custom-scrollbar">
                {/* All Notes Option */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTaskId("all");
                    setIsDropdownOpen(false);
                    setEditingId(null);
                  }}
                  className={`flex items-center justify-between p-2 rounded-lg text-xs font-medium transition-colors ${selectedTaskId === "all"
                      ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                      : "text-foreground hover:bg-secondary"
                    }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Layers size={13} className="shrink-0 opacity-80" />
                    <span className="truncate">All Notes</span>
                  </div>
                  <span
                    className={`text-[10px] shrink-0 font-mono ${selectedTaskId === "all"
                        ? "text-primary-foreground/90 font-bold"
                        : "text-muted-foreground"
                      }`}
                  >
                    ({notes.length})
                  </span>
                </button>

                {/* General Notes Option */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTaskId("general");
                    setIsDropdownOpen(false);
                    setEditingId(null);
                  }}
                  className={`flex items-center justify-between p-2 rounded-lg text-xs font-medium transition-colors ${selectedTaskId === "general" || !selectedTaskId
                      ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                      : "text-foreground hover:bg-secondary"
                    }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText size={13} className="shrink-0 opacity-80" />
                    <span className="truncate">General Notes</span>
                  </div>
                  <span
                    className={`text-[10px] shrink-0 font-mono ${selectedTaskId === "general" || !selectedTaskId
                        ? "text-primary-foreground/90 font-bold"
                        : "text-muted-foreground"
                      }`}
                  >
                    ({noteCounts["general"] || 0})
                  </span>
                </button>

                {/* Tasks Section */}
                {allAvailableTasks.length > 0 && (
                  <>
                    <div className="pt-2 pb-1 px-2 border-t border-border/60 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                      <span>Tasks</span>
                      <span>({allAvailableTasks.length})</span>
                    </div>
                    {allAvailableTasks.map((task) => {
                      const isSelected = String(selectedTaskId) === String(task.id);
                      const isCompleted =
                        task.status === "completed" || task.status === "Completed";
                      return (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => {
                            setSelectedTaskId(task.id);
                            setIsDropdownOpen(false);
                            setEditingId(null);
                          }}
                          className={`flex items-center justify-between p-2 rounded-lg text-xs text-left font-medium transition-colors ${isSelected
                              ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                              : "text-foreground hover:bg-secondary"
                            }`}
                        >
                          <div className="flex items-center gap-2 truncate min-w-0 pr-2">
                            {isCompleted ? (
                              <CheckCircle2
                                size={13}
                                className={`shrink-0 ${isSelected
                                    ? "text-primary-foreground"
                                    : "text-emerald-500"
                                  }`}
                              />
                            ) : (
                              <ListTodo
                                size={13}
                                className={`shrink-0 ${isSelected
                                    ? "text-primary-foreground"
                                    : "text-primary"
                                  }`}
                              />
                            )}
                            <span className="truncate">{task.title}</span>
                          </div>
                          <span
                            className={`text-[10px] shrink-0 font-mono ${isSelected
                                ? "text-primary-foreground/90 font-bold"
                                : "text-muted-foreground"
                              }`}
                          >
                            ({noteCounts[task.id] || 0})
                          </span>
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 relative">
        <div className="flex justify-between items-center p-3 px-5 border-b border-border bg-muted/20 shrink-0 gap-2">
          <div className="relative flex-1">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search in context..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={handleCreateNote}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-2xs shrink-0 cursor-pointer"
          >
            <Plus size={14} strokeWidth={2.5} /> New Note
          </button>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          {editingId && currentNote ? (
            <div className="flex-1 flex flex-col p-4 sm:p-5 overflow-y-auto custom-scrollbar relative" onPaste={handlePaste} onDrop={handleDrop}>
              <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-border">
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-semibold px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 transition-all cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>All Notes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="text-xs text-muted-foreground hover:text-foreground font-medium px-2 py-1 rounded hover:bg-secondary transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>

              <input
                type="text"
                placeholder="Note Title..."
                value={localTitle}
                onChange={handleTitleChange}
                onBlur={flushPendingSave}
                className="w-full bg-transparent border-none text-base sm:text-lg font-bold text-foreground placeholder:text-muted-foreground focus:outline-none mb-3"
              />

              <MenuBar editor={editor} />

              <div className="flex-1 overflow-y-auto custom-scrollbar mt-3">
                <EditorContent editor={editor} />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-3 space-y-2 bg-muted/10">
              {filteredNotes.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs flex flex-col items-center justify-center flex-1 my-auto">
                  <NotebookPen size={28} className="mb-3 opacity-40 text-primary" />
                  <p className="font-semibold text-foreground text-sm">No notes found</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Create a note to jot down thoughts, ideas, or references during this session.
                  </p>
                  <button
                    type="button"
                    onClick={handleCreateNote}
                    className="mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    <Plus size={14} strokeWidth={2.5} /> Create Note
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNotes.map((note) => {
                    const isSelected = note.id === editingId;
                    const dateStr = note.updatedAt
                      ? new Date(note.updatedAt).toLocaleDateString([], { month: "short", day: "numeric" })
                      : "";
                    const rawTaskId =
                      note.taskId ||
                      (typeof note.task === "object" ? note.task?._id : note.task);
                    const linkedTask = rawTaskId
                      ? allAvailableTasks.find(
                        (item) => String(item.id) === String(rawTaskId)
                      )
                      : null;

                    return (
                      <div
                        key={note.id}
                        onClick={() => setEditingId(note.id)}
                        className={`group p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 relative ${isSelected
                            ? "bg-primary/10 border-primary/30 shadow-xs"
                            : "bg-card border-border/60 hover:border-border hover:bg-secondary/40"
                          }`}
                      >
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="text-xs font-bold truncate block flex-1 text-foreground group-hover:text-primary transition-colors">
                            {note.title?.trim() || "Untitled Note"}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(note.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive text-muted-foreground rounded transition-opacity"
                            title="Delete note"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        <div className="text-[11px] text-muted-foreground line-clamp-2 opacity-80 mb-2 leading-relaxed">
                          {note.content?.replace(/<[^>]*>?/gm, "").trim() || "Empty note content..."}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-muted-foreground opacity-70">
                          <div className="flex items-center gap-2">
                            {dateStr && (
                              <div className="flex items-center gap-1">
                                <Clock size={10} />
                                <span>{dateStr}</span>
                              </div>
                            )}
                            {selectedTaskId === "all" && (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate max-w-[120px] ${linkedTask
                                    ? "bg-primary/10 text-primary"
                                    : "bg-muted text-muted-foreground"
                                  }`}
                              >
                                {linkedTask ? linkedTask.title : "General"}
                              </span>
                            )}
                          </div>
                          <span className="text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                            Edit note →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notes;

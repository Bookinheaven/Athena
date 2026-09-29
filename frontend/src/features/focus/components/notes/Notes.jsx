import React, { useState, useMemo, useEffect, useRef } from "react";
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
        ? "bg-button-primary/20 text-button-primary shadow-sm"
        : "text-text-muted hover:bg-button-primary/10 hover:text-text-primary"
        }`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex items-center gap-1 p-1 bg-background-secondary/50 backdrop-blur-md border border-white/10 dark:border-white/5 rounded-full mb-4 w-fit shrink-0 shadow-sm">
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
  createNote,
  updateNote,
  deleteNote,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debounceRef = useRef(null);
  const titleDebounceRef = useRef(null);
  const [localTitle, setLocalTitle] = useState("");

  const previousEditingId = useRef(editingId);
  const notesRef = useRef(notes);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  useEffect(() => {
    const prevId = previousEditingId.current;
    if (prevId && prevId !== editingId) {
      const prevNote = notesRef.current.find(n => n.id === prevId);
      if (prevNote) {
        const isEmpty =
          (!prevNote.title || !prevNote.title.trim()) &&
          (!prevNote.content || prevNote.content === "<p></p>") &&
          !localTitle.trim();
        const isCurrentlyEditing = prevId === editingId;
        if (isEmpty && !isCurrentlyEditing) {
          deleteNote(prevId);
        }
      }
    }

    previousEditingId.current = editingId;
  }, [editingId, deleteNote, localTitle]);

  const selectedTask = useMemo(
    () => todos.find((todo) => String(todo.id) === String(selectedTaskId)),
    [selectedTaskId, todos],
  );

  const filteredNotes = useMemo(() => {
    let baseNotes = selectedTaskId
      ? notes.filter((n) => String(n.taskId) === String(selectedTaskId))
      : notes.filter((n) => !n.taskId);

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
      const key = note.taskId || "general";
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
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateNote(editingId, {
          content: editor.getHTML(),
        });
      }, 800);
    },
    editorProps: {
      attributes: {
        class: "ProseMirror prose prose-invert max-w-none focus:outline-none text-[15px] leading-relaxed cursor-text min-h-[150px]",
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

    clearTimeout(titleDebounceRef.current);
    titleDebounceRef.current = setTimeout(() => {
      updateNote(editingId, { title: newTitle });
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
    if (editingId) {
      const activeNote = notes.find(n => n.id === editingId);
      const isEmpty = !activeNote?.title?.trim() && (!activeNote?.content || activeNote?.content === "<p></p>");
      if (isEmpty) return;
    }
    const existingEmptyNote = filteredNotes.find(n => !n.title?.trim() && (!n.content || n.content === "<p></p>"));
    if (existingEmptyNote) {
      setEditingId(existingEmptyNote.id);
      return;
    }
    const res = await createNote({
      title: "",
      content: "<p></p>",
      task: selectedTaskId || null,
      taskId: selectedTaskId || null,
    });
    if (!res) return;
    setEditingId(res.id);
  };

  const handleDelete = async (id) => {
    await deleteNote(id);
    if (editingId === id) setEditingId(null);
  };

  const handleDeleteGroup = async () => {
    const contextName = selectedTask ? `"${selectedTask.title || selectedTask.text}"` : "General Notes";
    if (window.confirm(`Delete all notes for ${contextName}?`)) {
      for (let note of filteredNotes) {
        await deleteNote(note.id);
      }
      setEditingId(null);
    }
  };

  if (!show) return null;

  return (
    <div className="flex flex-col h-full w-full bg-transparent">
      {!hideHeader && (
        <div className="flex justify-between items-center px-5 py-4 border-b border-white/5 bg-background-primary/30 backdrop-blur-md shrink-0 z-20">
          <h3 className="text-sm font-black tracking-wide text-text-primary flex items-center gap-2">
            {selectedTask ? "Task Notes" : "Workspace Notes"}
          </h3>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-text-muted hover:text-text-primary hover:bg-background-secondary transition-colors active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <div className="px-5 py-3 border-b border-white/5 shrink-0 bg-background-primary/20 backdrop-blur-sm z-10">
        <div className="flex justify-between items-center text-xs mb-3">
          <span className="flex items-center gap-1.5 font-bold text-text-muted uppercase tracking-wider">
            <Link size={12} strokeWidth={2.5} /> Link Context
          </span>
          {filteredNotes.length > 0 && (
            <button onClick={handleDeleteGroup} className="text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300 px-2 py-1 rounded transition-all duration-300">
              Clear All
            </button>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-background-primary/50 hover:bg-background-secondary/40 text-text-primary text-xs font-semibold transition-all duration-300 shadow-sm"
          >
            <div className="flex items-center gap-2 truncate">
              <FolderOpen size={14} className="text-button-primary shrink-0" />
              <span className="truncate">
                {selectedTask ? selectedTask.title || selectedTask.text : "General Notes (No Task)"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-1.5 py-0.5 rounded-md bg-white/5 text-[10px] text-text-muted">
                {selectedTaskId ? (noteCounts[selectedTaskId] || 0) : (noteCounts["general"] || 0)}
              </span>
              <ChevronDown size={14} className={`text-text-muted transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`} />
            </div>
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 p-1.5 bg-background-primary/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 flex flex-col gap-1 max-h-56 overflow-y-auto custom-scrollbar">
              <button
                onClick={() => { setSelectedTaskId(null); setIsDropdownOpen(false); setEditingId(null); }}
                className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${!selectedTaskId ? "bg-button-primary/20 text-button-primary font-bold" : "text-text-secondary hover:bg-white/5"}`}
              >
                <span>General Notes</span>
                <span className="text-[10px] opacity-70">({noteCounts["general"] || 0})</span>
              </button>

              {todos.map((todo) => (
                <button
                  key={todo.id}
                  onClick={() => { setSelectedTaskId(todo.id); setIsDropdownOpen(false); setEditingId(null); }}
                  className={`flex items-center justify-between p-2 rounded-lg text-xs text-left transition-colors ${selectedTaskId === todo.id ? "bg-button-primary/20 text-button-primary font-bold" : "text-text-secondary hover:bg-white/5"}`}
                >
                  <span className="truncate pr-2">{todo.title || todo.text}</span>
                  <span className="text-[10px] opacity-70 shrink-0">({noteCounts[todo.id] || 0})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 relative">
        <div className="flex justify-between items-center p-3 px-5 border-b border-white/5 bg-background-secondary/10 shrink-0 gap-2">
          <div className="relative flex-1">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search in context..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 bg-background-primary/30 border border-white/5 rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-button-primary/50 transition-colors"
            />
          </div>

          <button
            onClick={handleCreateNote}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-button-primary hover:bg-button-primary-hover text-white text-xs font-bold transition-all shadow-sm shrink-0"
          >
            <Plus size={14} strokeWidth={2.5} /> New Note
          </button>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          {editingId && currentNote ? (
            <div className="flex-1 flex flex-col p-4 sm:p-5 overflow-y-auto custom-scrollbar relative" onPaste={handlePaste} onDrop={handleDrop}>
              <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-white/5">
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="flex items-center gap-1.5 text-xs text-button-primary hover:text-button-primary-hover font-semibold px-2.5 py-1 rounded-lg bg-button-primary/10 hover:bg-button-primary/20 transition-all cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>All Notes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="text-xs text-text-muted hover:text-text-primary font-medium px-2 py-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>

              <input
                type="text"
                placeholder="Note Title..."
                value={localTitle}
                onChange={handleTitleChange}
                className="w-full bg-transparent border-none text-base sm:text-lg font-bold text-text-primary placeholder:text-text-muted focus:outline-none mb-3"
              />

              <MenuBar editor={editor} />

              <div className="flex-1 overflow-y-auto custom-scrollbar mt-3">
                <EditorContent editor={editor} />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-3 space-y-2 bg-background-secondary/5">
              {filteredNotes.length === 0 ? (
                <div className="p-8 text-center text-text-muted text-xs flex flex-col items-center justify-center flex-1 my-auto">
                  <NotebookPen size={28} className="mb-3 opacity-40 text-primary" />
                  <p className="font-semibold text-text-secondary text-sm">No notes found</p>
                  <p className="text-xs text-text-muted mt-1 max-w-xs">
                    Create a note to jot down thoughts, ideas, or references during this session.
                  </p>
                  <button
                    type="button"
                    onClick={handleCreateNote}
                    className="mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-button-primary hover:bg-button-primary-hover text-white text-xs font-bold transition-all shadow-sm"
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
                    return (
                      <div
                        key={note.id}
                        onClick={() => setEditingId(note.id)}
                        className={`group p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 relative ${
                          isSelected
                            ? "bg-button-primary/10 border-button-primary/30 shadow-sm"
                            : "bg-background-primary/30 border-white/5 hover:border-white/15 hover:bg-background-secondary/40"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="text-xs font-bold truncate block flex-1 text-text-primary group-hover:text-button-primary transition-colors">
                            {note.title?.trim() || "Untitled Note"}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(note.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-text-muted rounded transition-opacity"
                            title="Delete note"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        <div className="text-[11px] text-text-muted line-clamp-2 opacity-75 mb-2 leading-relaxed">
                          {note.content?.replace(/<[^>]*>?/gm, "").trim() || "Empty note content..."}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-text-muted opacity-60">
                          {dateStr && (
                            <div className="flex items-center gap-1">
                              <Clock size={10} />
                              <span>{dateStr}</span>
                            </div>
                          )}
                          <span className="text-button-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
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

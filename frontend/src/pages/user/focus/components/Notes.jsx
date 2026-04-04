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
  Clock
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
      className={`p-1.5 rounded-lg transition-all duration-200 ${
        isActive
          ? "bg-button-primary/20 text-button-primary shadow-sm"
          : "text-text-muted hover:bg-background-secondary hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex items-center gap-1 p-1 bg-background-secondary/40 border border-border-secondary rounded-xl mb-4 w-fit shrink-0 shadow-sm">
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

const Notes = ({
  show,
  onClose,
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
    if (!editor) return;
    const currentEditorContent = editor.getHTML();
    const newContent = currentNote?.content || "<p></p>";
    if (currentEditorContent !== newContent) {
      editor.commands.setContent(newContent);
    }
  }, [currentNote?.id, editor]);

  useEffect(() => {
    if (!editor) return;
    const insertLocalImage = (file) => {
      if (!file || !file.type.startsWith("image")) return false;
      const reader = new FileReader();
      reader.onload = (e) => {
        editor.chain().focus().setImage({ src: e.target.result }).run();
      };
      reader.readAsDataURL(file);
      return true;
    };
    const handlePaste = (event) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      for (let item of items) {
        if (insertLocalImage(item.getAsFile())) {
          event.preventDefault();
          break;
        }
      }
    };
    const handleDrop = (event) => {
      const file = event.dataTransfer?.files?.[0];
      if (insertLocalImage(file)) event.preventDefault();
    };
    const dom = editor?.view?.dom;
    if (!dom) return;
    dom.addEventListener("paste", handlePaste);
    dom.addEventListener("drop", handleDrop);
    return () => {
      dom.removeEventListener("paste", handlePaste);
      dom.removeEventListener("drop", handleDrop);
    };
  }, [editor]);

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
      <div className="flex justify-between items-center px-5 py-4 border-b border-border-secondary shrink-0">
        <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
          {selectedTask ? "Task Notes" : "Workspace Notes"}
        </h3>
        <button onClick={onClose} className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-background-secondary transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-5 py-4 border-b border-border-secondary shrink-0 bg-background-primary/20 z-20">
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

        <div className="flex flex-col gap-3">
          <div className="relative">
            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full flex items-center justify-between rounded-xl border border-border-secondary px-4 py-3 bg-input-background text-text-primary hover:border-border-primary hover:bg-background-secondary transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-button-primary/50">
              <div className="flex items-center gap-2 text-sm font-medium truncate">
                {!selectedTaskId ? (
                  <>
                    <FolderOpen size={16} className="text-text-muted" />
                    <span>General Scratchpad</span>
                    <span className="text-xs text-text-muted ml-1 bg-background-secondary px-1.5 rounded-full">{noteCounts["general"] || 0}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} className="text-button-primary" />
                    <span className="truncate">{selectedTask?.title || selectedTask?.text}</span>
                    <span className="text-xs text-button-primary bg-button-primary/10 px-1.5 rounded-full">{noteCounts[selectedTaskId] || 0}</span>
                  </>
                )}
              </div>
              <ChevronDown size={16} className={`text-text-muted transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsDropdownOpen(false)} />
                <div className="absolute top-full left-0 mt-2 w-full max-h-60 overflow-y-auto custom-scrollbar bg-card-background border border-border-secondary rounded-xl shadow-2xl z-40 py-2">
                  <button onClick={() => { setSelectedTaskId(null); setEditingId(null); setIsDropdownOpen(false); }} className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${!selectedTaskId ? "bg-background-secondary/80 text-text-primary font-semibold" : "text-text-secondary hover:bg-background-secondary/50 hover:text-text-primary font-medium"}`}>
                    <div className="flex items-center gap-2"><FolderOpen size={16} className={!selectedTaskId ? "text-button-primary" : "text-text-muted"} /><span>General Scratchpad</span></div>
                    <span className="text-xs text-text-muted bg-background-secondary px-2 py-0.5 rounded-full border border-border-secondary/50">{noteCounts["general"] || 0}</span>
                  </button>
                  {todos.length > 0 && <div className="px-4 py-2 mt-1 border-t border-border-secondary/30"><div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Tasks</div></div>}
                  {todos.map((todo) => {
                    const isActive = String(todo.id) === String(selectedTaskId);
                    return (
                      <button key={todo.id} onClick={() => { setSelectedTaskId(todo.id); setEditingId(null); setIsDropdownOpen(false); }} className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${isActive ? "bg-background-secondary/80 text-text-primary font-semibold" : "text-text-secondary hover:bg-background-secondary/50 hover:text-text-primary font-medium"}`}>
                        <div className="flex items-center gap-2 truncate pr-4"><CheckCircle2 size={16} className={isActive ? "text-button-primary" : "text-text-muted"} /><span className="truncate">{todo.title || todo.text}</span></div>
                        <span className="text-xs text-text-muted bg-background-secondary px-2 py-0.5 rounded-full border border-border-secondary/50 shrink-0">{noteCounts[todo.id] || 0}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="relative group">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-text-muted group-focus-within:text-button-primary transition-colors" />
            <input type="text" placeholder="Search in these notes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-input-background border border-border-secondary rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary outline-none focus:border-button-primary/50 focus:ring-1 focus:ring-button-primary/30 transition-all" />
            {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-2.5 p-0.5 rounded-full hover:bg-background-secondary text-text-muted"><X size={14} /></button>}
          </div>
        </div>

        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 custom-scrollbar shrink-0">
          {filteredNotes.map((note) => (
            <button key={note.id} onClick={() => setEditingId(note.id)} className={`whitespace-nowrap px-4 py-1.5 text-xs font-bold rounded-full transition-all border ${editingId === note.id ? "bg-button-primary border-button-primary text-white shadow-md scale-105" : "bg-background-secondary border-border-secondary text-text-secondary hover:bg-background-secondary-contrast hover:text-text-primary"}`}>
              {note.title || "Untitled Note"}
            </button>
          ))}
          <button onClick={handleCreateNote} className="flex items-center gap-1 px-4 py-1.5 rounded-full border border-dashed border-border-secondary text-text-muted hover:text-text-primary hover:border-border-primary hover:bg-background-secondary transition-all">
            <Plus size={14} strokeWidth={2.5} /> <span className="text-xs font-bold">New</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col p-5 overflow-hidden z-10">
        {editingId ? (
          <div className="flex flex-col h-full w-full animate-fade-in">
            <div className="flex flex-col gap-1 mb-4">
              <input placeholder="Note Title..." value={currentNote?.title || ""} onChange={(e) => updateNote(editingId, { title: e.target.value })} className="w-full text-3xl font-black bg-transparent outline-none text-text-primary placeholder:text-text-muted/30 tracking-tight" />
              <div className="flex items-center gap-3 text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1 opacity-70">
                <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(currentNote?.updatedAt || Date.now()).toLocaleDateString()}</span>
                <span className="flex items-center gap-1"><Clock size={10} /> {new Date(currentNote?.updatedAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            </div>
            <MenuBar editor={editor} />
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar cursor-text min-h-0 border-t border-border-secondary/10 pt-4">
              <EditorContent editor={editor} className="min-h-full pb-10" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
            <div className="w-16 h-16 bg-background-secondary/50 rounded-full flex items-center justify-center mb-4 border border-border-secondary shadow-inner">
              {searchQuery ? <Search size={28} className="text-text-muted" /> : <NotebookPen size={28} className="text-text-muted" strokeWidth={1.5} />}
            </div>
            <p className="text-base text-text-primary font-semibold">{searchQuery ? "No matches found" : "No note selected"}</p>
            <p className="text-sm text-text-muted mt-1 max-w-[220px]">{searchQuery ? "Try a different search term or select a different task context." : "Select a note from the tabs above or create a new one to begin."}</p>
          </div>
        )}
      </div>

      {editingId && (
        <div className="px-5 py-3 border-t border-border-secondary bg-background-secondary/30 shrink-0 flex justify-end">
          <button onClick={() => handleDelete(editingId)} className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-button-danger/10 border border-button-danger/20 text-button-danger hover:bg-button-danger hover:text-white transition-all duration-300 font-bold text-xs shadow-sm">
            <Trash2 size={14} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" /> Delete Current Note
          </button>
        </div>
      )}
    </div>
  );
};

export default Notes;
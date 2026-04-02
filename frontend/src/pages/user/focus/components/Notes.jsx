import { useState, useMemo, useEffect, useRef } from "react";
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
} from "lucide-react";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";

const MenuBar = ({ editor }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap gap-1 mb-3 pb-2 border-b border-border-secondary shrink-0">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-background-secondary transition ${editor.isActive("bold") ? "text-button-primary bg-button-primary/10" : "text-text-muted"}`}
      >
        <Bold size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-background-secondary transition ${editor.isActive("italic") ? "text-button-primary bg-button-primary/10" : "text-text-muted"}`}
      >
        <Italic size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded hover:bg-background-secondary transition ${editor.isActive("strike") ? "text-button-primary bg-button-primary/10" : "text-text-muted"}`}
      >
        <Strikethrough size={16} />
      </button>

      <div className="w-px h-6 bg-border-secondary mx-1 self-center" />

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded hover:bg-background-secondary transition ${editor.isActive("bulletList") ? "text-button-primary bg-button-primary/10" : "text-text-muted"}`}
      >
        <List size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded hover:bg-background-secondary transition ${editor.isActive("orderedList") ? "text-button-primary bg-button-primary/10" : "text-text-muted"}`}
      >
        <ListOrdered size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1.5 rounded hover:bg-background-secondary transition ${editor.isActive("blockquote") ? "text-button-primary bg-button-primary/10" : "text-text-muted"}`}
      >
        <Quote size={16} />
      </button>
    </div>
  );
};

const Notes = ({
  show,
  onClose,
  notes = [],
  setNotes,
  todos = [],
  createNote,
  updateNote,
  deleteNote,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const debounceRef = useRef(null);

  const selectedTask = useMemo(
    () => todos.find((todo) => String(todo.id) === String(selectedTaskId)),
    [selectedTaskId, todos],
  );

  const filteredNotes = useMemo(() => {
    if (selectedTaskId) {
      return notes.filter((n) => String(n.taskId) === String(selectedTaskId));
    }
    return notes.filter((n) => !n.taskId);
  }, [notes, selectedTaskId]);

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
        class:
          "ProseMirror prose prose-invert max-w-none focus:outline-none text-[15px] leading-relaxed cursor-text min-h-[150px]",
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
    const contextName = selectedTask
      ? `"${selectedTask.text}"`
      : "General Notes";

    if (window.confirm(`Delete all notes for ${contextName}?`)) {
      for (let note of filteredNotes) {
        await deleteNote(note.id);
      }
      setEditingId(null);
    }
  };

  if (!show) return null;

  return (
    <div className="h-full max-h-full w-full flex flex-col px-5 py-5 bg-card-background border border-card-border rounded-2xl shadow-card-shadow relative overflow-hidden">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h3 className="text-base font-semibold text-text-primary">
          {selectedTask ? "Task Notes" : "Workspace Notes"}
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-background-secondary rounded-md transition"
        >
          <X className="w-5 h-5 text-text-muted hover:text-text-primary" />
        </button>
      </div>

      <div className="mb-4 shrink-0">
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="flex items-center gap-1 font-medium text-text-muted uppercase tracking-wider">
            <Link size={12} /> Link to Task
          </span>
          {filteredNotes.length > 0 && (
            <button
              onClick={handleDeleteGroup}
              className="text-button-danger hover:underline"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="relative group">
          <select
            value={selectedTaskId || ""}
            onChange={(e) => {
              setSelectedTaskId(e.target.value || null);
              setEditingId(null);
            }}
            className="w-full appearance-none rounded-xl border border-border-secondary px-3 py-2.5 text-sm bg-input-background text-text-primary focus:border-button-primary focus:ring-1 focus:ring-button-primary outline-none transition cursor-pointer"
          >
            <option value="">
              General Scratchpad [{noteCounts["general"] || 0}]
            </option>
            {todos.map((todo) => (
              <option key={todo.id} value={todo.id}>
                {todo.text} [{noteCounts[todo.id] || 0}]
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-text-muted pointer-events-none group-hover:text-text-primary transition" />
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto p-2 pl-0 custom-scrollbar shrink-0">
        {filteredNotes.map((note) => (
          <button
            key={note.id}
            onClick={() => setEditingId(note.id)}
            className={`
              whitespace-nowrap px-3 py-1.5 text-sm font-medium rounded-lg transition-all border
              ${
                editingId === note.id
                  ? "bg-button-primary border-button-primary text-white shadow-md"
                  : "bg-background-secondary border-border-secondary text-text-secondary hover:bg-background-secondary-contrast"
              }
            `}
          >
            {note.title || "Untitled Note"}
          </button>
        ))}
        <button
          onClick={handleCreateNote}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-dashed border-border-secondary text-text-muted hover:text-text-primary hover:border-text-primary transition-colors"
        >
          <Plus size={16} /> <span className="text-sm font-medium">New</span>
        </button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {editingId ? (
          <div className="flex flex-col flex-1 min-h-0">
            <input
              placeholder="Note Title..."
              value={currentNote?.title || ""}
              onChange={(e) =>
                updateNote(editingId, {
                  title: e.target.value,
                })
              }
              className="w-full text-2xl font-bold bg-transparent outline-none mb-4 text-text-primary placeholder:text-text-muted/50 shrink-0"
            />

            <MenuBar editor={editor} />

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar cursor-text min-h-0">
              <EditorContent editor={editor} className="min-h-full pb-4" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-60 mt-10">
            <div className="w-16 h-16 bg-background-secondary rounded-full flex items-center justify-center mb-4">
              <Quote size={24} className="text-text-muted" />
            </div>
            <p className="text-sm text-text-primary font-medium">
              No note selected
            </p>
            <p className="text-xs text-text-muted mt-1 max-w-[200px]">
              Select a note from the tabs above or create a new one to start
              writing.
            </p>
          </div>
        )}
      </div>

      {editingId && (
        <div className="pt-3 mt-2 border-t border-border-secondary shrink-0">
          <button
            onClick={() => handleDelete(editingId)}
            className="text-sm text-button-danger flex items-center gap-1.5 hover:bg-button-danger/10 px-2 py-1.5 rounded-md transition"
          >
            <Trash2 size={16} /> Delete Note
          </button>
        </div>
      )}
    </div>
  );
};

export default Notes;

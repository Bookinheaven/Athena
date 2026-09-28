import { useState, useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading2,
  Heading3,
  Pin,
  Trash2,
  Check,
  Loader2,
  AlertCircle,
  Tag,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Input } from "@/components/ui/input.jsx";

const EditorToolbar = ({ editor }) => {
  if (!editor) return null;

  const ToolButton = ({ onClick, isActive, children, title }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-md text-xs transition-colors ${
        isActive
          ? "bg-primary/20 text-primary font-semibold"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-1 bg-secondary/30 rounded-xl border border-border/40 w-fit">
      <ToolButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-3.5 h-3.5" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-3.5 h-3.5" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        title="Strikethrough"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </ToolButton>

      <div className="w-px h-4 bg-border/60 mx-1" />

      <ToolButton
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        isActive={editor.isActive("heading", { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="w-3.5 h-3.5" />
      </ToolButton>
      <ToolButton
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
        isActive={editor.isActive("heading", { level: 3 })}
        title="Heading 3"
      >
        <Heading3 className="w-3.5 h-3.5" />
      </ToolButton>

      <div className="w-px h-4 bg-border/60 mx-1" />

      <ToolButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        title="Bullet List"
      >
        <List className="w-3.5 h-3.5" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        title="Numbered List"
      >
        <ListOrdered className="w-3.5 h-3.5" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        title="Quote"
      >
        <Quote className="w-3.5 h-3.5" />
      </ToolButton>
      <ToolButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive("codeBlock")}
        title="Code Block"
      >
        <Code className="w-3.5 h-3.5" />
      </ToolButton>
    </div>
  );
};

export default function NoteEditor({
  note,
  goals = [],
  tasks = [],
  onUpdateNote,
  onDeleteNote,
}) {
  const [title, setTitle] = useState(note?.title || "");
  const [saveStatus, setSaveStatus] = useState("saved"); // 'saved' | 'saving' | 'unsaved' | 'error'
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const debounceTimer = useRef(null);
  const noteId = note?._id || note?.id;

  const performSave = useCallback(
    async (newTitle, newContent) => {
      if (!noteId) return;
      setSaveStatus("saving");
      try {
        await onUpdateNote(
          {
            title: newTitle.trim(),
            content: newContent,
          },
          noteId
        );
        setSaveStatus("saved");
      } catch (err) {
        console.error("Failed to auto-save note:", err);
        setSaveStatus("error");
      }
    },
    [noteId, onUpdateNote]
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Write your note here...",
      }),
    ],
    content: note?.content || "",
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert prose-sm focus:outline-none min-h-[360px] max-w-none text-foreground py-2 leading-relaxed",
      },
    },
    onUpdate: ({ editor }) => {
      setSaveStatus("unsaved");
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        performSave(title, editor.getHTML());
      }, 1000);
    },
  });

  // Sync editor when switching notes
  useEffect(() => {
    setTitle(note?.title || "");
    setSaveStatus("saved");
    setShowDeleteConfirm(false);
    if (editor && note) {
      const incoming = note.content || "";
      if (editor.getHTML() !== incoming) {
        editor.commands.setContent(incoming);
      }
    }
  }, [noteId, editor]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setSaveStatus("unsaved");
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      performSave(newTitle, editor ? editor.getHTML() : note.content);
    }, 1000);
  };

  const handleTitleBlur = () => {
    if (saveStatus === "unsaved") {
      performSave(title, editor ? editor.getHTML() : note.content);
    }
  };

  const handlePinToggle = async () => {
    try {
      await onUpdateNote({ pinned: !note.pinned }, noteId);
    } catch (err) {
      console.error("Failed to toggle pin:", err);
    }
  };

  const linkedGoal = goals.find((g) => g._id === note.goal);
  const linkedTask = tasks.find((t) => t._id === (note.task || note.taskId));

  return (
    <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden flex flex-col h-full min-h-[520px]">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-border/50 bg-secondary/10">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePinToggle}
            className={`p-1.5 rounded-lg border transition-colors ${
              note.pinned
                ? "bg-primary/10 text-primary border-primary/20"
                : "text-muted-foreground hover:text-foreground border-border"
            }`}
            title={note.pinned ? "Unpin note" : "Pin note to top"}
          >
            <Pin className="w-3.5 h-3.5 fill-current" />
          </button>

          {linkedGoal && (
            <Badge variant="secondary" className="text-xs font-medium gap-1">
              <Target className="w-3 h-3 text-muted-foreground" />
              {linkedGoal.title}
            </Badge>
          )}

          {linkedTask && (
            <Badge variant="outline" className="text-xs font-medium gap-1">
              <Tag className="w-3 h-3 text-muted-foreground" />
              {linkedTask.title}
            </Badge>
          )}
        </div>

        {/* Save Status & Actions */}
        <div className="flex items-center gap-3">
          <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 select-none">
            {saveStatus === "saving" && (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-primary" />
                <span>Saving...</span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                <span className="text-muted-foreground/70">Saved</span>
              </>
            )}
            {saveStatus === "unsaved" && (
              <span className="text-amber-500">Unsaved changes</span>
            )}
            {saveStatus === "error" && (
              <>
                <AlertCircle className="w-3 h-3 text-destructive" />
                <span className="text-destructive">Save failed</span>
              </>
            )}
          </div>

          {/* Delete Action */}
          {showDeleteConfirm ? (
            <div className="flex items-center gap-1.5 bg-destructive/10 border border-destructive/20 px-2 py-1 rounded-xl">
              <span className="text-xs text-destructive font-medium">
                Delete?
              </span>
              <Button
                size="sm"
                variant="destructive"
                className="h-6 px-2 text-xs rounded-lg font-semibold"
                onClick={() => onDeleteNote(noteId)}
              >
                Yes
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-1.5 text-xs rounded-lg"
                onClick={() => setShowDeleteConfirm(false)}
              >
                No
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-muted-foreground hover:text-destructive rounded-lg"
              title="Delete note"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Writing Surface */}
      <div className="p-6 sm:p-8 flex-1 flex flex-col space-y-4">
        {/* Note Title Input */}
        <Input
          placeholder="Note title..."
          value={title}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          className="text-xl sm:text-2xl font-bold tracking-tight border-0 px-0 h-10 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/40 bg-transparent"
        />

        {/* TipTap Toolbar */}
        <EditorToolbar editor={editor} />

        {/* Rich Text Editor Body */}
        <div className="flex-1 min-h-[300px] cursor-text">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}

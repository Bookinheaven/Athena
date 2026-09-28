import { useState, useMemo } from "react";
import {
  FileText,
  Plus,
  Pin,
  Search,
  Target,
  Sparkles,
  NotebookPen,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Input } from "@/components/ui/input.jsx";
import NoteEditor from "./NoteEditor.jsx";

const getPlainTextPreview = (html = "") => {
  if (!html) return "";
  const clean = html.replace(/<[^>]*>?/gm, "").replace(/&nbsp;/g, " ").trim();
  return clean;
};

export default function NotesView({
  notes = [],
  goals = [],
  tasks = [],
  selectedNoteId = null,
  onSelectNote,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  onOpenCreateNote,
}) {
  const [search, setSearch] = useState("");

  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        const matchesTitle = n.title?.toLowerCase().includes(q);
        const plainContent = getPlainTextPreview(n.content).toLowerCase();
        const matchesContent = plainContent.includes(q);
        return matchesTitle || matchesContent;
      })
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (
          new Date(b.updatedAt || b.createdAt || 0) -
          new Date(a.updatedAt || a.createdAt || 0)
        );
      });
  }, [notes, search]);

  const selectedNote = useMemo(() => {
    if (!selectedNoteId) return null;
    return notes.find((n) => (n._id || n.id) === selectedNoteId) || null;
  }, [notes, selectedNoteId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Planning Notes
          </h2>
          <p className="text-sm text-muted-foreground">
            Capture context, scratchpads, and references for your tasks and goals.
          </p>
        </div>

        <Button
          size="sm"
          onClick={onOpenCreateNote}
          className="gap-1.5 rounded-xl font-semibold shadow-xs"
        >
          <Plus className="w-4 h-4" />
          New Note
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Notes List */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>

          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {filteredNotes.length > 0 ? (
              filteredNotes.map((note) => {
                const noteId = note._id || note.id;
                const isSelected = noteId === selectedNoteId;
                const goalObj = goals.find((g) => g._id === note.goal);
                const previewText = getPlainTextPreview(note.content);

                return (
                  <div
                    key={noteId}
                    onClick={() => onSelectNote(noteId)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 space-y-2 ${
                      isSelected
                        ? "ring-2 ring-primary border-primary bg-primary/5 shadow-xs"
                        : "bg-card border-border hover:border-border/80 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-card-foreground line-clamp-1">
                        {note.title || "Untitled Note"}
                      </h4>
                      {note.pinned && (
                        <Pin className="w-3.5 h-3.5 text-primary shrink-0 fill-current" />
                      )}
                    </div>

                    {previewText ? (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {previewText}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground/50 italic">
                        Empty note
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      {goalObj && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 rounded font-medium"
                        >
                          {goalObj.title}
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground/70">
                        {new Date(
                          note.updatedAt || note.createdAt || Date.now()
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <Card className="border-border bg-card shadow-xs rounded-2xl">
                <CardContent className="p-8 text-center space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {search ? "No matching notes" : "No notes yet"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {search
                        ? "Try searching with different keywords."
                        : "Capture thoughts, research, or task context."}
                    </p>
                  </div>
                  {!search && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl font-medium text-xs gap-1.5"
                      onClick={onOpenCreateNote}
                    >
                      <Plus className="w-3.5 h-3.5" /> Create your first note
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Right Column: Note Editor */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {selectedNote ? (
            <NoteEditor
              key={selectedNote._id || selectedNote.id}
              note={selectedNote}
              goals={goals}
              tasks={tasks}
              onUpdateNote={onUpdateNote}
              onDeleteNote={onDeleteNote}
            />
          ) : (
            <Card className="border-border/60 bg-card/40 border-dashed rounded-2xl min-h-[460px] flex items-center justify-center">
              <CardContent className="p-12 text-center text-xs text-muted-foreground space-y-3 max-w-sm">
                <div className="w-12 h-12 rounded-2xl bg-secondary/60 text-muted-foreground flex items-center justify-center mx-auto">
                  <NotebookPen className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground text-sm">
                    No note selected
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Select a note from the left to view or edit, or create a new
                    note to start writing.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="rounded-xl font-semibold text-xs gap-1.5"
                  onClick={onOpenCreateNote}
                >
                  <Plus className="w-3.5 h-3.5" /> New Note
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

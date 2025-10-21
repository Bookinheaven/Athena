import { useState, useMemo } from "react";
import { X, Edit3, Trash2, Plus, Link, ChevronDown } from "lucide-react";

const Notes = ({ show, onClose, notes = [], setNotes, todos = [] }) => {
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState(null);

  const selectedTask = useMemo(
    () => todos.find((todo) => String(todo.id) === String(selectedTaskId)),
    [selectedTaskId, todos]
  );
  const filteredNotes = useMemo(() => {
    if (selectedTaskId) {
      return notes.filter((n) => String(n.taskId) === String(selectedTaskId));
    }
    return notes.filter((n) => !n.taskId);
  }, [notes, selectedTaskId]);

  const noteCounts = useMemo(() => {
    return notes.reduce((acc, note) => {
      const key = note.taskId || 'general';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [notes]);

  if (!show) {
    return null;
  }

  const handleSaveNote = () => {
    if (!newText.trim()) return;
    if (editingId) {
      setNotes((prev) =>
        prev.map((n) => (n.id === editingId ? { ...n, text: newText } : n))
      );
    } else {
      const newNote = {
        id: Date.now(),
        text: newText,
        taskId: selectedTaskId ? Number(selectedTaskId) : null,
        createdAt: new Date().toISOString(),
      };
      setNotes((prev) => [...prev, newNote]);
    }
    setNewText("");
    setEditingId(null);
  };

  const handleDelete = (id) => setNotes((prev) => prev.filter((n) => n.id !== id));

  const handleEdit = (note) => {
    setEditingId(note.id);
    setNewText(note.text);
  };

  const handleDeleteGroup = () => {
    const contextName = selectedTask ? `"${selectedTask.text}"` : "General Notes";
    if (window.confirm(`Are you sure you want to delete all notes for ${contextName}?`)) {
        if (selectedTaskId) {
            setNotes(prev => prev.filter(n => String(n.taskId) !== String(selectedTaskId)));
        } else {
            setNotes(prev => prev.filter(n => n.taskId)); 
        }
    }
  };

  return (
    <div className="min-w-md max-w-md h-170 flex flex-col p-6 bg-card-background border border-card-border rounded-2xl shadow-card-shadow relative overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-text-primary truncate">
          {selectedTask ? `Notes for: ${selectedTask.text}` : "General Notes"}
        </h3>
        <button onClick={onClose} className="p-2 rounded-lg text-text-secondary hover:text-text-primary transition shadow-none hover:scale-125">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="task-selector" className="flex items-center gap-2 text-sm font-medium text-text-secondary">
            <Link size={14} /> Select Context
          </label>
          {filteredNotes.length > 0 && (
            <button onClick={handleDeleteGroup} className="flex items-center gap-1.5 text-xs text-button-danger font-semibold hover:opacity-80 shadow-none hover:scale-102">
                <Trash2 size={14} />
                Delete All
            </button>
          )}
        </div>
        <div className="relative w-full">
          <select
            id="task-selector"
            value={selectedTaskId || ""}
            onChange={(e) => setSelectedTaskId(e.target.value || null)}
            className="
              w-full appearance-none rounded-lg border border-input-border bg-input-background
              px-4 py-2.5  /* Adjust padding */
              text-sm text-text-primary placeholder-text-muted /* Style placeholder/default text */
              transition duration-200 ease-in-out
              focus:border-input-focus focus:outline-none focus:ring-2 focus:ring-input-focus/50 /* Enhanced focus */
              hover:border-input-border-hover /* Subtle hover */
              cursor-pointer /* Indicate it's clickable */
            "
          >
              <option value="" className="text-text-muted">
                General Notes [{noteCounts['general'] || 0}]
              </option>

              {todos.map((todo) => (
                <option key={todo.id} value={todo.id} className="text-text-primary bg-input-background"> 
                  {todo.text} [{noteCounts[todo.id] || 0}]
                </option>
              ))}
            </select>

            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-muted">
              <ChevronDown className="h-4 w-4 fill-current" />
            </div>
          </div>
      </div>
      
      <div className="flex gap-3 mb-4 p-3 rounded-xl border border-border-secondary bg-background-primary-contrast">
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder={editingId ? "Update your note..." : "Add a new note..."}
          className="flex-1 p-2 rounded-md bg-input-background border border-input-border focus:ring-2 focus:ring-input-focus"
        />
        <button
          onClick={handleSaveNote}
          className="px-4 py-2 bg-button-primary text-button-primary-text rounded-lg hover:bg-button-primary-hover transition font-semibold"
        >
          {editingId ? <Edit3 size={18} /> : <Plus size={18} />}
        </button>
      </div>

      <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-3">
        {filteredNotes.length === 0 ? (
          <p className="text-center text-text-muted mt-10">No notes here yet.</p>
        ) : (
          filteredNotes.map((note) => (
            <div key={note.id} className="p-3 rounded-lg bg-background-secondary border border-border-secondary">
              <div className="flex justify-between items-start gap-3">
                <p className="flex-1 font-medium text-text-primary break-words">{note.text}</p>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => handleEdit(note)} className="p-1 rounded text-text-muted hover:text-text-accent"><Edit3 size={16} /></button>
                  <button onClick={() => handleDelete(note.id)} className="p-1 rounded text-text-muted hover:text-button-danger"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notes;
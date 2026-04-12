import { Link } from "react-router-dom";
import { ArrowLeft, Clock, Target, CalendarDays, Loader2, CheckCircle, X, FileText, CheckCircle2, Zap, Coffee, Maximize2 } from "lucide-react";
import sessionService from "../../../../services/sessionService.js";
import { useNotes } from "../focus/hooks/useNotes.js";
import { useEffect, useState } from "react";

const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) + " • " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

export default function SessionHistory() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);

  const { notes } = useNotes();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await sessionService.getSessions();
        if (Array.isArray(data)) {
          setSessions(data);
        } else if (data && Array.isArray(data.sessions)) {
          setSessions(data.sessions);
        }
      } catch (err) {
        console.error("Failed to load sessions:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSessions();
  }, []);

  return (
    <div className="min-h-screen bg-background-color text-text-primary p-4 md:p-8 overflow-x-hidden">
      <div className="max-w-[1200px] mx-auto">
        <header className="mb-8">
          <Link to="/dashboard" className="text-text-muted hover:text-button-primary transition-colors flex items-center gap-2 mb-4 font-bold text-sm w-fit">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-button-primary/10 rounded-xl">
              <CalendarDays className="text-button-primary w-6 h-6" />
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-button-primary/80">Archived Work</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Session History</h1>
          <p className="text-text-muted font-medium mt-2 text-base">Review your past performance and consistency.</p>
        </header>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-button-primary w-10 h-10" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-card-background border border-card-border p-10 rounded-3xl shadow-xl text-center flex flex-col items-center justify-center py-20">
            <Target className="w-16 h-16 text-text-muted/30 mb-4" />
            <h3 className="text-xl font-bold text-text-primary mb-2">No Past Sessions!</h3>
            <p className="text-text-muted">Once you start completing Focus Sessions, they will appear right here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session, i) => {
              const displayStatus = session.completionType || session.status;
              const isSuccess = displayStatus === "completed" || (session.status === "completed" && (!session.completionType || session.completionType === "completed"));
              const isSkipped = displayStatus === "skipped";

              return (
                <div
                  key={session._id || i}
                  onClick={() => setSelectedSession(session)}
                  className="bg-card-background border border-card-border p-5 rounded-2xl shadow-lg flex flex-col hover:border-button-primary/50 transition-all hover:-translate-y-1 cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg transition-colors ${isSuccess ? 'bg-button-success/10 text-button-success group-hover:bg-button-success/20' : isSkipped ? 'bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20' : 'bg-button-primary/10 text-button-primary group-hover:bg-button-primary/20'}`}>
                        {isSuccess ? <CheckCircle size={18} /> : isSkipped ? <Loader2 size={18} /> : <Clock size={18} />}
                      </div>
                      <h3 className="font-bold text-text-primary truncate" title={session.title}>{session.title || "Untitled Session"}</h3>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 bg-background-secondary rounded-md border border-border-secondary text-text-muted shrink-0 text-right">
                      {formatTime(session.duration)}
                    </span>
                  </div>

                  <div className="mt-auto pt-4 border-t border-card-border flex justify-between items-end">
                    <div>
                      <p className="text-xs font-medium text-text-muted flex items-center gap-2">
                        <CalendarDays size={12} /> {formatDate(session.createdAt)}
                      </p>
                      {session.sessionStats?.interruptions > 0 && (
                        <p className="text-[10px] font-bold text-red-500/70 mt-1 uppercase tracking-widest">
                          {session.sessionStats.interruptions} Interruptions
                        </p>
                      )}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Maximize2 size={16} className="text-text-muted" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedSession(null)}>
          <div
            className="bg-card-background border border-card-border rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "slide-up 0.3s ease-out forwards" }}
          >
            <div className="p-6 md:p-8 flex items-center justify-between border-b border-card-border sticky top-0 bg-card-background/90 backdrop-blur z-10">
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Session Details</div>
                <h2 className="text-2xl font-black text-text-primary">{selectedSession.title || "Quick Session"}</h2>
                <div className="text-xs text-text-secondary font-medium mt-1">
                  {formatDate(selectedSession.createdAt)}
                </div>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="w-10 h-10 bg-background-secondary rounded-full flex justify-center items-center text-text-muted hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-8 flex-grow">

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-background-secondary p-4 rounded-2xl flex flex-col items-center justify-center border border-border-secondary">
                  <Clock className="text-button-primary mb-2 w-6 h-6" />
                  <span className="text-2xl font-black text-text-primary">{formatTime(selectedSession.duration)}</span>
                  <span className="text-[10px] uppercase font-bold text-text-muted tracking-wide mt-1">Duration</span>
                </div>
                {selectedSession.sessionStats?.focusSegmentsCompleted !== undefined && (
                  <div className="bg-background-secondary p-4 rounded-2xl flex flex-col items-center justify-center border border-border-secondary">
                    <Zap className="text-amber-500 mb-2 w-6 h-6" />
                    <span className="text-2xl font-black text-text-primary">{selectedSession.sessionStats.focusSegmentsCompleted}</span>
                    <span className="text-[10px] uppercase font-bold text-text-muted tracking-wide mt-1">Focus Segments</span>
                  </div>
                )}
                {selectedSession.sessionStats?.breakSegmentsCompleted !== undefined && (
                  <div className="bg-background-secondary p-4 rounded-2xl flex flex-col items-center justify-center border border-border-secondary">
                    <Coffee className="text-blue-500 mb-2 w-6 h-6" />
                    <span className="text-2xl font-black text-text-primary">{selectedSession.sessionStats.breakSegmentsCompleted}</span>
                    <span className="text-[10px] uppercase font-bold text-text-muted tracking-wide mt-1">Breaks</span>
                  </div>
                )}
                <div className="bg-background-secondary p-4 rounded-2xl flex flex-col items-center justify-center border border-border-secondary">
                  <CheckCircle2 className={selectedSession.completionType === 'completed' || (selectedSession.status === 'completed' && !selectedSession.completionType) ? 'text-button-success' : selectedSession.completionType === 'skipped' ? 'text-amber-500' : 'text-text-muted'} mb-2 w-6 h-6 />
                  <span className="text-lg font-black text-text-primary capitalize">{selectedSession.completionType || selectedSession.status}</span>
                  <span className="text-[10px] uppercase font-bold text-text-muted tracking-wide mt-1">Outcome</span>
                </div>
              </div>

              {selectedSession.sessionFeedback && (selectedSession.sessionFeedback.mood || selectedSession.sessionFeedback.focus) && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3 flex items-center border-b border-card-border pb-2">User Feedback</h4>
                  <div className="flex gap-6 mt-4">
                    {selectedSession.sessionFeedback.focus && (
                      <div>
                        <div className="text-xs text-text-secondary mb-1">Focus Quality</div>
                        <div className="text-lg font-black flex gap-1 items-center">
                          <Target size={16} className="text-button-primary" /> {selectedSession.sessionFeedback.focus} / 5
                        </div>
                      </div>
                    )}
                    {selectedSession.sessionFeedback.mood && (
                      <div>
                        <div className="text-xs text-text-secondary mb-1">Energy / Mood</div>
                        <div className="text-lg font-black flex gap-1 items-center">
                          <span>🎭</span> {selectedSession.sessionFeedback.mood} / 5
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedSession.sessionFeedback.distractions && (
                    <div className="mt-4 bg-background-secondary p-4 rounded-xl border border-border-secondary text-sm">
                      <span className="font-bold text-text-muted uppercase text-[10px] block mb-1">Distractions List:</span>
                      {selectedSession.sessionFeedback.distractions}
                    </div>
                  )}
                </div>
              )}

              {selectedSession.taskIds && selectedSession.taskIds.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3 flex items-center gap-2 border-b border-card-border pb-2">
                    <FileText size={14} /> Notes Created
                  </h4>
                  {notes.filter(n => selectedSession.taskIds.includes(n.taskId)).length > 0 ? (
                    <div className="space-y-3 mt-4">
                      {notes.filter(n => selectedSession.taskIds.includes(n.taskId)).map(note => (
                        <div key={note.id} className="bg-background-secondary p-4 rounded-xl border border-border-secondary">
                          <h5 className="font-bold text-sm mb-2">{note.title || "Note"}</h5>
                          <p className="text-xs text-text-secondary whitespace-pre-wrap">
                            {typeof note.content === 'object' ? JSON.stringify(note.content?.content?.[0]?.content?.[0]?.text || "Empty Rich Text") : note.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-muted italic mt-4">No notes created during this session.</p>
                  )}
                </div>
              )}

              {selectedSession.todos && selectedSession.todos.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3 flex items-center gap-2 border-b border-card-border pb-2">
                    <CheckCircle2 size={14} /> Session Tasks
                  </h4>
                  <div className="space-y-2 mt-4">
                    {selectedSession.todos.map((todo, idx) => (
                      <div key={idx} className={`p-3 rounded-xl border flex items-center gap-3 ${todo.status === 'true' || todo.status === true ? 'bg-button-success/10 border-button-success/30' : 'bg-background-secondary border-border-secondary'}`}>
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${todo.status === 'true' || todo.status === true ? 'bg-button-success border-button-success' : 'border-text-muted'}`} />
                        <span className={`text-sm ${todo.status === 'true' || todo.status === true ? 'line-through text-text-muted' : 'text-text-primary font-medium'}`}>{todo.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

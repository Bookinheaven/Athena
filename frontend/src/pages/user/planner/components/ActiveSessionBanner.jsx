import { useNavigate } from "react-router-dom";
import { Play, OctagonX, ExternalLink } from "lucide-react";
import sessionService from "../../../../../services/sessionService";

export default function ActiveSessionBanner({ activeSession, setActiveSession }) {
  const navigate = useNavigate();

  if (!activeSession) return null;

  const handleAbandon = async () => {
    if (window.confirm("Are you sure you want to abandon this session? Your current progress will not be saved as a completed task.")) {
      try {
        const sessionId = activeSession.sessionId || activeSession._id;
        await sessionService.updateProgress({ 
          sessionId, 
          status: "skipped" 
        });
        setActiveSession(null);
      } catch (e) {
        console.error("Failed to abandon session:", e);
      }
    }
  };

  return (
    <div className="mb-6 p-4 rounded-3xl bg-button-primary/[0.08] border border-button-primary/20 backdrop-blur-md flex flex-col sm:flex-row gap-4 items-center justify-between shadow-xl shadow-button-primary/5 shrink-0 transition-all animate-in fade-in slide-in-from-top-2">
      
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <div className="relative flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-button-primary animate-pulse shrink-0 relative z-10" />
          <div className="absolute inset-0 w-3 h-3 rounded-full bg-button-primary animate-ping opacity-40" />
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-button-primary tracking-widest uppercase opacity-80">
              Live Focus Mode
            </span>
            {activeSession.taskIds?.length > 1 && (
                <span className="bg-button-primary/20 text-button-primary text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase">
                    Batch
                </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-text-primary leading-none mt-1">
            {activeSession.title || "Untitled Session"}
          </h3>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <button
          onClick={handleAbandon}
          className="group flex items-center gap-1.5 bg-background-color/50 text-button-danger text-[11px] font-bold px-4 py-2 rounded-xl border border-button-danger/20 hover:bg-button-danger hover:text-white transition-all active:scale-95"
        >
          <OctagonX size={14} className="group-hover:rotate-90 transition-transform duration-300" />
          Abandon
        </button>

        <button
          onClick={() => navigate("/focus-page")}
          className="flex items-center gap-2 bg-button-primary text-white text-[11px] font-black px-5 py-2.5 rounded-xl shadow-lg shadow-button-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Play size={14} fill="currentColor" />
          Resume Session
          <ExternalLink size={12} className="opacity-50" />
        </button>
      </div>
    </div>
  );
}   
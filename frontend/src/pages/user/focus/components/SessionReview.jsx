import { Smartphone, MessageSquare, Users, Music } from "lucide-react";

const commonDistractions = [
  { label: "Phone", icon: Smartphone },
  { label: "Messages", icon: MessageSquare },
  { label: "People", icon: Users },
  { label: "Noise", icon: Music },
];

export const SessionReview = ({ reviewData, onUpdate, onDistractionToggle, onNewSession }) => {
  return (
    <div className="min-w-md max-w-md h-170 flex flex-col p-6 rounded-2xl shadow-lg bg-card-background border border-card-border animate-fade-in z-10 lg:max-w-sm">
      <h3 className="text-2xl font-bold text-text-primary mb-6 text-center">
        Session Complete! <span className="pluses">🎉</span>
      </h3>
      <p className="text-center text-text-secondary mb-8">How did it go overall?</p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-3 text-center">
            Your Mood
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[
              { level: 1, emoji: "😞" },
              { level: 2, emoji: "😐" },
              { level: 3, emoji: "🙂" },
              { level: 4, emoji: "😊" },
              { level: 5, emoji: "🤩" },
            ].map(({ level, emoji }) => (
              <button
                key={level}
                onClick={() => onUpdate("mood", level)}
                className={`p-2 text-2xl rounded-lg transition-all duration-200 ${
                  reviewData.mood === level
                    ? "bg-button-primary scale-110 shadow-lg"
                    : "bg-background-color hover:bg-card-border"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-3 text-center">
            Your Focus
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => onUpdate("focus", level)}
                className={`p-2 rounded-lg font-bold transition-all duration-200 ${
                  reviewData.focus === level
                    ? "bg-button-primary text-button-primary-text scale-110 shadow-lg"
                    : "bg-background-color text-text-primary hover:bg-card-border"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-3 text-center">
            What distracted you?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            {commonDistractions.map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => onDistractionToggle(label)}
                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors ${
                  (reviewData.distractions || "").toLowerCase().includes(label.toLowerCase())
                    ? "bg-button-primary text-button-primary-text"
                    : "bg-background-color text-text-secondary hover:bg-card-border"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
          <input
            type="text"
            value={reviewData.distractions || ""}
            onChange={(e) => onUpdate("distractions", e.target.value)}
            placeholder="e.g., email, hunger..."
            className="w-full p-2 rounded-md bg-background-color border border-card-border text-text-primary focus:ring-2 focus:ring-button-primary"
          />
        </div>
      </div>
      
      <button
        onClick={onNewSession}
        className="w-full mt-8 py-3 px-4 rounded-lg bg-button-primary text-button-primary-text font-semibold hover:bg-button-primary-hover transition-colors shadow-lg"
      >
        Submit
      </button>
    </div>
  );
};
import { Bug, TriangleAlert, CheckCircle } from "lucide-react";

export default function TodayStatusBadge({ state, timeLeft = 0 }) {
  const config = {
    green: {
      text: "Good job",
      icon: CheckCircle,
      className: "text-green-400",
    },
    yellow: {
      text: "Almost there",
      icon: TriangleAlert,
      className: "text-yellow-400",
    },
    red: {
      text: "Streak at risk",
      icon: Bug,
      className: "text-red-400",
    },
  };

  const badge = config[state];
  if (!badge) return null;

  const Icon = badge.icon;

  return (
    <span
      className={`flex items-center gap-2 text-sm font-medium ${badge.className}`}
    >
      <Icon size={16} />

      <span>
        {badge.text}
        {state === "yellow" && timeLeft > 0 && (
          <span className="text-muted-foreground">
            {" "}
            — {timeLeft} min to protect streak
          </span>
        )}
      </span>
    </span>
  );
}

export default function StreakRing({ streakRate, state }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const clampedRate = Math.min(Math.max(streakRate, 0), 1);
  const progress = clampedRate * circumference;

  const colorMap = {
    green: "stroke-green-500",
    yellow: "stroke-yellow-400",
    red: "stroke-red-400",
  };

  const ringColor = colorMap[state] || "stroke-stroke-circle/20";

  return (
    <svg
      viewBox="0 0 100 100"
      className="w-32 h-32 md:w-36 md:h-36"
    >
      <g transform="rotate(-90 50 50)">
        <circle
          cx="50"
          cy="50"
          r={radius}
          strokeWidth="8"
          className="stroke-stroke-circle/60"
          fill="none"
        />

        <circle
          cx="50"
          cy="50"
          r={radius}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className={`${ringColor} transition-[stroke-dashoffset] duration-700 ease-out`}
          fill="none"
        />
      </g>

      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-text-primary text-base font-semibold"
      >
        {Math.round(clampedRate * 100)}%
      </text>
    </svg>
  );
}

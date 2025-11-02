import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import ChartSkeleton from "../skeletons/ChartSkeleton.jsx";
import { useState, useEffect } from "react";
import CustomTooltip from "../CustomTooltip.jsx";

const FocusMoodRadarChart = ({ data = [], isLoading = false }) => {
  const [isChartReady, setIsChartReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsChartReady(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="rounded-2xl p-6 shadow-lg card-hover bg-card-background border border-card-border hover:border-blue-400">
      <h3 className="text-lg font-bold mb-4 text-text-primary">
        Average Focus & Mood
      </h3>
      {isLoading ? (
        <div className="h-56 w-full flex items-center justify-center">
          <p className="text-text-muted">No data available.</p>
        </div>
      ) : !isChartReady ? (
        <ChartSkeleton />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
            <PolarGrid stroke="var(--color-border-secondary)" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} />
            <Radar
              name="Rating"
              dataKey="value"
              stroke="var(--color-button-primary)"
              fill="var(--color-button-primary)"
              fillOpacity={0.6}
              strokeWidth={2}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default FocusMoodRadarChart;

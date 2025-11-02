import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import CustomTooltip from "../CustomTooltip.jsx";
import ChartSkeleton from "../skeletons/ChartSkeleton.jsx";
import { useState, useEffect } from "react";

const MoodFocusTrendChart = ({ data = [], isLoading = false }) => {
  const [isChartReady, setIsChartReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsChartReady(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="rounded-2xl p-6 shadow-lg card-hover bg-card-background border border-card-border hover:border-blue-400">
      <h3 className="text-xl font-bold mb-6 text-text-primary">
        Mood & Focus Trends
      </h3>

      {isLoading ? (
        <div className="h-64 w-full flex items-center justify-center">
          <p className="text-text-muted">Loading trend data...</p>
        </div>
      ) : !isChartReady ? (
        <ChartSkeleton />
      ) : (
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border-secondary)"
                opacity={0.3}
              />
              <XAxis
                dataKey="day"
                tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
              />
              <YAxis
                domain={[0, 5]}
                tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: "var(--color-text-primary)" }} />
              <Line
                type="monotone"
                dataKey="mood"
                stroke="#f59e0b"
                strokeWidth={3}
                name="Mood"
                dot={{ fill: "#f59e0b", r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="focus"
                stroke="#a855f7"
                strokeWidth={3}
                name="Focus"
                dot={{ fill: "#a855f7", r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default MoodFocusTrendChart;

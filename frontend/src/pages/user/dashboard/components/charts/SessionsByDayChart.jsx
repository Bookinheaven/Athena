import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import CustomTooltip from "../CustomTooltip.jsx";
import ChartSkeleton from "../skeletons/ChartSkeleton";
import { useEffect, useState } from "react";

const SessionsByDayChart = ({ data = [], isLoading = false }) => {
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
        Sessions by Day
      </h3>
      {isLoading ? (
        <div className="h-72 w-full flex items-center justify-center">
          <p className="text-text-muted">Loading session data...</p>
        </div>
      ) : !isChartReady ? (
        <ChartSkeleton />
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
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
              <YAxis tick={{ fill: "var(--color-text-muted)", fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="sessions"
                fill="var(--color-button-primary)"
                radius={[8, 8, 0, 0]}
                name="Sessions"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`hsl(${220 + index * 10}, 70%, ${50 + index * 3}%)`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
export default SessionsByDayChart;

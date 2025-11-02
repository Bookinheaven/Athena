import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import CustomTooltip from "../CustomTooltip";
import ChartSkeleton from "../skeletons/ChartSkeleton";
import { useEffect, useState } from "react";

const DailyComparisonChart = ({ data, isLoading }) => {
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
        This Week vs Last Week
      </h3>
      {isLoading ? (
        <div className="h-72 w-full flex items-center justify-center">
          <p className="text-text-muted">Loading comparison data...</p>
        </div>
      ) : !isChartReady ? (
        <ChartSkeleton/>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
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
                tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
                tickFormatter={(value) => `${value}m`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: "var(--color-text-primary)" }} />
              <Bar
                dataKey="lastWeek"
                fill="#94a3b8"
                radius={[8, 8, 0, 0]}
                name="Last Week"
              />
              <Line
                type="monotone"
                dataKey="thisWeek"
                stroke="var(--color-button-primary)"
                strokeWidth={3}
                name="This Week"
                dot={{ fill: "var(--color-button-primary)", r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
export default DailyComparisonChart;

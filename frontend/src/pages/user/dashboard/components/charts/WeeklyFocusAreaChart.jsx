import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import CustomTooltip from "../CustomTooltip.jsx";
import ChartSkeleton from "../skeletons/ChartSkeleton.jsx";
import { useState, useEffect } from "react";

const WeeklyFocusAreaChart = ({ data = [], isLoading = false }) => {
  const [isChartReady, setIsChartReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsChartReady(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="rounded-2xl p-6 shadow-lg card-hover h-full bg-card-background border border-card-border hover:border-blue-400">
      <h3 className="text-xl font-bold mb-6 text-text-primary">
        Weekly Focus Trends
      </h3>

      {isLoading || data.length === 0 ? (
        <div className="h-72 w-full flex items-center justify-center">
          <p className="text-text-muted">No focus trend data yet.</p>
        </div>
      ) : !isChartReady ? (
        <ChartSkeleton/>
      ) : (
        <div className="w-full" style={{ minHeight: "18rem", height: "18rem" }}>
          <ResponsiveContainer minHeight={10} minWidth={10} width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-button-primary)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-button-primary)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>

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
                tickFormatter={(value) => `${(value / 60).toFixed(1)}h`}
                tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="focusTime"
                name="Focus Time (min)"
                stroke="var(--color-button-primary)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorFocus)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default WeeklyFocusAreaChart;

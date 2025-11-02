import { BarChart, Bar, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartSkeleton from "../skeletons/ChartSkeleton";
import { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";
import CustomTooltip from "../CustomTooltip";

const TopDistractionsChart = ({ data = [], isLoading = false }) => {
  const [isChartReady, setIsChartReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsChartReady(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const chartData =
    data?.map(([name, count]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count: count,
    })) || [];

  const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899"];

  return (
    <div className="h-full flex flex-col rounded-2xl p-6 shadow-lg card-hover bg-card-background border border-card-border hover:border-blue-400">
      <h3 className="text-lg font-bold mb-5 text-text-primary">
        Top Distractions
      </h3>
      {isLoading ? (
        <div className="space-y-3 pt-2">
          <div className="h-6 w-3/4 rounded-lg animate-pulse bg-background-secondary"></div>
          <div className="h-6 w-1/2 rounded-lg animate-pulse bg-background-secondary"></div>
          <div className="h-6 w-2/3 rounded-lg animate-pulse bg-background-secondary"></div>
        </div>
      ) : !isChartReady ? (
        <ChartSkeleton />
      ) : chartData.length > 0 ? (
        <div style={{ height: `${Math.max(chartData.length * 50, 150)}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 0, right: 40, top: 5, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border-secondary)"
                horizontal={false}
                opacity={0.3}
              />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "var(--color-text-secondary)",
                  fontSize: 13,
                  fontWeight: 500,
                }}
                width={90}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
                <LabelList
                  dataKey="count"
                  position="right"
                  fill="var(--color-text-primary)"
                  fontSize={13}
                  fontWeight="600"
                  formatter={(value) => `${value}x`}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex flex-col grow justify-center text-center hover:border-blue-400">
          <CheckCircle size={80} className="mx-auto mb-3 text-button-success" />
          <p className="text-sm text-text-secondary">
            No distractions reported! 🎉
          </p>
        </div>
      )}
    </div>
  );
};

export default TopDistractionsChart;

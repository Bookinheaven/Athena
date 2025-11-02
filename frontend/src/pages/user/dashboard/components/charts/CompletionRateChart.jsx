import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useState, useEffect } from "react";
import ChartSkeleton from "../skeletons/ChartSkeleton";
import CustomTooltip from "../CustomTooltip";

const CompletionRateChart = ({ data = [], isLoading = false }) => {
  const COLORS = ["#22c55e", "#ef4444"];
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
        Task Completion Rate
      </h3>
      {isLoading ? (
        <div className="h-56 w-full flex items-center justify-center">
          <p className="text-text-muted">No data available.</p>
        </div>
      ) : !isChartReady ? (
        <ChartSkeleton/>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={85}
              labelLine={false}
              label={({
                cx,
                cy,
                midAngle,
                innerRadius,
                outerRadius,
                percent,
              }) => {
                const radius = innerRadius + (outerRadius - innerRadius) * 1.3;
                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                return (
                  <text
                    x={x}
                    y={y}
                    fill="var(--color-text-primary)"
                    textAnchor={x > cx ? "start" : "end"}
                    dominantBaseline="central"
                    fontWeight="600"
                  >
                    {`${(percent * 100).toFixed(0)}%`}
                  </text>
                );
              }}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Legend
              iconType="circle"
              wrapperStyle={{ color: "var(--color-text-primary)" }}
            />
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default CompletionRateChart;

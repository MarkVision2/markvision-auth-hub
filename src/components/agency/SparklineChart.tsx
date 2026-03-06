import { forwardRef } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface SparklineChartProps {
  data: number[];
  color?: string;
}

const SparklineChart = forwardRef<HTMLDivElement, SparklineChartProps>(
  ({ data, color = "hsl(160 84% 39%)" }, ref) => {
    const chartData = data.map((value, i) => ({ v: value, i }));
    const gradientId = `spark-${color.replace(/[^a-z0-9]/gi, "")}`;

    return (
      <div ref={ref} className="w-full h-10 opacity-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#${gradientId})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }
);

SparklineChart.displayName = "SparklineChart";

export default SparklineChart;

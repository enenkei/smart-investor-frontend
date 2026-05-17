"use client";

import * as React from "react";
import { Pie, PieChart, Cell } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface StrategyDonutChartProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
}

export function StrategyDonutChart({ data }: StrategyDonutChartProps) {
  const sanitizedData = React.useMemo(() => 
    data.map(d => ({
      ...d,
      id: d.name.replace(/\s+/g, "-"),
      label: d.name
    })), [data]);

  const chartConfig: ChartConfig = sanitizedData.reduce((acc, item) => {
    acc[item.id] = {
      label: item.label,
      color: item.color,
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <div className="w-full h-[450px] flex flex-col items-center">
      <ChartContainer config={chartConfig} className="mx-auto aspect-square w-full max-w-[400px]">
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Pie
            data={sanitizedData}
            dataKey="value"
            nameKey="id"
            innerRadius={80}
            outerRadius={130}
            strokeWidth={8}
            paddingAngle={5}
            labelLine={false}
            label={({ payload, ...props }) => {
              return (
                <text
                  cx={props.cx}
                  cy={props.cy}
                  x={props.x}
                  y={props.y}
                  textAnchor={props.textAnchor}
                  dominantBaseline={props.dominantBaseline}
                  className="text-[10px] font-bold fill-foreground"
                >
                  {payload.label}
                </text>
              )
            }}
          >
            {sanitizedData.map((entry) => (
              <Cell
                key={entry.id}
                fill={`var(--color-${entry.id})`}
              />
            ))}
          </Pie>
          <ChartLegend
            content={<ChartLegendContent nameKey="id" />}
            className="flex-wrap gap-x-4 gap-y-2 mt-8 justify-center"
          />
        </PieChart>
      </ChartContainer>
    </div>
  );
}

'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface SentimentGaugeProps {
  sentiment: number; // -1.0 to 1.0
}

const SentimentGauge: React.FC<SentimentGaugeProps> = ({ sentiment }) => {
  // Map -1.0 to 1.0 -> 0 to 100
  const normalizedValue = ((sentiment + 1) / 2) * 100;

  const data = [
    { name: 'Value', value: normalizedValue },
    { name: 'Remaining', value: 100 - normalizedValue },
  ];

  // Colors based on sentiment
  const getGaugeColor = (val: number) => {
    if (val < -0.3) return '#f43f5e'; // rose-500
    if (val > 0.3) return '#10b981'; // emerald-500
    return '#f59e0b'; // amber-500
  };

  const activeColor = getGaugeColor(sentiment);

  return (
    <div className="group relative flex flex-col items-center justify-center h-full w-full bg-card backdrop-blur-md rounded-none border border-border p-6 transition-all duration-300 hover:border-border/80 hover:shadow-lg overflow-hidden">
      {/* Background Glow */}
      <div
        className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-64 h-64 blur-[100px] opacity-20 transition-colors duration-500"
        style={{ backgroundColor: activeColor }}
      />

      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4">Market Pulse Sentiment</h3>

      <div className="w-full h-40 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {/* Background track */}
            <Pie
              data={[{ value: 100 }]}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius="75%"
              outerRadius="100%"
              paddingAngle={0}
              dataKey="value"
              stroke="none"
              isAnimationActive={false}
            >
              <Cell fill="#f1f5f9" />
            </Pie>
            {/* Active gauge */}
            <Pie
              data={data}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius="75%"
              outerRadius="100%"
              paddingAngle={0}
              dataKey="value"
              stroke="none"
              animationDuration={1500}
              animationEasing="ease-out"
            >
              <Cell key="cell-0" fill={activeColor} />
              <Cell key="cell-1" fill="transparent" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Value Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <div className="text-4xl font-black text-foreground tracking-tighter tabular-nums">
            {sentiment > 0 ? `+${sentiment.toFixed(2)}` : sentiment.toFixed(2)}
          </div>
          <div
            className="text-[10px] font-black uppercase tracking-[0.15em] mt-1"
            style={{ color: activeColor }}
          >
            {sentiment < -0.5 ? 'Extreme Fear' :
              sentiment < -0.1 ? 'Bearish' :
                sentiment < 0.1 ? 'Neutral' :
                  sentiment < 0.5 ? 'Bullish' : 'Extreme Greed'}
          </div>
        </div>
      </div>

      <div className="flex justify-between w-full mt-6 text-[9px] font-bold text-muted-foreground px-2">
        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> BEARISH</span>
        <span className="text-muted-foreground/60">NEUTRAL</span>
        <span className="flex items-center gap-1">BULLISH <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /></span>
      </div>
    </div>
  );
};

export default SentimentGauge;

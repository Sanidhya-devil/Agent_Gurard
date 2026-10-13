import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'blue' | 'emerald' | 'amber' | 'red' | 'purple' | 'cyan' | 'indigo';
  delta?: { text: string; isPositive?: boolean };
  sparklineData?: number[];
  onClick?: () => void;
  isLoading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'blue',
  delta,
  sparklineData,
  onClick,
  isLoading = false,
}) => {
  const iconColors: Record<string, string> = {
    blue: 'text-indigo-300',
    cyan: 'text-cyan-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    red: 'text-rose-400',
    purple: 'text-purple-400',
    indigo: 'text-indigo-300', // Lightened Indigo for Blocked Actions (WCAG AA > 4.5:1)
  };

  // Semantic stroke colors matching card semantics (Item 4 & 5: WCAG AA compliant)
  const sparklineColors: Record<string, string> = {
    blue: '#818CF8',     // Active agents online progression
    cyan: '#22D3EE',
    emerald: '#10B981',  // Green allowed
    amber: '#F59E0B',    // Amber pending / medium risk
    red: '#EF4444',      // Red high risk
    purple: '#A855F7',   // Purple currency spend
    indigo: '#818CF8',   // Lightened Violet/Indigo blocked (6.41:1 contrast on dark bg)
  };

  const currentIconColor = iconColors[variant] || 'text-zinc-300';
  const currentSparkColor = sparklineColors[variant] || '#818CF8';

  if (isLoading) {
    return (
      <div className="linear-card p-4 sm:p-5 flex flex-col justify-between animate-pulse">
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 w-20 bg-zinc-800 rounded" />
          <div className="h-4 w-4 bg-zinc-800 rounded" />
        </div>
        <div className="h-7 w-24 bg-zinc-800 rounded my-1" />
        <div className="h-4 w-28 bg-zinc-800 rounded mt-2" />
      </div>
    );
  }

  // Mini Sparkline SVG computation (compact fixed smaller width beside value)
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;
    const min = Math.min(...sparklineData);
    const max = Math.max(...sparklineData);
    const range = max - min || 1;
    const width = 36;
    const height = 16;

    const points = sparklineData
      .map((val, idx) => {
        const x = (idx / (sparklineData.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 4) - 2;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-hidden shrink-0 opacity-85 group-hover:opacity-100 transition-opacity"
        aria-hidden="true"
      >
        <polyline
          fill="none"
          stroke={currentSparkColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`linear-card p-4 sm:p-5 flex flex-col justify-between group transition-all select-none overflow-hidden ${
        onClick
          ? 'cursor-pointer hover:border-zinc-700 hover:bg-zinc-850/60 active:scale-[0.99] focus:outline-none focus:ring-1 focus:ring-indigo-500'
          : 'hover:border-zinc-750'
      }`}
    >
      {/* Title & Icon Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-zinc-300 tracking-wide">{title}</span>
        <Icon
          className={`w-4 h-4 ${currentIconColor} opacity-90 group-hover:opacity-100 transition-opacity shrink-0`}
        />
      </div>

      {/* Value & Clipped Sparkline (Item 1: Full value never truncates, shrink with clamp, sparkline fixed smaller width) */}
      <div className="flex items-baseline justify-between gap-1.5 my-1 min-w-0">
        <div
          className="font-bold text-zinc-100 tracking-tight font-mono tabular-nums whitespace-nowrap min-w-0"
          style={{ fontSize: 'clamp(1.05rem, 1.3vw, 1.5rem)', lineHeight: 1.25 }}
        >
          {value}
        </div>
        {sparklineData && sparklineData.length >= 2 && (
          <div className="w-9 h-4 shrink-0 overflow-hidden flex items-center justify-end">
            {renderSparkline()}
          </div>
        )}
      </div>

      {/* Subtitle & Delta (Item 2: Graceful 2-line wrapping, no text-overflow ellipsis, WCAG AA >= 4.5:1) */}
      <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-300 gap-x-2 gap-y-1 flex-wrap">
        <span className="leading-tight">{subtitle}</span>
        {delta && (
          <span
            className={`font-semibold shrink-0 leading-tight ${
              delta.isPositive ? 'text-emerald-400' : 'text-zinc-300'
            }`}
          >
            {delta.text}
          </span>
        )}
      </div>
    </div>
  );
};

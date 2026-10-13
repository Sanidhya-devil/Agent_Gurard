import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'blue' | 'emerald' | 'amber' | 'red' | 'purple' | 'cyan';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'blue',
}) => {
  const iconColors = {
    blue: 'text-indigo-400',
    cyan: 'text-cyan-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    red: 'text-rose-400',
    purple: 'text-purple-400',
  };

  const currentIconColor = iconColors[variant] || 'text-zinc-400';

  return (
    <div className="linear-card p-4 sm:p-5 flex flex-col justify-between group hover:border-zinc-700/80">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-zinc-400 tracking-wide">{title}</span>
        <Icon className={`w-4 h-4 ${currentIconColor} opacity-70 group-hover:opacity-100 transition-opacity`} />
      </div>

      <div className="text-2xl font-bold text-zinc-100 tracking-tight font-mono">
        {value}
      </div>

      {subtitle && (
        <div className="text-[11px] text-zinc-500 mt-1.5 flex items-center gap-1 font-mono">
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
};

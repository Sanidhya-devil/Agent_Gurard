import React from 'react';

interface RiskBadgeProps {
  score: number;
  level: string;
  showScore?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ score, level, showScore = true }) => {
  const lvl = level ? level.toUpperCase() : 'LOW';

  let colorClasses = 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60';
  let pulseDot = 'bg-emerald-500';

  if (lvl === 'HIGH' || score >= 75) {
    colorClasses = 'bg-red-950/80 text-red-300 border-red-700/70 animate-pulse';
    pulseDot = 'bg-red-500';
  } else if (lvl === 'MEDIUM' || (score >= 40 && score < 75)) {
    colorClasses = 'bg-amber-950/70 text-amber-300 border-amber-700/60';
    pulseDot = 'bg-amber-500';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${colorClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${pulseDot}`} />
      <span>{lvl}</span>
      {showScore && <span className="opacity-75">({score})</span>}
    </span>
  );
};

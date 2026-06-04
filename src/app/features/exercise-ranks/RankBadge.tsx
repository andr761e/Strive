import { Award, Crown, Gem, Hexagon, Shield, Sparkles, Star } from 'lucide-react';
import { cn } from '../../components/ui/utils';
import type { ExerciseRankTier, RankDivision } from './rankTypes';
import { formatRankLabel } from './rankUtils';

interface RankBadgeProps {
  rank: ExerciseRankTier;
  division?: RankDivision | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const rankStyles: Record<ExerciseRankTier, { className: string; Icon: typeof Award; symbol: string }> = {
  Unranked: {
    className: 'border-zinc-700 bg-zinc-900/80 text-zinc-400 shadow-zinc-950/20',
    Icon: Hexagon,
    symbol: '-',
  },
  Iron: {
    className: 'border-zinc-500/70 bg-zinc-800 text-zinc-200 shadow-zinc-900/40',
    Icon: Hexagon,
    symbol: 'Fe',
  },
  Bronze: {
    className: 'border-orange-700/70 bg-orange-950/50 text-orange-200 shadow-orange-950/30',
    Icon: Shield,
    symbol: 'Br',
  },
  Silver: {
    className: 'border-slate-300/70 bg-slate-800/70 text-slate-100 shadow-slate-900/30',
    Icon: Shield,
    symbol: 'Ag',
  },
  Gold: {
    className: 'border-yellow-400/80 bg-yellow-950/40 text-yellow-200 shadow-yellow-950/30',
    Icon: Award,
    symbol: 'Au',
  },
  Platinum: {
    className: 'border-cyan-300/80 bg-cyan-950/45 text-cyan-100 shadow-cyan-950/30',
    Icon: Star,
    symbol: 'Pt',
  },
  Diamond: {
    className: 'border-sky-300/80 bg-sky-950/45 text-sky-100 shadow-sky-950/30',
    Icon: Gem,
    symbol: 'Di',
  },
  Ascendant: {
    className: 'border-violet-300/80 bg-violet-950/45 text-violet-100 shadow-violet-950/30',
    Icon: Sparkles,
    symbol: 'As',
  },
  Titan: {
    className: 'border-red-400/80 bg-red-950/45 text-red-100 shadow-red-950/30',
    Icon: Crown,
    symbol: 'Ti',
  },
  Apex: {
    className: 'border-amber-100/90 bg-white/10 text-amber-50 shadow-[0_0_28px_rgba(251,191,36,0.2)]',
    Icon: Crown,
    symbol: 'Ax',
  },
};

const sizeStyles = {
  sm: 'gap-1.5 px-2 py-1 text-[0.65rem]',
  md: 'gap-2 px-3 py-1.5 text-xs',
  lg: 'gap-2.5 px-4 py-2 text-sm',
};

const iconStyles = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function RankBadge({ rank, division = null, size = 'md', className }: RankBadgeProps) {
  const config = rankStyles[rank];
  const Icon = config.Icon;
  const label = formatRankLabel(rank, division);

  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center rounded-xl border font-semibold uppercase shadow-lg',
        sizeStyles[size],
        config.className,
        className,
      )}
      aria-label={`Exercise rank ${label}`}
    >
      <Icon className={iconStyles[size]} aria-hidden="true" />
      <span className="font-mono">{config.symbol}</span>
      <span>{label}</span>
    </div>
  );
}

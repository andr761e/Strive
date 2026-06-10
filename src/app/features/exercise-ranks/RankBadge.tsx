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

const rankStyles: Record<ExerciseRankTier, { Icon: typeof Award; symbol: string }> = {
  Unranked: {
    Icon: Hexagon,
    symbol: '-',
  },
  Iron: {
    Icon: Hexagon,
    symbol: 'Fe',
  },
  Bronze: {
    Icon: Shield,
    symbol: 'Br',
  },
  Silver: {
    Icon: Shield,
    symbol: 'Ag',
  },
  Gold: {
    Icon: Award,
    symbol: 'Au',
  },
  Platinum: {
    Icon: Star,
    symbol: 'Pt',
  },
  Diamond: {
    Icon: Gem,
    symbol: 'Di',
  },
  Ascendant: {
    Icon: Sparkles,
    symbol: 'As',
  },
  Titan: {
    Icon: Crown,
    symbol: 'Ti',
  },
  Apex: {
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
  const tierClass = `rank-badge-${rank.toLowerCase()}`;

  return (
    <div
      className={cn(
        'rank-badge inline-flex shrink-0 items-center rounded-xl border font-semibold uppercase shadow-lg',
        sizeStyles[size],
        tierClass,
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

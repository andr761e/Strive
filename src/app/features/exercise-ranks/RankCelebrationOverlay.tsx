import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import confetti from 'canvas-confetti';
import { ArrowRight, Award, Crown, Gem, Hexagon, Shield, Sparkles, Star, Trophy, Zap } from 'lucide-react';
import { RankBadge } from './RankBadge';
import type { ExerciseRankTier } from './rankTypes';
import type { WorkoutRankProgressItem } from './rankProgress';

interface RankCelebrationOverlayProps {
  items: WorkoutRankProgressItem[];
  onClose: () => void;
}

type CelebrationPhase = 'charging' | 'unlocking' | 'settled';

const rankThemes: Record<
  ExerciseRankTier,
  {
    accent: string;
    accentSoft: string;
    glow: string;
    text: string;
    Icon: typeof Award;
  }
> = {
  Unranked: {
    accent: '#71717a',
    accentSoft: 'rgba(113, 113, 122, 0.18)',
    glow: 'rgba(113, 113, 122, 0.28)',
    text: '#d4d4d8',
    Icon: Hexagon,
  },
  Iron: {
    accent: '#a1a1aa',
    accentSoft: 'rgba(161, 161, 170, 0.18)',
    glow: 'rgba(161, 161, 170, 0.28)',
    text: '#f4f4f5',
    Icon: Hexagon,
  },
  Bronze: {
    accent: '#fb923c',
    accentSoft: 'rgba(251, 146, 60, 0.18)',
    glow: 'rgba(251, 146, 60, 0.34)',
    text: '#fed7aa',
    Icon: Shield,
  },
  Silver: {
    accent: '#cbd5e1',
    accentSoft: 'rgba(203, 213, 225, 0.18)',
    glow: 'rgba(203, 213, 225, 0.32)',
    text: '#f8fafc',
    Icon: Shield,
  },
  Gold: {
    accent: '#facc15',
    accentSoft: 'rgba(250, 204, 21, 0.2)',
    glow: 'rgba(250, 204, 21, 0.38)',
    text: '#fef9c3',
    Icon: Award,
  },
  Platinum: {
    accent: '#67e8f9',
    accentSoft: 'rgba(103, 232, 249, 0.2)',
    glow: 'rgba(103, 232, 249, 0.4)',
    text: '#cffafe',
    Icon: Star,
  },
  Diamond: {
    accent: '#7dd3fc',
    accentSoft: 'rgba(125, 211, 252, 0.2)',
    glow: 'rgba(125, 211, 252, 0.42)',
    text: '#e0f2fe',
    Icon: Gem,
  },
  Ascendant: {
    accent: '#c084fc',
    accentSoft: 'rgba(192, 132, 252, 0.22)',
    glow: 'rgba(192, 132, 252, 0.44)',
    text: '#f3e8ff',
    Icon: Sparkles,
  },
  Titan: {
    accent: '#f87171',
    accentSoft: 'rgba(248, 113, 113, 0.22)',
    glow: 'rgba(248, 113, 113, 0.44)',
    text: '#fee2e2',
    Icon: Crown,
  },
  Apex: {
    accent: '#fde68a',
    accentSoft: 'rgba(253, 230, 138, 0.24)',
    glow: 'rgba(253, 230, 138, 0.5)',
    text: '#fffbeb',
    Icon: Crown,
  },
};

const particles = Array.from({ length: 42 }, (_, index) => ({
  id: index,
  left: `${8 + ((index * 19) % 84)}%`,
  delay: `${120 + ((index * 73) % 900)}ms`,
  duration: `${1700 + ((index * 113) % 900)}ms`,
  size: `${3 + (index % 4)}px`,
  drift: `${(index % 2 === 0 ? 1 : -1) * (18 + (index % 7) * 7)}px`,
}));

function formatKg(value: number) {
  if (!Number.isFinite(value)) return '- kg';
  return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)} kg`;
}

function getHeadline(item: WorkoutRankProgressItem) {
  if (item.rankChanged) return 'New Rank Unlocked';
  if (item.progressKind === 'rank') return 'Rank Progress';
  return 'New Performance PR';
}

function getSubheadline(item: WorkoutRankProgressItem) {
  if (item.rankChanged) return `${item.exerciseName} advanced to ${item.afterRankLabel}.`;
  if (item.progressKind === 'rank' && item.scoreImprovementPercent !== null) {
    return `${item.exerciseName} moved ${item.scoreImprovementPercent.toFixed(1)}% forward.`;
  }
  return `${item.exerciseName} logged a new estimated 1RM.`;
}

export function RankCelebrationOverlay({ items, onClose }: RankCelebrationOverlayProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<CelebrationPhase>('charging');
  const [meterStarted, setMeterStarted] = useState(false);
  const [canDismiss, setCanDismiss] = useState(false);

  const safeIndex = Math.min(activeIndex, Math.max(items.length - 1, 0));
  const primary = items[safeIndex] ?? items[0]!;
  const hasMultipleItems = items.length > 1;
  const isLastItem = safeIndex >= items.length - 1;
  const achievementLabel = hasMultipleItems ? `Record ${safeIndex + 1} of ${items.length}` : 'Record';

  const theme = rankThemes[primary.afterRank] ?? rankThemes.Unranked;
  const Icon = primary.rankChanged ? theme.Icon : primary.progressKind === 'performance' ? Trophy : Zap;
  const hasRankUp = primary.rankChanged;
  const nextQueuedItem = items[safeIndex + 1];
  const queuedAfterCurrentCount = Math.max(0, items.length - safeIndex - 1);
  const meterPercent =
    phase === 'settled' && primary.rankChanged
      ? Math.max(0, Math.min(100, primary.nextProgressPercent))
      : meterStarted
        ? Math.max(0, Math.min(100, primary.finishProgressPercent))
        : Math.max(0, Math.min(100, primary.startProgressPercent));

  const cssVars = useMemo(
    () =>
      ({
        '--rank-accent': theme.accent,
        '--rank-accent-soft': theme.accentSoft,
        '--rank-glow': theme.glow,
        '--rank-text': theme.text,
      }) as CSSProperties,
    [theme],
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [items.length]);

  useEffect(() => {
    setPhase('charging');
    setMeterStarted(false);
    setCanDismiss(false);

    const startTimer = window.setTimeout(() => setMeterStarted(true), 180);
    const unlockTimer = window.setTimeout(() => setPhase('unlocking'), hasRankUp ? 1750 : 1350);
    const settledTimer = window.setTimeout(() => setPhase('settled'), hasRankUp ? 3100 : 2300);
    const dismissTimer = window.setTimeout(() => setCanDismiss(true), hasRankUp ? 4100 : 3000);

    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(unlockTimer);
      window.clearTimeout(settledTimer);
      window.clearTimeout(dismissTimer);
    };
  }, [hasRankUp, primary.exerciseId, safeIndex]);

  useEffect(() => {
    const fireConfetti = (delay: number, options: confetti.Options) =>
      window.setTimeout(() => {
        confetti({
          disableForReducedMotion: true,
          scalar: hasRankUp ? 0.95 : 0.72,
          ticks: hasRankUp ? 220 : 150,
          ...options,
        });
      }, delay);

    const timers = hasRankUp
      ? [
          fireConfetti(1720, {
            particleCount: 60,
            spread: 72,
            startVelocity: 48,
            origin: { x: 0.2, y: 0.58 },
            colors: [theme.accent, '#ffffff', '#60a5fa'],
          }),
          fireConfetti(1720, {
            particleCount: 60,
            spread: 72,
            startVelocity: 48,
            origin: { x: 0.8, y: 0.58 },
            colors: [theme.accent, '#ffffff', '#60a5fa'],
          }),
          fireConfetti(3050, {
            particleCount: 36,
            spread: 120,
            startVelocity: 24,
            gravity: 0.8,
            origin: { x: 0.5, y: 0.24 },
            colors: [theme.accent, '#dbeafe', '#f8fafc'],
          }),
        ]
      : [
          fireConfetti(1360, {
            particleCount: 38,
            spread: 62,
            startVelocity: 30,
            origin: { x: 0.5, y: 0.56 },
            colors: [theme.accent, '#60a5fa', '#f8fafc'],
          }),
        ];

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [hasRankUp, primary.exerciseId, safeIndex, theme.accent]);

  const handleAdvance = () => {
    if (!canDismiss) return;
    if (!isLastItem) {
      setActiveIndex((current) => Math.min(current + 1, items.length - 1));
      return;
    }
    onClose();
  };

  return (
    <div
      className="rank-celebration fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/90 px-3 py-6 backdrop-blur-xl"
      style={cssVars}
      onClick={() => {
        if (canDismiss) handleAdvance();
      }}
    >
      <div className="rank-celebration-aurora" />
      <div className="rank-celebration-grid" />
      {particles.map((particle) => (
        <span
          key={particle.id}
          className={`rank-celebration-particle ${phase !== 'charging' ? 'is-live' : ''}`}
          style={
            {
              left: particle.left,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
              width: particle.size,
              height: particle.size,
              '--particle-drift': particle.drift,
            } as CSSProperties
          }
        />
      ))}

      <div
        className="relative z-10 w-full max-w-md overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          key={`${primary.exerciseId}-${safeIndex}`}
          className={`rank-celebration-card ${phase !== 'charging' ? 'is-unlocked' : ''}`}
        >
          <div className="rank-celebration-card-glow" />

          <div className="relative z-10">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                  {achievementLabel}
                </div>
                <h2 className="mt-1 text-2xl font-semibold leading-tight text-white">{getHeadline(primary)}</h2>
              </div>
              <div className="rank-celebration-status">
                {phase === 'charging' ? 'Analyzing' : phase === 'unlocking' ? 'Unlocking' : 'Complete'}
              </div>
            </div>

            {hasMultipleItems && (
              <div className="rank-achievement-stepper mb-4" aria-label={`Record ${safeIndex + 1} of ${items.length}`}>
                {items.map((item, index) => (
                  <span
                    key={`${item.exerciseId}-${index}`}
                    className={`rank-achievement-dot ${index < safeIndex ? 'is-complete' : ''} ${index === safeIndex ? 'is-active' : ''}`}
                  />
                ))}
              </div>
            )}

            <div className="rank-medallion-wrap">
              <div className="rank-medallion-pulse" />
              <div className={`rank-medallion ${phase !== 'charging' ? 'is-unlocked' : ''}`}>
                <Icon className="h-12 w-12" />
                <div className="mt-3 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--rank-text)]">
                  {primary.afterRankLabel}
                </div>
              </div>
            </div>

            <div className="mt-5 text-center">
              <div className="text-base font-semibold text-white">{primary.exerciseName}</div>
              <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed text-zinc-400">{getSubheadline(primary)}</p>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-3">
              <div className="mb-3 flex items-center justify-center gap-2">
                <RankBadge
                  rank={primary.beforeRank}
                  division={primary.beforeDivision}
                  size="sm"
                  className={phase !== 'charging' ? 'opacity-55' : ''}
                />
                <div className={`rank-transition-arrow ${phase !== 'charging' ? 'is-live' : ''}`}>
                  <ArrowRight className="h-4 w-4" />
                </div>
                <div className={phase !== 'charging' ? 'rank-after-badge-pop' : ''}>
                  <RankBadge rank={primary.afterRank} division={primary.afterDivision} size="md" />
                </div>
              </div>

              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-zinc-500">
                  {primary.rankChanged && phase === 'settled'
                    ? `Toward ${primary.nextRankLabel ?? 'next rank'}`
                    : primary.rankChanged
                      ? 'Rank threshold'
                      : primary.progressKind === 'rank'
                        ? `Toward ${primary.nextRankLabel ?? 'next rank'}`
                        : 'Estimated 1RM PR'}
                </span>
                <span className="font-mono text-[var(--rank-text)]">{Math.round(meterPercent)}%</span>
              </div>
              <div className="rank-progress-track">
                <div className="rank-progress-fill" style={{ width: `${meterPercent}%` }} />
                {phase === 'unlocking' && primary.rankChanged && <div className="rank-progress-burst" />}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.035] p-2">
                  <div className="text-[0.65rem] uppercase tracking-normal text-zinc-500">Best Set</div>
                  <div className="mt-1 truncate text-sm font-semibold text-white">{primary.bestSetLabel}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.035] p-2">
                  <div className="text-[0.65rem] uppercase tracking-normal text-zinc-500">Est. 1RM</div>
                  <div className="mt-1 truncate text-sm font-semibold text-white">
                    {formatKg(primary.estimatedOneRepMax)}
                  </div>
                </div>
              </div>
            </div>

            {phase === 'settled' && (
              <div className="rank-next-target">
                {primary.note ??
                  (primary.nextRankLabel
                    ? `Next target: ${primary.nextRankLabel}${primary.nextTargetLabel ? ` around ${primary.nextTargetLabel}` : ''}.`
                    : 'Top rank reached for this exercise.')}
              </div>
            )}

            {nextQueuedItem && (
              <div className="mt-3 flex min-w-0 items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium text-white">
                    Next: {nextQueuedItem.exerciseName}
                  </div>
                  <div className="truncate text-[0.68rem] text-zinc-500">
                    {queuedAfterCurrentCount} more {queuedAfterCurrentCount === 1 ? 'record' : 'records'} queued
                  </div>
                </div>
                <RankBadge rank={nextQueuedItem.afterRank} division={nextQueuedItem.afterDivision} size="sm" />
              </div>
            )}

            <button
              type="button"
              disabled={!canDismiss}
              onClick={handleAdvance}
              className="premium-button premium-button-primary mt-4 w-full py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {canDismiss
                ? isLastItem
                  ? 'Continue'
                  : `Next Record (${safeIndex + 2}/${items.length})`
                : phase === 'charging'
                  ? 'Analyzing Lift...'
                  : 'Revealing Rank...'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

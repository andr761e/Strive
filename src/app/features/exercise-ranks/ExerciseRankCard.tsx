import { useState } from 'react';
import { ChevronDown, ChevronUp, LockKeyhole, Target } from 'lucide-react';
import { cn } from '../../components/ui/utils';
import type { ExerciseRankResult } from './rankTypes';
import { RankBadge } from './RankBadge';
import { formatRankLabel } from './rankUtils';

interface ExerciseRankCardProps {
  result: ExerciseRankResult | null;
  className?: string;
}

function formatKg(value: number | undefined) {
  if (!value || value <= 0) return '-';
  const rounded = value >= 100 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded.toLocaleString()} kg`;
}

function formatRatio(value: number | undefined) {
  if (!value || value <= 0) return '-';
  return `${value.toFixed(2)}x`;
}

function formatBestSet(result: ExerciseRankResult) {
  const set = result.bestSet;
  if (!set) return '-';

  if (result.metadata?.rankLoadMode === 'bodyweight_plus_external') {
    const added = set.loggedWeight > 0 ? `BW + ${formatKg(set.loggedWeight)}` : 'BW';
    return `${added} x ${set.reps}`;
  }

  if (result.metadata?.rankLoadMode === 'per_hand') {
    return `${formatKg(set.loggedWeight)}/hand x ${set.reps}`;
  }

  return `${formatKg(set.loggedWeight)} x ${set.reps}`;
}

export function ExerciseRankCard({ result, className }: ExerciseRankCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!result || !result.eligible) return null;

  const hasProgress = typeof result.progressPercent === 'number';
  const nextRankLabel = result.nextStandard
    ? formatRankLabel(result.nextStandard.rank, result.nextStandard.division)
    : 'Apex locked in';
  const progressWidth = `${Math.max(0, Math.min(100, result.progressPercent ?? 0))}%`;
  const isLocked = result.status === 'missing_bodyweight' || result.status === 'no_valid_sets';

  return (
    <div
      className={cn(
        'premium-row overflow-hidden border-blue-400/15 bg-gradient-to-br from-blue-500/[0.07] via-white/[0.025] to-zinc-950 p-4',
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <RankBadge rank={result.rank} division={result.division} size="md" />
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[0.65rem] uppercase text-zinc-400">
              Exercise rank
            </span>
          </div>
          <h3 className="truncate text-base font-semibold text-white">{result.exerciseName}</h3>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">{result.message}</p>
        </div>
        {isLocked ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10 text-blue-200">
            <LockKeyhole className="h-4 w-4" />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10 text-blue-200 transition-colors hover:bg-blue-500/20"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse exercise rank details' : 'Expand exercise rank details'}
          >
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        )}
      </div>

      {isExpanded && (
        <>
          <div className="mb-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="mb-1 text-[0.65rem] uppercase text-zinc-500">Est. 1RM</div>
              <div className="stat-number truncate text-base">{formatKg(result.estimatedOneRepMax)}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="mb-1 text-[0.65rem] uppercase text-zinc-500">Best set</div>
              <div className="stat-number truncate text-base">{formatBestSet(result)}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="mb-1 text-[0.65rem] uppercase text-zinc-500">BW ratio</div>
              <div className="stat-number truncate text-base">{formatRatio(result.strengthRatio)}</div>
            </div>
          </div>

          {hasProgress && (
            <div>
              <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                <div className="flex min-w-0 items-center gap-2 text-zinc-400">
                  <Target className="h-3.5 w-3.5 shrink-0 text-blue-300" />
                  <span className="truncate">
                    Next: {nextRankLabel}
                    {result.nextTargetStrengthRatio
                      ? ` at ${result.nextTargetStrengthRatio.toFixed(2)}x BW`
                      : ''}
                  </span>
                </div>
                <span className="shrink-0 font-mono text-zinc-300">{Math.round(result.progressPercent ?? 0)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full border border-white/10 bg-zinc-950">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-300 to-white shadow-[0_0_18px_rgba(59,130,246,0.35)]"
                  style={{ width: progressWidth }}
                />
              </div>
              {result.nextTargetEstimatedOneRepMax && (
                <div className="mt-2 text-xs text-zinc-500">
                  Target estimate: {formatKg(result.nextTargetEstimatedOneRepMax)}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

import { useMemo, useState } from 'react';
import { bodyBack } from './assets/bodyBack';
import { bodyFemaleBack } from './assets/bodyFemaleBack';
import { bodyFemaleFront } from './assets/bodyFemaleFront';
import { bodyFront } from './assets/bodyFront';
import { SvgFemaleWrapper } from './SvgFemaleWrapper';
import { SvgMaleWrapper } from './SvgMaleWrapper';
import { useAuth } from '../../contexts/AuthContext';
import type { BodyPart, BodyPartSlug } from '.';
import {
  getBodyGenderFromProfile,
  getMuscleForSlug,
  getSlugsForSelectedMuscles,
  getStatusForSlug,
  normalizeBodyMapMuscle,
  type BodyMapGender,
  type BodyMapMuscleStatus,
} from './muscleMap';

type BodyMapMode = 'selection' | 'status';
type BodyMapSide = 'front' | 'back';

interface BodyMapProps {
  onMuscleSelect: (muscle: string) => void;
  selectedMuscles: string[];
  colorMode?: BodyMapMode;
  muscleStatuses?: Record<string, BodyMapMuscleStatus>;
  gender?: string;
  className?: string;
}

const neutralFill = 'var(--strive-bodymap-muscle-fill)';
const neutralStroke = 'var(--strive-bodymap-stroke)';
const selectedFill = 'var(--strive-bodymap-selected-fill)';
const selectedStroke = 'var(--strive-bodymap-selected-stroke)';

const statusColors: Record<string, string> = {
  progressing: 'var(--strive-accent)',
  balanced: '#22c55e',
  watch: '#eab308',
  undertrained: '#f97316',
  overtrained: '#ef4444',
  recovering: '#a855f7',
};

const visibleStructureSlugs = new Set<BodyPartSlug>(['head', 'hair', 'neck', 'hands', 'feet']);

const tailwindColorMap: Record<string, string> = {
  'bg-blue-500': 'var(--strive-accent)',
  'bg-green-500': '#22c55e',
  'bg-yellow-500': '#eab308',
  'bg-orange-500': '#f97316',
  'bg-red-500': '#ef4444',
  'bg-purple-500': '#a855f7',
};

function colorFromStatus(status?: BodyMapMuscleStatus) {
  if (!status) return undefined;
  if (status.color?.startsWith('#')) return status.color;
  if (status.color && tailwindColorMap[status.color]) return tailwindColorMap[status.color];
  return statusColors[status.status] ?? undefined;
}

function getIntensity(status?: BodyMapMuscleStatus) {
  if (!status) return 0;
  if (status.weeklySets === undefined) return 0.65;
  return Math.max(0.25, Math.min(1, status.weeklySets / 18));
}

function getStatusGlow(statusColor: string, intensity: number) {
  const blur = 5 + intensity * 8;
  if (statusColor.startsWith('var(')) return `drop-shadow(0 0 ${blur}px var(--strive-accent-glow))`;
  return `drop-shadow(0 0 ${blur}px ${statusColor}66)`;
}

function getBodyParts(gender: BodyMapGender, side: BodyMapSide) {
  if (gender === 'female') {
    return side === 'front' ? bodyFemaleFront : bodyFemaleBack;
  }

  return side === 'front' ? bodyFront : bodyBack;
}

function getBodyPartPaths(part: BodyPart) {
  return [
    ...(part.path?.common ?? []).map((path) => ({ path, side: undefined })),
    ...(part.path?.left ?? []).map((path) => ({ path, side: 'left' as const })),
    ...(part.path?.right ?? []).map((path) => ({ path, side: 'right' as const })),
  ];
}

function getPathState({
  slug,
  selectedSlugs,
  hoveredSlug,
  colorMode,
  muscleStatuses,
}: {
  slug?: BodyPartSlug;
  selectedSlugs: Set<BodyPartSlug>;
  hoveredSlug?: BodyPartSlug;
  colorMode: BodyMapMode;
  muscleStatuses?: Record<string, BodyMapMuscleStatus>;
}) {
  const isInteractive = Boolean(getMuscleForSlug(slug));
  const isSelected = Boolean(slug && selectedSlugs.has(slug));
  const isHovered = Boolean(slug && hoveredSlug === slug);
  const status = getStatusForSlug(slug, muscleStatuses);
  const statusColor = colorFromStatus(status);
  const intensity = getIntensity(status);

  if (isSelected) {
    return {
      fill: selectedFill,
      stroke: selectedStroke,
      strokeWidth: 5,
      opacity: 0.96,
      glow: 'drop-shadow(0 0 10px var(--strive-accent-glow))',
      isInteractive,
    };
  }

  if (colorMode === 'status' && statusColor) {
    return {
      fill: statusColor,
      stroke: statusColor,
      strokeWidth: 2.4 + intensity * 2,
      opacity: 0.34 + intensity * 0.52,
      glow: getStatusGlow(statusColor, intensity),
      isInteractive,
    };
  }

  if (isHovered && isInteractive) {
    return {
      fill: 'var(--strive-accent-soft)',
      stroke: selectedStroke,
      strokeWidth: 3,
      opacity: 0.78,
      glow: 'drop-shadow(0 0 8px var(--strive-accent-glow))',
      isInteractive,
    };
  }

  const isVisibleStructure = Boolean(slug && visibleStructureSlugs.has(slug));

  return {
    fill: partNeutralFill(slug),
    stroke: isInteractive || isVisibleStructure ? neutralStroke : 'var(--strive-bodymap-soft-stroke)',
    strokeWidth: isInteractive ? 1.1 : isVisibleStructure ? 1.25 : 0.65,
    opacity: isInteractive ? 0.64 : isVisibleStructure ? 0.82 : 0.48,
    glow: 'none',
    isInteractive,
  };
}

function partNeutralFill(slug?: BodyPartSlug) {
  if (!slug) return neutralFill;
  if (slug === 'hair') return 'var(--strive-bodymap-hair-fill)';
  if (slug === 'head' || slug === 'neck') return 'var(--strive-bodymap-structure-fill)';
  if (['hands', 'feet', 'ankles', 'knees'].includes(slug)) return 'var(--strive-bodymap-endpoint-fill)';
  return neutralFill;
}

function BodyMapFigure({
  side,
  gender,
  selectedSlugs,
  hoveredSlug,
  setHoveredSlug,
  colorMode,
  muscleStatuses,
  onMuscleSelect,
}: {
  side: BodyMapSide;
  gender: BodyMapGender;
  selectedSlugs: Set<BodyPartSlug>;
  hoveredSlug?: BodyPartSlug;
  setHoveredSlug: (slug?: BodyPartSlug) => void;
  colorMode: BodyMapMode;
  muscleStatuses?: Record<string, BodyMapMuscleStatus>;
  onMuscleSelect: (muscle: string) => void;
}) {
  const Wrapper = gender === 'female' ? SvgFemaleWrapper : SvgMaleWrapper;
  const parts = getBodyParts(gender, side);

  const handleSelect = (muscle?: string) => {
    if (!muscle) return;
    onMuscleSelect(normalizeBodyMapMuscle(muscle));
    setHoveredSlug(undefined);
  };

  return (
    <div
      className="body-map-panel min-w-0 p-2"
      onPointerLeave={() => setHoveredSlug(undefined)}
    >
      <div className="body-map-side-label mb-1 text-center text-[11px] uppercase">{side}</div>
      <Wrapper side={side} scale={1} border="var(--strive-bodymap-outline)" className="mx-auto h-auto max-h-[460px] w-full max-w-[270px]">
        {parts.flatMap((part) => {
          const slug = part.slug;
          const muscle = getMuscleForSlug(slug);
          const pathState = getPathState({
            slug,
            selectedSlugs,
            hoveredSlug,
            colorMode,
            muscleStatuses,
          });
          const paths = getBodyPartPaths(part);

          return paths.map(({ path, side: pathSide }, index) => (
            <path
              key={`${side}-${slug ?? 'part'}-${pathSide ?? 'common'}-${index}`}
              d={path}
              fill={pathState.fill}
              stroke={pathState.stroke}
              strokeWidth={pathState.strokeWidth}
              opacity={pathState.opacity}
              role={pathState.isInteractive ? 'button' : undefined}
              tabIndex={pathState.isInteractive ? 0 : undefined}
              className="body-map-path"
              aria-label={muscle ? `${muscle} ${pathSide ?? ''}`.trim() : undefined}
              onClick={() => handleSelect(muscle)}
              onKeyDown={(event) => {
                if (!muscle || (event.key !== 'Enter' && event.key !== ' ')) return;
                event.preventDefault();
                handleSelect(muscle);
              }}
              onPointerEnter={(event) => {
                if (event.pointerType !== 'touch' && slug) setHoveredSlug(slug);
              }}
              onPointerDown={(event) => {
                event.currentTarget.blur();
                if (slug) setHoveredSlug(slug);
              }}
              onPointerCancel={() => setHoveredSlug(undefined)}
              style={{
                cursor: pathState.isInteractive ? 'pointer' : 'default',
                filter: pathState.glow,
                outline: 'none',
                transition: 'fill 160ms ease, opacity 160ms ease, stroke 160ms ease, stroke-width 160ms ease, filter 160ms ease',
                WebkitTapHighlightColor: 'transparent',
                vectorEffect: 'non-scaling-stroke',
              }}
            />
          ));
        })}
      </Wrapper>
    </div>
  );
}

export function BodyMap({
  onMuscleSelect,
  selectedMuscles,
  colorMode = 'selection',
  muscleStatuses,
  gender,
  className = '',
}: BodyMapProps) {
  const { user } = useAuth();
  const bodyGender = getBodyGenderFromProfile({ gender: gender ?? user?.gender });
  const selectedSlugs = useMemo(() => getSlugsForSelectedMuscles(selectedMuscles), [selectedMuscles]);
  const [hoveredSlug, setHoveredSlug] = useState<BodyPartSlug | undefined>();

  return (
    <div className={`w-full ${className}`}>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {(['front', 'back'] as BodyMapSide[]).map((side) => (
          <BodyMapFigure
            key={side}
            side={side}
            gender={bodyGender}
            selectedSlugs={selectedSlugs}
            hoveredSlug={hoveredSlug}
            setHoveredSlug={setHoveredSlug}
            colorMode={colorMode}
            muscleStatuses={muscleStatuses}
            onMuscleSelect={onMuscleSelect}
          />
        ))}
      </div>

      {colorMode === 'status' && (
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-400 sm:flex sm:flex-wrap sm:justify-center">
          {[
            ['var(--strive-accent)', 'Progressing'],
            ['#22c55e', 'Balanced'],
            ['#eab308', 'Watch'],
            ['#f97316', 'Undertrained'],
            ['#ef4444', 'High'],
          ].map(([color, label]) => (
            <div key={label} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full shadow-[0_0_10px_currentColor]"
                style={{ backgroundColor: color, color }}
              />
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

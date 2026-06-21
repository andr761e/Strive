import { type Exercise } from '../data/mockData';

export type ExerciseEquipmentCategory =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'cardio'
  | 'kettlebell'
  | 'plate'
  | 'warm-up'
  | 'carry'
  | 'smith-machine'
  | 'trap-bar'
  | 'unknown';

type ExerciseSymbolVariant =
  | ExerciseEquipmentCategory
  | 'ez-bar'
  | 'leg-machine'
  | 'pull-up'
  | 'dip'
  | 'push-up'
  | 'hold'
  | 'treadmill'
  | 'bike'
  | 'rower'
  | 'skierg'
  | 'stairs'
  | 'elliptical'
  | 'swim'
  | 'hike'
  | 'jump-rope'
  | 'battle-ropes'
  | 'sled'
  | 'box-jump'
  | 'band'
  | 'mobility'
  | 'core';

interface ExerciseEquipmentIconProps {
  exercise?: Pick<Exercise, 'name' | 'equipment' | 'category'> | null;
  equipment?: string | null;
  category?: string | null;
  active?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const sizeClasses = {
  sm: {
    shell: 'h-10 w-10 rounded-xl',
    icon: 'h-5 w-5',
    wideIcon: 'h-5 w-7',
    tallIcon: 'h-6 w-5',
  },
  md: {
    shell: 'h-12 w-12 rounded-2xl',
    icon: 'h-6 w-6',
    wideIcon: 'h-6 w-8',
    tallIcon: 'h-7 w-6',
  },
};

function normalize(value?: string | null) {
  return value?.trim().toLowerCase() ?? '';
}

export function getExerciseEquipmentCategory(
  exercise?: Pick<Exercise, 'name' | 'equipment' | 'category'> | null,
  explicitEquipment?: string | null,
  explicitCategory?: string | null,
): ExerciseEquipmentCategory {
  const equipment = normalize(explicitEquipment ?? exercise?.equipment);
  const category = normalize(explicitCategory ?? exercise?.category);
  const name = normalize(exercise?.name);
  const combined = `${equipment} ${category} ${name}`;

  if (combined.includes('smith')) return 'smith-machine';
  if (combined.includes('trap bar')) return 'trap-bar';
  if (combined.includes('kettlebell')) return 'kettlebell';
  if (combined.includes('barbell') || combined.includes('ez-bar') || combined.includes('good morning')) return 'barbell';
  if (combined.includes('dumbbell') || /\bdb\b/.test(combined)) return 'dumbbell';
  if (combined.includes('cable') || combined.includes('pulldown') || combined.includes('pushdown')) return 'cable';
  if (
    combined.includes('machine') ||
    combined.includes('pec deck') ||
    combined.includes('leg press') ||
    combined.includes('hack squat') ||
    combined.includes('pendulum') ||
    combined.includes('v-squat')
  ) {
    return 'machine';
  }
  if (
    combined.includes('bodyweight') ||
    combined.includes('push-up') ||
    combined.includes('pull-up') ||
    combined.includes('chin-up') ||
    combined.includes('dip') ||
    combined.includes('dead hang') ||
    combined.includes('inverted row')
  ) {
    return 'bodyweight';
  }
  if (
    combined.includes('cardio') ||
    combined.includes('treadmill') ||
    combined.includes('bike') ||
    combined.includes('cycling') ||
    combined.includes('rower') ||
    combined.includes('rowing machine') ||
    combined.includes('skierg') ||
    combined.includes('stairmaster') ||
    combined.includes('elliptical') ||
    combined.includes('swimming') ||
    combined.includes('hiking')
  ) {
    return 'cardio';
  }
  if (combined.includes('plate')) return 'plate';
  if (combined.includes('warm-up') || combined.includes('warm up') || combined.includes('mobility')) return 'warm-up';
  if (combined.includes('carry') || combined.includes("farmer's walk") || combined.includes('sled')) return 'carry';

  return 'unknown';
}

function getExerciseSymbolVariant(name: string, category: ExerciseEquipmentCategory): ExerciseSymbolVariant {
  if (name.includes('ez-bar')) return 'ez-bar';
  if (name.includes('leg press') || name.includes('hack squat') || name.includes('pendulum') || name.includes('v-squat')) return 'leg-machine';
  if (name.includes('pull-up') || name.includes('chin-up') || name.includes('dead hang') || name.includes('towel hang')) return 'pull-up';
  if (name.includes('dip')) return 'dip';
  if (name.includes('push-up') || name.includes('scapular push-up')) return 'push-up';
  if (name.includes('hold') || name.includes('plank') || name.includes('wall sit')) return 'hold';
  if (name.includes('treadmill')) return 'treadmill';
  if (name.includes('bike') || name.includes('cycling')) return 'bike';
  if (name.includes('rowing')) return 'rower';
  if (name.includes('skierg')) return 'skierg';
  if (name.includes('stairmaster')) return 'stairs';
  if (name.includes('elliptical') || name.includes('cross trainer')) return 'elliptical';
  if (name.includes('swimming')) return 'swim';
  if (name.includes('hiking')) return 'hike';
  if (name.includes('jump rope')) return 'jump-rope';
  if (name.includes('battle ropes')) return 'battle-ropes';
  if (name.includes('sled')) return 'sled';
  if (name.includes('box jump')) return 'box-jump';
  if (name.includes('band') || name.includes('banded')) return 'band';
  if (name.includes('dead bug') || name.includes('bird dog') || name.includes('pallof') || name.includes('cable crunch') || name.includes('leg raise')) return 'core';
  if (
    name.includes('arm circle') ||
    name.includes('leg swing') ||
    name.includes('hip circle') ||
    name.includes('wall slide') ||
    name.includes('ankle rock') ||
    name.includes('dynamic warm-up') ||
    name.includes('shoulder dislocate')
  ) {
    return 'mobility';
  }
  return category;
}

function BarbellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 12h40" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M17.5 9.2v6.6M30.5 9.2v6.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8 6.5v13M10.8 7.5v11M13.5 8.8v8.4" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
      <path d="M40 6.5v13M37.2 7.5v11M34.5 8.8v8.4" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
      <path d="M20 12h8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.28" />
    </svg>
  );
}

function EzBarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 12h8l4-3.2 4 6.4 4-6.4 4 6.4 4-6.4 4 3.2h8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 7v10M10.6 8v8M37.4 8v8M40 7v10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function DumbbellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 34 24" fill="none" className={className} aria-hidden="true">
      <path d="M11 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6.2 8.2 9.2 6.8l2 3.9-3 1.4-2-3.9ZM4.5 14.8l3-1.4 2 3.9-3 1.4-2-3.9Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="m24.8 10.7 2-3.9 3 1.4-2 3.9-3-1.4ZM26.5 17.3l2-3.9 3 1.4-2 3.9-3-1.4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function CableIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className} aria-hidden="true">
      <path d="M6 4v20M22 4v20M6 4h16M6 24h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="14" cy="6.2" r="1.8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14 8.2c3.4 2.7 3.3 5.2-.2 7.8-2.4 1.8-2.6 3.2-.7 5" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" />
      <path d="M9.8 13.2h5.5M9.8 16.4h5.5M9.8 19.6h5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.62" />
      <path d="M16.2 21.2h4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function KettlebellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className} aria-hidden="true">
      <path d="M9.6 12V9.4a4.4 4.4 0 0 1 8.8 0V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8.1 12.3h11.8l1.3 8.2a2.6 2.6 0 0 1-2.6 3H9.4a2.6 2.6 0 0 1-2.6-3l1.3-8.2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M11.2 17.8h5.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity="0.42" />
    </svg>
  );
}

function MachineIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className} aria-hidden="true">
      <path d="M6.5 4v20M22 4v20M6.5 4h15.5M6.5 24h15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9.5 8.2h5.3v13H9.5z" stroke="currentColor" strokeWidth="1.55" strokeLinejoin="round" />
      <path d="M9.5 11.4h5.3M9.5 14.6h5.3M9.5 17.8h5.3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" opacity="0.62" />
      <path d="M16.5 10.2h3.6v5.3h-3.6zM17.2 19.6h4.2" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function LegMachineIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 28" fill="none" className={className} aria-hidden="true">
      <path d="M5.5 22h19M8 18.5 19.8 7.6M10.2 21.8 23 9.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 18h7.4l3.2-3H10.2L7 18Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M19.2 6.2h4.2v9.8h-4.2z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M23.4 7.8h2.2M23.4 14.4h2.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function SmithMachineIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className} aria-hidden="true">
      <path d="M6 4v20M22 4v20M6 4h16M6 24h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.4 12.2h13.2M11 8.4v7.6M19 8.4v7.6" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" />
      <path d="M8.4 7.2h13.2M8.4 18.8h13.2" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" opacity="0.48" />
      <path d="m7 10 2-1.6M21 10l-2-1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

function TrapBarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 42 26" fill="none" className={className} aria-hidden="true">
      <path d="M14 6.5h14l5 6.5-5 6.5H14L9 13l5-6.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M3.5 13H9M33 13h5.5M17.2 13h7.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5.7 9.3v7.4M36.3 9.3v7.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PlateIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className} aria-hidden="true">
      <circle cx="14" cy="14" r="9.2" stroke="currentColor" strokeWidth="2" />
      <circle cx="14" cy="14" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M14 5v3M14 20v3M5 14h3M20 14h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity="0.68" />
      <path d="m8 8 2.1 2.1M20 8l-2.1 2.1M8 20l2.1-2.1M20 20l-2.1-2.1" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
}

function BodyweightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className} aria-hidden="true">
      <circle cx="14" cy="6.2" r="2.3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M14 8.8v6.2M9.2 12.2H18.8M10.3 22l3.7-7 3.7 7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 20h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
}

function PullUpIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className} aria-hidden="true">
      <path d="M5 5h18M7 5v4M21 5v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="14" cy="10.2" r="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9.5 7.8 14 13.4l4.5-5.6M14 13.2v5.5M10.5 22l3.5-3.3 3.5 3.3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DipIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className} aria-hidden="true">
      <path d="M6 8v16M22 8v16M5 12h7M16 12h7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <circle cx="14" cy="8.8" r="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M10.5 12.2 14 14.8l3.5-2.6M14 14.8v5.2M11.5 23l2.5-3 2.5 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PushUpIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 24" fill="none" className={className} aria-hidden="true">
      <path d="M3.5 19.5h23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <circle cx="8.2" cy="11.6" r="1.8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 12.2 17.5 9l5.7 4.6M14.5 10.5l3.6 7M22.8 13.6l2.8 4.4M6.4 13l-2.8 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HoldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 18h22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
      <circle cx="7.2" cy="13" r="1.7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 13.5h8.5l5.2 3.5M12.2 13.5l1.2 4.2M20.7 15.2l-1.8 2.7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M23.7 7.4v5M21.2 9.9h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.65" />
    </svg>
  );
}

function TreadmillIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 34 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 17.8h19.5l5.5-4.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 20h17M26 7.5l3.3 6.2M23.2 7.5h5.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="m12 9 3.4 3.2 4.2-1.5M15.4 12.2l-1.4 4M19.6 10.7l1.8 3.5" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="11" cy="7.4" r="1.6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function BikeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 34 24" fill="none" className={className} aria-hidden="true">
      <circle cx="9" cy="17" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="25" cy="17" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 17h5l4.2-7H12l-3 7ZM18.2 10 25 17M15.5 7.2h4.7M20.2 7.2l-2 2.8M12 10l-1.2-3.2M8.5 6.8h4" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RowerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 34 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 18h24M11 16h8M22.5 11.5l4-5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="15" cy="8" r="1.7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13.5 9.8 18 13.8l5.2-1.6M18 13.8l-3.5 2.2M24.2 12.2l-2.6 4" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M27.2 5.6h2.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function SkiErgIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 28" fill="none" className={className} aria-hidden="true">
      <path d="M6 4h18M8 4v20M22 4v20M8 24h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15 6.2c2.2 3.2 2.2 6.4 0 9.6M11.5 9.2l3.5 6.6 3.5-6.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.5 19.5h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function StairsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className} aria-hidden="true">
      <path d="M5 22h18M5 22v-4h4v-4h4v-4h4V6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="6.5" r="1.7" stroke="currentColor" strokeWidth="1.5" />
      <path d="m10.5 8.2 3 2.8-2 3.4M13.5 11l3.2-.9" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EllipticalIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 28" fill="none" className={className} aria-hidden="true">
      <path d="M8 23c4.4-1.8 8.6-1.8 14 0M15 23V10M9 5l6 5 6-5M9 5v11M21 5v11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.8 17.5c2.2 1.4 4.6 1.6 7.2.3 2.6-1.3 5-1.2 7.2.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function SwimIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 18c2-1.4 4-1.4 6 0s4 1.4 6 0 4-1.4 6 0 4 1.4 6 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="19.5" cy="7" r="1.9" stroke="currentColor" strokeWidth="1.6" />
      <path d="m9 14 6-5 4 3.2M15 9l-2.3 5.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HikeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 28" fill="none" className={className} aria-hidden="true">
      <path d="m4 22 5.5-7 4.1 5 3.6-4.7L24 22H4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="18.2" cy="7" r="1.8" stroke="currentColor" strokeWidth="1.5" />
      <path d="m17 9.2-2.2 5.2 3.2 2.4M16 12l4.2 1.4M18 16.8l-1.5 4.2M14.8 14.4l-2.6 2.8" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function JumpRopeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 28" fill="none" className={className} aria-hidden="true">
      <circle cx="15" cy="7" r="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M15 9v6.5M10.5 12.5 15 15.5l4.5-3M12 22l3-6.5 3 6.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 8.5c-4.5 6-1.5 14 8 14s12.5-8 8-14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.65" />
    </svg>
  );
}

function BattleRopesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 34 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 17c4-6 8 6 12 0s8 6 12 0M4 11c4-6 8 6 12 0s8 6 12 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M27.5 8.5h3M27.5 14.5h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SledIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 34 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 18h21M10 18 7 9M21 18l4-9M8 9h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 9V5.5M18 9V5.5M12.3 5.5h7.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M27 9l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BoxJumpIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 28" fill="none" className={className} aria-hidden="true">
      <path d="M5 21h12v-7H5v7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="19" cy="6.5" r="1.7" stroke="currentColor" strokeWidth="1.5" />
      <path d="m17.8 8.3-3.2 3.5 3.4 3.1M16 11.8h4.8M18 14.9l3.2 3.8" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BandIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 12c0-4.2 4-7 9-7s9 2.8 9 7-4 7-9 7-9-2.8-9-7Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 12h12M11.5 9.4v5.2M18.5 9.4v5.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

function MobilityIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className} aria-hidden="true">
      <circle cx="14" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14 8.8v6M8.3 11.5c3.3-2.3 8.1-2.3 11.4 0M9.5 21l4.5-6.2 4.5 6.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 7.5c1.1-2 2.9-3.5 5.2-4.2M22.5 7.5c-1.1-2-2.9-3.5-5.2-4.2" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

function CoreIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className} aria-hidden="true">
      <path d="M10.2 6.2h7.6l2.1 5.6-1.5 10H9.6l-1.5-10 2.1-5.6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 6.4v15.2M10.1 11h7.8M10.5 15h7M11 19h6" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" opacity="0.66" />
      <path d="M8.1 11.8 5.5 9M19.9 11.8 22.5 9" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
    </svg>
  );
}

function CarryIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 28" fill="none" className={className} aria-hidden="true">
      <circle cx="15" cy="6.5" r="1.9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M15 8.8v6M10.2 12.2H19.8M11 22l4-7 4 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.8 14.5h4l.7 5.7a1.4 1.4 0 0 1-1.4 1.6H6.5a1.4 1.4 0 0 1-1.4-1.6l.7-5.7ZM20.2 14.5h4l.7 5.7a1.4 1.4 0 0 1-1.4 1.6h-2.6a1.4 1.4 0 0 1-1.4-1.6l.7-5.7Z" stroke="currentColor" strokeWidth="1.55" strokeLinejoin="round" />
    </svg>
  );
}

function WarmUpIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className} aria-hidden="true">
      <path d="M15.2 4.5c.9 3.6 4.7 4.7 4.7 9.2a6.9 6.9 0 0 1-13.8 0c0-3 1.7-5.2 4.2-7.6-.1 2 .8 3.3 2.3 4.4.3-2.8 1-4.8 2.6-6Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.2 17.3c0 1.8 1.2 3.1 2.8 3.1s2.8-1.3 2.8-3.1c0-1.5-.8-2.7-2.3-4-.2 1.4-.6 2.4-1.3 3-.5-.8-.7-1.5-.6-2.4-1.5 1.2-2.4 2.3-2.4 3.4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" opacity="0.62" />
    </svg>
  );
}

function UnknownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className} aria-hidden="true">
      <path d="M8 14h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6.5 10v8M21.5 10v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M19.5 5.5v3M18 7h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.68" />
    </svg>
  );
}

function getIconClassName(variant: ExerciseSymbolVariant, size: 'sm' | 'md') {
  if (
    variant === 'barbell' ||
    variant === 'ez-bar' ||
    variant === 'trap-bar' ||
    variant === 'treadmill' ||
    variant === 'bike' ||
    variant === 'rower' ||
    variant === 'battle-ropes' ||
    variant === 'sled' ||
    variant === 'push-up' ||
    variant === 'hold' ||
    variant === 'hike' ||
    variant === 'swim'
  ) {
    return sizeClasses[size].wideIcon;
  }

  if (variant === 'pull-up' || variant === 'dip' || variant === 'skierg' || variant === 'stairs' || variant === 'elliptical') {
    return sizeClasses[size].tallIcon;
  }

  return sizeClasses[size].icon;
}

function renderIcon(variant: ExerciseSymbolVariant, iconClassName: string) {
  switch (variant) {
    case 'barbell':
      return <BarbellIcon className={iconClassName} />;
    case 'ez-bar':
      return <EzBarIcon className={iconClassName} />;
    case 'dumbbell':
      return <DumbbellIcon className={iconClassName} />;
    case 'cable':
      return <CableIcon className={iconClassName} />;
    case 'machine':
      return <MachineIcon className={iconClassName} />;
    case 'leg-machine':
      return <LegMachineIcon className={iconClassName} />;
    case 'smith-machine':
      return <SmithMachineIcon className={iconClassName} />;
    case 'trap-bar':
      return <TrapBarIcon className={iconClassName} />;
    case 'kettlebell':
      return <KettlebellIcon className={iconClassName} />;
    case 'plate':
      return <PlateIcon className={iconClassName} />;
    case 'bodyweight':
      return <BodyweightIcon className={iconClassName} />;
    case 'pull-up':
      return <PullUpIcon className={iconClassName} />;
    case 'dip':
      return <DipIcon className={iconClassName} />;
    case 'push-up':
      return <PushUpIcon className={iconClassName} />;
    case 'hold':
      return <HoldIcon className={iconClassName} />;
    case 'treadmill':
      return <TreadmillIcon className={iconClassName} />;
    case 'bike':
      return <BikeIcon className={iconClassName} />;
    case 'rower':
      return <RowerIcon className={iconClassName} />;
    case 'skierg':
      return <SkiErgIcon className={iconClassName} />;
    case 'stairs':
      return <StairsIcon className={iconClassName} />;
    case 'elliptical':
      return <EllipticalIcon className={iconClassName} />;
    case 'swim':
      return <SwimIcon className={iconClassName} />;
    case 'hike':
      return <HikeIcon className={iconClassName} />;
    case 'jump-rope':
      return <JumpRopeIcon className={iconClassName} />;
    case 'battle-ropes':
      return <BattleRopesIcon className={iconClassName} />;
    case 'sled':
      return <SledIcon className={iconClassName} />;
    case 'box-jump':
      return <BoxJumpIcon className={iconClassName} />;
    case 'band':
      return <BandIcon className={iconClassName} />;
    case 'mobility':
      return <MobilityIcon className={iconClassName} />;
    case 'core':
      return <CoreIcon className={iconClassName} />;
    case 'carry':
      return <CarryIcon className={iconClassName} />;
    case 'warm-up':
      return <WarmUpIcon className={iconClassName} />;
    default:
      return <UnknownIcon className={iconClassName} />;
  }
}

export function ExerciseEquipmentIcon({
  exercise,
  equipment,
  category,
  active = false,
  size = 'md',
  className = '',
}: ExerciseEquipmentIconProps) {
  const resolvedCategory = getExerciseEquipmentCategory(exercise, equipment, category);
  const name = normalize(exercise?.name);
  const variant = getExerciseSymbolVariant(name, resolvedCategory);
  const styles = sizeClasses[size];
  const shellClassName = [
    styles.shell,
    'flex shrink-0 items-center justify-center border transition-colors',
    active
      ? 'border-blue-300/45 bg-blue-500/15 text-blue-100 shadow-[0_0_18px_rgba(59,130,246,0.16)]'
      : 'border-white/10 bg-white/[0.035] text-zinc-400',
    className,
  ].join(' ');

  return (
    <div className={shellClassName} title={variant.replace('-', ' ')}>
      {renderIcon(variant, getIconClassName(variant, size))}
    </div>
  );
}

import {
  Activity,
  Bike,
  Flame,
  Footprints,
  Sparkles,
} from 'lucide-react';
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
  },
  md: {
    shell: 'h-12 w-12 rounded-2xl',
    icon: 'h-6 w-6',
    wideIcon: 'h-6 w-8',
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

function BarbellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 12h32" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M12 8.5v7M28 8.5v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 7v10M9.5 8v8M30.5 8v8M33 7v10" stroke="currentColor" strokeWidth="2.15" strokeLinecap="round" />
      <path d="M15 12h10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.28" />
    </svg>
  );
}

function DumbbellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 24" fill="none" className={className} aria-hidden="true">
      <path d="M9 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 8.5v7M8.5 9.5v5M23.5 9.5v5M26 8.5v7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function CableIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M7 4v16M17 4v16M7 4h10M7 20h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 5.5c3 2.6 3 5.4 0 8s-3 4.7 0 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="5.5" r="1.7" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9.5 14h5M10.5 17.5h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function KettlebellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M8.25 10V8.2a3.75 3.75 0 0 1 7.5 0V10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M7.2 10.5h9.6l1.2 7.2A2 2 0 0 1 16 20H8a2 2 0 0 1-2-2.3l1.2-7.2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M10 15h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity="0.35" />
    </svg>
  );
}

function MachineIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 4v16M18 4v16M6 4h12M6 20h12" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M9 8h6v8H9z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 8v8M9 11h6M9 14h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.65" />
    </svg>
  );
}

function BodyweightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 5h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.9" />
      <path d="M8.5 7.2 12 12l3.5-4.8M12 11.8v4.7M9 20l3-3.5 3 3.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlateIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 4v3M12 17v3M4 12h3M17 12h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity="0.65" />
    </svg>
  );
}

function CarryIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M8.5 10V8.5A3.5 3.5 0 0 1 12 5a3.5 3.5 0 0 1 3.5 3.5V10" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M7 10h10l1 8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2l1-8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9.5 14h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
}

function SmithMachineIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5.5 4v16M18.5 4v16M5.5 4h13M5.5 20h13" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M7.5 11.5h9M9 8.5v6M15 8.5v6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M7.5 7h9M7.5 17h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
}

function TrapBarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M11 6.5h10l4 5.5-4 5.5H11L7 12l4-5.5Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path d="M2.5 12H7M25 12h4.5M13 12h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CardioIcon({ name, className }: { name: string; className?: string }) {
  if (name.includes('bike') || name.includes('cycling')) {
    return <Bike className={className} strokeWidth={2} aria-hidden="true" />;
  }
  if (name.includes('walk') || name.includes('run') || name.includes('treadmill')) {
    return <Footprints className={className} strokeWidth={2} aria-hidden="true" />;
  }
  return <Activity className={className} strokeWidth={2} aria-hidden="true" />;
}

function UnknownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M7 12h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5.5 9v6M18.5 9v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <Sparkles className="h-2.5 w-2.5" x="14.5" y="4.5" strokeWidth={2} />
    </svg>
  );
}

function getIconClassName(category: ExerciseEquipmentCategory, size: 'sm' | 'md') {
  if (category === 'barbell' || category === 'trap-bar') return sizeClasses[size].wideIcon;
  return sizeClasses[size].icon;
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
  const styles = sizeClasses[size];
  const name = normalize(exercise?.name);
  const shellClassName = [
    styles.shell,
    'flex shrink-0 items-center justify-center border transition-colors',
    active
      ? 'border-blue-300/45 bg-blue-500/15 text-blue-100 shadow-[0_0_18px_rgba(59,130,246,0.16)]'
      : 'border-white/10 bg-white/[0.035] text-zinc-400',
    className,
  ].join(' ');
  const iconClassName = getIconClassName(resolvedCategory, size);

  let icon;
  if (resolvedCategory === 'barbell') {
    icon = <BarbellIcon className={iconClassName} />;
  } else if (resolvedCategory === 'dumbbell') {
    icon = <DumbbellIcon className={iconClassName} />;
  } else if (resolvedCategory === 'cable') {
    icon = <CableIcon className={iconClassName} />;
  } else if (resolvedCategory === 'machine') {
    icon = <MachineIcon className={iconClassName} />;
  } else if (resolvedCategory === 'bodyweight') {
    icon = <BodyweightIcon className={iconClassName} />;
  } else if (resolvedCategory === 'kettlebell') {
    icon = <KettlebellIcon className={iconClassName} />;
  } else if (resolvedCategory === 'plate') {
    icon = <PlateIcon className={iconClassName} />;
  } else if (resolvedCategory === 'carry') {
    icon = <CarryIcon className={iconClassName} />;
  } else if (resolvedCategory === 'smith-machine') {
    icon = <SmithMachineIcon className={iconClassName} />;
  } else if (resolvedCategory === 'trap-bar') {
    icon = <TrapBarIcon className={iconClassName} />;
  } else if (resolvedCategory === 'cardio') {
    icon = <CardioIcon name={name} className={iconClassName} />;
  } else if (resolvedCategory === 'warm-up') {
    icon = <Flame className={iconClassName} strokeWidth={2} aria-hidden="true" />;
  } else {
    icon = <UnknownIcon className={iconClassName} />;
  }

  return (
    <div className={shellClassName} title={resolvedCategory.replace('-', ' ')}>
      {icon}
    </div>
  );
}

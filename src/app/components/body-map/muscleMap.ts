import type { BodyPartSlug } from '.';

export type BodyMapGender = 'male' | 'female';

export type BodyMapMuscle =
  | 'Chest'
  | 'Back'
  | 'Biceps'
  | 'Triceps'
  | 'Quads'
  | 'Hamstrings'
  | 'Glutes'
  | 'Delts'
  | 'Calves'
  | 'Forearms'
  | 'Core'
  | 'Abs';

export interface BodyMapMuscleStatus {
  status: string;
  color?: string;
  weeklySets?: number;
}

export const muscleToBodySlugs: Record<BodyMapMuscle, BodyPartSlug[]> = {
  Chest: ['chest'],
  Back: ['upper-back', 'lower-back', 'trapezius'],
  Biceps: ['biceps'],
  Triceps: ['triceps'],
  Quads: ['quadriceps', 'adductors'],
  Hamstrings: ['hamstring'],
  Glutes: ['gluteal'],
  Delts: ['deltoids'],
  Calves: ['calves', 'tibialis'],
  Forearms: ['forearm'],
  Core: ['abs', 'obliques'],
  Abs: ['abs', 'obliques'],
};

export const bodySlugToMuscle = Object.entries(muscleToBodySlugs).reduce(
  (map, [muscle, slugs]) => {
    slugs.forEach((slug) => {
      if (!map[slug]) {
        map[slug] = muscle as BodyMapMuscle;
      }
    });
    return map;
  },
  {} as Partial<Record<BodyPartSlug, BodyMapMuscle>>,
);

export function normalizeBodyMapMuscle(muscle: string) {
  return muscle === 'Abs' ? 'Core' : muscle;
}

export function getBodyGenderFromProfile(profile?: { gender?: string | null } | null): BodyMapGender {
  const gender = profile?.gender?.trim().toLowerCase();
  if (gender === 'female' || gender === 'woman') return 'female';
  return 'male';
}

export function getSlugsForSelectedMuscles(selectedMuscles: string[]) {
  const selected = new Set<BodyPartSlug>();

  selectedMuscles.forEach((muscle) => {
    const normalized = normalizeBodyMapMuscle(muscle) as BodyMapMuscle;
    muscleToBodySlugs[normalized]?.forEach((slug) => selected.add(slug));
  });

  return selected;
}

export function getStatusForSlug(
  slug: BodyPartSlug | undefined,
  muscleStatuses?: Record<string, BodyMapMuscleStatus>,
) {
  if (!slug || !muscleStatuses) return undefined;
  const muscle = bodySlugToMuscle[slug];
  if (!muscle) return undefined;

  return muscleStatuses[muscle] ?? muscleStatuses[normalizeBodyMapMuscle(muscle)];
}

export function getMuscleForSlug(slug: BodyPartSlug | undefined) {
  return slug ? bodySlugToMuscle[slug] : undefined;
}


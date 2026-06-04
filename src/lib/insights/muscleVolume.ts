import { commonInsightMuscles } from './exerciseMetadata';
import { isValidTrainingSet } from './performance';
import type { InsightWorkout, InsightWorkoutExercise, MuscleVolumeAnalysis, MuscleVolumeSummary } from './types';

function normalizeDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function daysBetween(from: Date, to: Date) {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

const fallbackContributionWeights = [1, 0.5, 0.35, 0.25];

function createContributionMap(entries: Array<[string, number]>, fallbackMuscles: string[]) {
  const contribution = new Map<string, number>();

  fallbackMuscles.forEach((muscle, index) => {
    contribution.set(muscle, fallbackContributionWeights[index] ?? 0.25);
  });

  entries.forEach(([muscle, weight]) => {
    contribution.set(muscle, weight);
  });

  return contribution;
}

function getMuscleSetContributions(exercise: InsightWorkoutExercise) {
  const name = exercise.exerciseName.toLowerCase();
  const muscles = exercise.mainMuscles;

  // Effective sets intentionally do not give every listed muscle a full set.
  // A bench press is a full chest stimulus, but only partial delt/triceps work.
  if (muscles.includes('Warm-up')) {
    return createContributionMap(
      muscles.map((muscle) => [muscle, muscle === 'Warm-up' ? 1 : muscle === 'Cardio' ? 0.5 : 0] as [string, number]),
      muscles,
    );
  }

  if (name.includes('run') || name.includes('walk') || name.includes('bike') || name.includes('cycling') || name.includes('stairmaster')) {
    return createContributionMap([['Cardio', 1]], muscles);
  }

  if (name.includes('close-grip') || name.includes('jm press') || name.includes('triceps dip') || name.includes('bench dip')) {
    return createContributionMap(
      [
        ['Triceps', 1],
        ['Chest', 0.5],
        ['Delts', 0.25],
      ],
      muscles,
    );
  }

  if (name.includes('fly') || name.includes('pec deck')) {
    return createContributionMap(
      [
        ['Chest', 1],
        ['Delts', 0],
        ['Triceps', 0],
      ],
      muscles,
    );
  }

  if (name.includes('bench press') || name.includes('chest press') || name.includes('push-up') || name.includes('chest dip')) {
    return createContributionMap(
      [
        ['Chest', 1],
        ['Triceps', 0.5],
        ['Delts', 0.25],
      ],
      muscles,
    );
  }

  if (
    name.includes('overhead press') ||
    name.includes('shoulder press') ||
    name.includes('arnold press') ||
    name.includes('landmine press') ||
    name.includes('push press')
  ) {
    return createContributionMap(
      [
        ['Delts', 1],
        ['Triceps', 0.5],
        ['Chest', 0],
      ],
      muscles,
    );
  }

  if (name.includes('lateral raise') || name.includes('front raise') || name.includes('rear delt raise')) {
    return createContributionMap([['Delts', 1]], muscles);
  }

  if (name.includes('face pull') || name.includes('reverse pec deck') || name.includes('rear delt row')) {
    return createContributionMap(
      [
        ['Delts', 0.75],
        ['Back', 0.5],
        ['Biceps', 0],
        ['Forearms', 0],
      ],
      muscles,
    );
  }

  if (name.includes('pull-up') || name.includes('chin-up') || name.includes('pulldown')) {
    return createContributionMap(
      [
        ['Back', 1],
        ['Biceps', 0.5],
        ['Forearms', 0.25],
      ],
      muscles,
    );
  }

  if (name.includes('row') || name.includes('pullover')) {
    return createContributionMap(
      [
        ['Back', 1],
        ['Biceps', 0.5],
        ['Forearms', 0.25],
      ],
      muscles,
    );
  }

  if (name.includes('curl')) {
    return createContributionMap(
      [
        ['Biceps', 1],
        ['Forearms', name.includes('hammer') || name.includes('reverse') ? 0.5 : 0.25],
      ],
      muscles,
    );
  }

  if (name.includes('pushdown') || name.includes('skullcrusher') || name.includes('triceps extension') || name.includes('kickback')) {
    return createContributionMap([['Triceps', 1]], muscles);
  }

  if (name.includes('leg extension') || name.includes('sissy squat') || name.includes('spanish squat')) {
    return createContributionMap([['Quads', 1]], muscles);
  }

  if (name.includes('leg curl') || name.includes('nordic hamstring')) {
    return createContributionMap([['Hamstrings', 1]], muscles);
  }

  if (name.includes('squat') || name.includes('leg press') || name.includes('lunge') || name.includes('step-up')) {
    return createContributionMap(
      [
        ['Quads', 1],
        ['Hamstrings', 0.5],
        ['Glutes', muscles.includes('Glutes') ? 0.25 : 0],
      ],
      muscles,
    );
  }

  if (name.includes('hip thrust') || name.includes('glute bridge')) {
    return createContributionMap(
      [
        ['Glutes', 1],
        ['Hamstrings', 0.5],
      ],
      muscles,
    );
  }

  if (
    name.includes('deadlift') ||
    name.includes('good morning') ||
    name.includes('back extension') ||
    name.includes('glute-ham') ||
    name.includes('pull-through') ||
    name.includes('kettlebell swing')
  ) {
    return createContributionMap(
      [
        ['Hamstrings', 1],
        ['Glutes', muscles.includes('Glutes') ? 0.75 : 0],
        ['Back', name.includes('back extension') ? 0.5 : 0.25],
        ['Forearms', name.includes('deadlift') || name.includes('romanian') ? 0.25 : 0],
      ],
      muscles,
    );
  }

  if (name.includes('calf raise') || name.includes('tibialis') || name.includes('toe raise')) {
    return createContributionMap([['Calves', 1]], muscles);
  }

  if (name.includes('pallof') || name.includes('plank') || name.includes('hollow') || name.includes('dead bug')) {
    return createContributionMap([['Core', 1]], muscles);
  }

  if (name.includes('carry') || name.includes("farmer's walk") || name.includes('suitcase')) {
    return createContributionMap(
      [
        ['Forearms', 1],
        ['Core', 0.5],
        ['Back', 0.25],
      ],
      muscles,
    );
  }

  if (name.includes('dead hang')) {
    return createContributionMap(
      [
        ['Forearms', 0.75],
        ['Back', 0.5],
      ],
      muscles,
    );
  }

  return createContributionMap([], muscles);
}

export function aggregateMuscleVolume(workouts: InsightWorkout[], asOf = new Date()): MuscleVolumeAnalysis {
  const last7 = new Map<string, number>();
  const last28 = new Map<string, number>();
  const previous28 = new Map<string, number>();
  const observedMuscles = new Set<string>(commonInsightMuscles);
  const recentWorkoutIds = new Set<string>();

  workouts.forEach((workout) => {
    const daysAgo = daysBetween(normalizeDate(workout.date), asOf);
    if (daysAgo >= 0 && daysAgo < 28) {
      recentWorkoutIds.add(workout.id);
    }

    workout.exercises.forEach((exercise) => {
      const contributions = getMuscleSetContributions(exercise);

      contributions.forEach((_, muscle) => observedMuscles.add(muscle));

      exercise.sets.filter((set) => isValidTrainingSet(set)).forEach(() => {
        contributions.forEach((weight, muscle) => {
          if (daysAgo >= 0 && daysAgo < 7) {
            last7.set(muscle, (last7.get(muscle) ?? 0) + weight);
          }
          if (daysAgo >= 0 && daysAgo < 28) {
            last28.set(muscle, (last28.get(muscle) ?? 0) + weight);
          }
          if (daysAgo >= 28 && daysAgo < 56) {
            previous28.set(muscle, (previous28.get(muscle) ?? 0) + weight);
          }
        });
      });
    });
  });

  const summaries: MuscleVolumeSummary[] = Array.from(observedMuscles)
    .map((muscle) => {
      const last28WeeklySets = (last28.get(muscle) ?? 0) / 4;
      const previous28WeeklySets = (previous28.get(muscle) ?? 0) / 4;
      const trendPct = previous28WeeklySets > 0 ? (last28WeeklySets - previous28WeeklySets) / previous28WeeklySets : 0;

      return {
        muscle,
        last7Sets: Number((last7.get(muscle) ?? 0).toFixed(1)),
        last28WeeklySets: Number(last28WeeklySets.toFixed(1)),
        previous28WeeklySets: Number(previous28WeeklySets.toFixed(1)),
        trendPct,
      };
    })
    .sort((a, b) => b.last28WeeklySets - a.last28WeeklySets);

  return {
    summaries,
    recentWorkoutCount: recentWorkoutIds.size,
  };
}

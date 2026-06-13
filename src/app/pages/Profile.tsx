import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowUp, Award, Calendar, Camera, ChevronLeft, ChevronRight, ImagePlus, LogOut, Settings, Target, Trash2, User } from 'lucide-react';
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { ExerciseFilterPicker } from '../components/ExerciseFilterPicker';
import { useAuth } from '../contexts/AuthContext';
import { useWorkout } from '../contexts/WorkoutContext';
import { RankBadge, getExerciseRank, type ExerciseRankResult, type ExerciseRankTier, type RankDivision } from '../features/exercise-ranks';
import { DataService, type CurrentGoalPreference, type PersonalRecord, type WorkoutRecord } from '../services/db';
import { exercises, getExerciseLogging, type LoggingFieldKey } from '../data/mockData';
import { formatDurationClock } from '../utils/timeFormatting';
import { getExerciseLiftedLoadVolume, getWorkoutLiftedLoadVolume } from '../utils/workoutVolume';

const rankTierScore: Record<ExerciseRankTier, number> = {
  Unranked: -1,
  Iron: 0,
  Bronze: 1,
  Silver: 2,
  Gold: 3,
  Platinum: 4,
  Diamond: 5,
  Ascendant: 6,
  Titan: 7,
  Apex: 8,
};

const rankDivisionScore: Record<RankDivision, number> = {
  I: 0,
  II: 1,
  III: 2,
};

function getRankSortScore(result: ExerciseRankResult) {
  if (result.status !== 'ranked') return -1;
  return rankTierScore[result.rank] * 3 + (result.division ? rankDivisionScore[result.division] : 3);
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const { isWorkoutActive, expandWorkout } = useWorkout();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const avatarImageRef = useRef<HTMLImageElement | null>(null);
  const [selectedRecordExerciseIds, setSelectedRecordExerciseIds] = useState<string[]>(() =>
    user ? DataService.getProgressPreferences(user.id).personalRecordExerciseIds : [],
  );
  const [currentGoals, setCurrentGoals] = useState<CurrentGoalPreference[]>(() =>
    user ? DataService.getProgressPreferences(user.id).currentGoals : [],
  );
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [workoutHistoryOpen, setWorkoutHistoryOpen] = useState(false);
  const [historyMonth, setHistoryMonth] = useState(() => new Date());
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<Date | null>(null);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [avatarSource, setAvatarSource] = useState<string | null>(null);
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarOffsetX, setAvatarOffsetX] = useState(0);
  const [avatarOffsetY, setAvatarOffsetY] = useState(0);
  const [avatarError, setAvatarError] = useState('');
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);
  const [allRanksOpen, setAllRanksOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const preferences = DataService.getProgressPreferences(user.id);
    setSelectedRecordExerciseIds(preferences.personalRecordExerciseIds);
    setCurrentGoals(preferences.currentGoals);
  }, [user?.id]);

  const profile = useMemo(() => {
    if (!user) return null;
    const workouts = DataService.getWorkoutsByUserId(user.id);
    const summary = DataService.getWorkoutSummary(user.id);
    const records = DataService.getPersonalRecords(user.id);
    const displayRecords = DataService.getPersonalRecordsForExercises(user.id, selectedRecordExerciseIds);
    const goalRecords = DataService.getPersonalRecordsForExercises(user.id, currentGoals.map((goal) => goal.exerciseId));
    const exerciseOptions = DataService.getProgressExerciseOptions(user.id);
    const streak = DataService.getWorkoutStreak(user.id);

    return { workouts, summary, records, displayRecords, goalRecords, exerciseOptions, streak };
  }, [currentGoals, selectedRecordExerciseIds, user]);

  if (!user || !profile) return null;

  const recordsByExerciseId = new Map(profile.records.map((record) => [record.exerciseId, record]));
  const rankResults = useMemo(
    () =>
      profile.exerciseOptions
        .map((exercise) => getExerciseRank(exercise, profile.workouts, user.weight, user.gender))
        .filter((result): result is ExerciseRankResult => Boolean(result?.eligible))
        .sort((a, b) => {
          const rankScore = getRankSortScore(b) - getRankSortScore(a);
          if (rankScore !== 0) return rankScore;
          return (b.estimatedOneRepMax ?? 0) - (a.estimatedOneRepMax ?? 0);
        }),
    [profile.exerciseOptions, profile.workouts, user.gender, user.weight],
  );
  const topRankResults = useMemo(
    () => rankResults.filter((result) => result.status === 'ranked').slice(0, 3),
    [rankResults],
  );

  const calendarStart = startOfWeek(startOfMonth(historyMonth), { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(endOfMonth(historyMonth), { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const workoutsInHistoryMonth = profile.workouts.filter((workout) =>
    isSameMonth(new Date(`${workout.date}T00:00:00`), historyMonth),
  );

  const formatRecordLift = (record: PersonalRecord) => {
    if (!record.hasRecord) return '-';
    return `${record.weight} kg x ${record.reps}`;
  };

  const formatRecordEstimate = (record: PersonalRecord) => {
    if (!record.hasRecord) return '- est. 1RM';
    return `${record.estimatedOneRepMax} est. 1RM`;
  };

  const formatRankEstimate = (result: ExerciseRankResult) => {
    if (!result.estimatedOneRepMax) return '-';
    return `${Math.round(result.estimatedOneRepMax).toLocaleString()} kg est. 1RM`;
  };

  const handleLogout = () => {
    logout();
    navigate('/auth/login', { replace: true });
  };

  const togglePersonalRecordExercise = (exerciseId: string) => {
    const next = selectedRecordExerciseIds.includes(exerciseId)
      ? selectedRecordExerciseIds.filter((id) => id !== exerciseId)
      : [...selectedRecordExerciseIds, exerciseId];

    setSelectedRecordExerciseIds(next);
    DataService.updateProgressPreferences(user.id, {
      personalRecordExerciseIds: next,
    });
  };

  const getGoalRecord = (exerciseId: string) =>
    profile.goalRecords.find((record) => record.exerciseId === exerciseId);

  const getGoalTargetWeight = (goal: CurrentGoalPreference, record?: PersonalRecord) => {
    if (goal.targetWeight > 0) return goal.targetWeight;
    if (record?.hasRecord) return Math.ceil(record.weight * 1.12);
    return 0;
  };

  const saveCurrentGoals = (nextGoals: CurrentGoalPreference[]) => {
    const normalizedGoals = nextGoals.slice(0, 3).map((goal) => ({
      exerciseId: goal.exerciseId,
      targetWeight: Math.max(0, Number(goal.targetWeight) || 0),
    }));
    setCurrentGoals(normalizedGoals);
    DataService.updateProgressPreferences(user.id, {
      currentGoals: normalizedGoals,
    });
  };

  const toggleCurrentGoalExercise = (exerciseId: string) => {
    if (currentGoals.some((goal) => goal.exerciseId === exerciseId)) {
      saveCurrentGoals(currentGoals.filter((goal) => goal.exerciseId !== exerciseId));
      return;
    }

    if (currentGoals.length >= 3) return;
    const record = DataService.getPersonalRecordsForExercises(user.id, [exerciseId])[0];
    saveCurrentGoals([
      ...currentGoals,
      {
        exerciseId,
        targetWeight: record?.hasRecord ? Math.ceil(record.weight * 1.12) : 0,
      },
    ]);
  };

  const updateCurrentGoalTarget = (exerciseId: string, targetWeight: number) => {
    saveCurrentGoals(
      currentGoals.map((goal) =>
        goal.exerciseId === exerciseId
          ? { ...goal, targetWeight }
          : goal,
      ),
    );
  };

  const getWorkoutsForDay = (day: Date) =>
    profile.workouts.filter((workout) => isSameDay(new Date(`${workout.date}T00:00:00`), day));

  const getWorkoutSetCount = (workout: WorkoutRecord) =>
    workout.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);

  const getWorkoutTotalWeight = (workout: WorkoutRecord) => getWorkoutLiftedLoadVolume(workout);

  const formatWorkoutTotalWeight = (workout: WorkoutRecord) => {
    const total = getWorkoutTotalWeight(workout);
    return `${Math.round(total).toLocaleString()} kg lifted`;
  };

  const formatExerciseHistorySummary = (exercise: WorkoutRecord['exercises'][number]) => {
    const exerciseMeta = exercises.find((item) => item.id === exercise.exerciseId);
    const logging = getExerciseLogging(exerciseMeta);
    const hasLoadVolume = logging.fields.some((field) => field.key === 'weight') && logging.fields.some((field) => field.key === 'reps');
    const volume = getExerciseLiftedLoadVolume(exercise);

    return hasLoadVolume
      ? `${exercise.sets.length} sets - ${Math.round(volume).toLocaleString()} kg`
      : `${exercise.sets.length} sets - ${logging.label}`;
  };

  const selectedHistoryWorkouts = selectedHistoryDate ? getWorkoutsForDay(selectedHistoryDate) : [];

  const formatWorkoutSet = (
    set: WorkoutRecord['exercises'][number]['sets'][number],
    exerciseId: string,
  ) => {
    const exercise = exercises.find((item) => item.id === exerciseId);
    const logging = getExerciseLogging(exercise);
    const values = logging.fields
      .map((field) => {
        const value = Number(set[field.key as LoggingFieldKey] ?? 0);
        if (value <= 0 && field.key !== 'rir') return null;
        if (field.key === 'duration') return `${field.label}: ${formatDurationClock(value, field.unit)}`;
        return `${field.label}: ${Number.isInteger(value) ? value : value.toFixed(1)}${field.unit ? ` ${field.unit}` : ''}`;
      })
      .filter(Boolean);
    const details = [set.type !== 'normal' ? set.type : null].filter(Boolean);
    return [...values, ...details].join(' - ') || '-';
  };

  const handleAvatarFile = (file: File | undefined) => {
    setAvatarError('');
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError('Please choose an image file.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setAvatarError('Please choose an image smaller than 8 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarSource(typeof reader.result === 'string' ? reader.result : null);
      setAvatarZoom(1);
      setAvatarOffsetX(0);
      setAvatarOffsetY(0);
    };
    reader.onerror = () => setAvatarError('Unable to load that image.');
    reader.readAsDataURL(file);
  };

  const saveAvatar = () => {
    const image = avatarImageRef.current;
    if (!image || !avatarSource) {
      setAvatarError('Choose a photo before saving.');
      return;
    }

    const canvas = document.createElement('canvas');
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) {
      setAvatarError('Unable to crop this image.');
      return;
    }

    const baseScale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
    const scale = baseScale * avatarZoom;
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const maxOffsetX = Math.max(0, (drawWidth - size) / 2);
    const maxOffsetY = Math.max(0, (drawHeight - size) / 2);
    const clampedOffsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, avatarOffsetX));
    const clampedOffsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, avatarOffsetY));

    context.fillStyle = '#09090b';
    context.fillRect(0, 0, size, size);
    context.drawImage(
      image,
      (size - drawWidth) / 2 + clampedOffsetX,
      (size - drawHeight) / 2 + clampedOffsetY,
      drawWidth,
      drawHeight,
    );

    updateUser({ avatarUrl: canvas.toDataURL('image/jpeg', 0.88) });
    setAvatarDialogOpen(false);
    setAvatarSource(null);
  };

  const removeAvatar = () => {
    updateUser({ avatarUrl: undefined });
    setAvatarSource(null);
    setAvatarDialogOpen(false);
  };

  return (
    <div className="screen-shell">
      <div className="screen-header">
        <div className="flex items-center gap-4 mb-4">
          <button
            type="button"
            onClick={() => setAvatarDialogOpen(true)}
            className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-blue-400/25 bg-blue-500/15"
            aria-label="Edit profile photo"
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-blue-200" />
            )}
            <span className="absolute inset-x-0 bottom-0 flex h-6 items-center justify-center bg-black/55 text-blue-100 opacity-100 backdrop-blur-sm transition-opacity group-hover:opacity-100">
              <Camera className="h-3.5 w-3.5" />
            </span>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold truncate">{user.name}</h1>
            <p className="text-zinc-400 text-sm">
              Member since {format(new Date(`${user.dateJoined}T00:00:00`), 'MMM yyyy')}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="premium-card p-3">
            <div className="stat-number text-2xl mb-1">{profile.summary.totalWorkouts}</div>
            <div className="text-xs text-zinc-400">Workouts</div>
          </div>
          <div className="premium-card p-3">
            <div className="stat-number text-2xl mb-1">{profile.summary.weeklyAverage}</div>
            <div className="text-xs text-zinc-400">Weekly Avg</div>
          </div>
          <div className="premium-card p-3">
            <div className="stat-number text-2xl mb-1">{profile.streak}</div>
            <div className="text-xs text-zinc-400">Day Streak</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-2">
        <h2 className="section-label mb-3">Profile</h2>
        <div className="premium-card p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Username</span>
            <span className="text-white">{user.username}</span>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Gender</span>
            <span className="text-white">{user.gender}</span>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Height</span>
            <span className="text-white">{user.height} cm</span>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Weight</span>
            <span className="text-white">{user.weight} kg</span>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Experience</span>
            <span className="text-white">{user.experience}</span>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Primary Goal</span>
            <span className="text-white">{user.goal}</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-300" />
            Top Ranks
          </h2>
          <button
            type="button"
            onClick={() => setAllRanksOpen(true)}
            className="premium-button premium-button-secondary min-h-9 px-3 text-sm text-zinc-300"
          >
            See all
          </button>
        </div>
        <div className="space-y-2">
          {topRankResults.length > 0 ? (
            topRankResults.map((result, index) => (
              <div key={result.exerciseId} className="premium-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-xs text-zinc-300">
                        {index + 1}
                      </span>
                      <div className="truncate font-medium text-white">{result.exerciseName}</div>
                    </div>
                    <div className="text-xs text-zinc-500">{formatRankEstimate(result)}</div>
                  </div>
                  <RankBadge rank={result.rank} division={result.division} size="sm" />
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state p-4 text-sm text-zinc-400">
              Log ranked strength exercises to unlock top ranks.
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            Personal Records
          </h2>
          <button
            onClick={() => setRecordDialogOpen(true)}
            className="premium-button premium-button-secondary min-h-9 px-3 text-sm text-zinc-300"
          >
            Customize
          </button>
        </div>
        <div className="space-y-2">
          {profile.displayRecords.length > 0 ? (
            profile.displayRecords.slice(0, 4).map((record) => (
              <div key={record.exerciseId} className="premium-card p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-white font-medium mb-1">{record.exercise}</div>
                    <div className="text-xs text-zinc-500">{record.hasRecord ? record.date : 'No record yet'}</div>
                  </div>
                  <div className="text-right">
                    <div className="stat-number text-xl text-blue-300 mb-1">
                      {formatRecordLift(record)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-white/10 mt-2">
                  <ArrowUp className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400">{formatRecordEstimate(record)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state p-4 text-sm text-zinc-400">
              Choose exercises to display as personal records.
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-2">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Recent Workouts
          </h2>
          <button
            onClick={() => setWorkoutHistoryOpen(true)}
            className="premium-button premium-button-secondary min-h-9 px-3 text-sm text-zinc-300"
          >
            See all
          </button>
        </div>
        <div className="space-y-2">
          {profile.workouts.length > 0 ? (
            profile.workouts.slice(0, 3).map((workout) => (
              <div key={workout.id} className="premium-card p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-white font-medium">{workout.workoutName}</div>
                    <div className="text-xs text-zinc-500">{format(new Date(`${workout.date}T00:00:00`), 'MMM d, yyyy')}</div>
                  </div>
                  <div className="text-right">
                    <span className="premium-badge px-2 py-1 text-xs">{workout.duration} min</span>
                    <div className="mt-1 text-xs text-zinc-500">{formatWorkoutTotalWeight(workout)}</div>
                  </div>
                </div>
                <div className="space-y-1">
                  {workout.exercises.slice(0, 3).map((exercise) => (
                    <div key={exercise.exerciseId} className="text-sm text-zinc-400">
                      {exercise.exerciseName} - {exercise.sets.length} sets
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state p-5 text-center">
              <p className="text-sm font-medium text-white">No workouts logged yet</p>
              <p className="mt-1 text-sm text-zinc-400">
                Finish your first session and the three most recent workouts will appear here.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (isWorkoutActive) {
                    expandWorkout();
                    navigate('/');
                    return;
                  }

                  navigate('/exercise-selection');
                }}
                className="premium-button premium-button-primary mt-4 min-h-11 px-4 text-sm font-medium"
              >
                Log New Workout
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Target className="w-5 h-5 text-green-400" />
            Current Goals
          </h2>
          <button
            onClick={() => setGoalDialogOpen(true)}
            className="premium-button premium-button-secondary min-h-9 px-3 text-sm text-zinc-300"
          >
            Edit
          </button>
        </div>
        <div className="space-y-2">
          {currentGoals.length > 0 ? (
            currentGoals.map((goal) => {
              const record = getGoalRecord(goal.exerciseId);
              const targetWeight = getGoalTargetWeight(goal, record);
              const progress =
                record?.hasRecord && targetWeight > 0 ? Math.min(100, (record.weight / targetWeight) * 100) : 0;

              return (
                <div key={goal.exerciseId} className="premium-card p-4">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-white font-medium">{record?.exercise ?? 'Exercise'}</div>
                      <div className="text-xs text-zinc-500">
                        Current: {record?.hasRecord ? `${record.weight} kg x ${record.reps}` : '-'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-blue-300">{targetWeight > 0 ? `${targetWeight} kg` : '-'}</div>
                      <div className="text-xs text-zinc-500">Target</div>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-blue-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-state p-5 text-center">
              <p className="text-sm font-medium text-white">No current goals selected</p>
              <p className="mt-1 text-sm text-zinc-400">Choose up to three exercises and set target weights.</p>
              <button
                type="button"
                onClick={() => setGoalDialogOpen(true)}
                className="premium-button premium-button-secondary mt-4 min-h-10 px-4 text-sm text-zinc-300"
              >
                Edit Goals
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-2 mb-6 space-y-2">
        <button
          onClick={() => navigate('/settings')}
          className="premium-card w-full p-4 flex items-center justify-between transition-colors hover:border-white/20"
        >
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-zinc-400" />
            <span className="text-white">Settings & Preferences</span>
          </div>
          <span className="text-zinc-400">Open</span>
        </button>
        <button
          onClick={() => setSignOutDialogOpen(true)}
          className="premium-button premium-button-danger w-full p-4 flex items-center gap-3 text-red-400"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign out</span>
        </button>
      </div>

      <AlertDialog open={signOutDialogOpen} onOpenChange={setSignOutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              You will return to the login screen. Your workouts and profile data will stay saved on this device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="premium-button premium-button-secondary border-white/10 text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="premium-button premium-button-danger"
            >
              Sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={allRanksOpen} onOpenChange={setAllRanksOpen}>
        <DialogContent className="max-w-md max-h-[84vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Exercise Ranks</DialogTitle>
            <DialogDescription>All rank-eligible exercises, sorted by your current rank.</DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {rankResults.map((result, index) => (
              <div key={result.exerciseId} className="premium-row p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="w-5 shrink-0 text-xs text-zinc-500">{index + 1}</span>
                      <div className="truncate text-sm font-medium text-white">{result.exerciseName}</div>
                    </div>
                    <div className="mt-1 pl-7 text-xs text-zinc-500">
                      {result.status === 'ranked' ? formatRankEstimate(result) : result.message}
                    </div>
                  </div>
                  <RankBadge rank={result.rank} division={result.division} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={avatarDialogOpen}
        onOpenChange={(open) => {
          setAvatarDialogOpen(open);
          if (!open) {
            setAvatarSource(null);
            setAvatarError('');
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Profile Photo</DialogTitle>
            <DialogDescription>Upload a photo and crop it to a square avatar.</DialogDescription>
          </DialogHeader>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              handleAvatarFile(event.target.files?.[0]);
              event.target.value = '';
            }}
          />

          {avatarSource ? (
            <div className="space-y-4">
              <div className="mx-auto h-56 w-56 overflow-hidden rounded-3xl border border-blue-400/30 bg-zinc-950">
                <img
                  ref={avatarImageRef}
                  src={avatarSource}
                  alt="Profile crop preview"
                  className="h-full w-full object-cover"
                  style={{
                    transform: `translate(${avatarOffsetX * 0.875}px, ${avatarOffsetY * 0.875}px) scale(${avatarZoom})`,
                    transformOrigin: 'center',
                  }}
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm text-zinc-400">
                  Zoom
                  <input
                    type="range"
                    min="1"
                    max="2.5"
                    step="0.05"
                    value={avatarZoom}
                    onChange={(event) => setAvatarZoom(Number(event.target.value))}
                    className="mt-2 w-full accent-blue-500"
                  />
                </label>
                <label className="block text-sm text-zinc-400">
                  Horizontal position
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="1"
                    value={avatarOffsetX}
                    onChange={(event) => setAvatarOffsetX(Number(event.target.value))}
                    className="mt-2 w-full accent-blue-500"
                  />
                </label>
                <label className="block text-sm text-zinc-400">
                  Vertical position
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="1"
                    value={avatarOffsetY}
                    onChange={(event) => setAvatarOffsetY(Number(event.target.value))}
                    className="mt-2 w-full accent-blue-500"
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="empty-state p-6 text-center">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-zinc-500" />
                )}
              </div>
              <p className="text-sm font-medium text-white">
                {user.avatarUrl ? 'Current profile photo' : 'No profile photo yet'}
              </p>
              <p className="mt-1 text-sm text-zinc-400">Choose an image, then adjust the crop before saving.</p>
            </div>
          )}

          {avatarError && (
            <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {avatarError}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="premium-button premium-button-secondary flex min-h-11 items-center justify-center gap-2 px-3 text-sm text-zinc-300"
            >
              <ImagePlus className="h-4 w-4" />
              Choose Photo
            </button>
            <button
              type="button"
              onClick={saveAvatar}
              disabled={!avatarSource}
              className="premium-button premium-button-primary min-h-11 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-45"
            >
              Save Photo
            </button>
          </div>

          {user.avatarUrl && (
            <button
              type="button"
              onClick={removeAvatar}
              className="premium-button premium-button-danger flex min-h-11 items-center justify-center gap-2 text-sm text-red-300"
            >
              <Trash2 className="h-4 w-4" />
              Remove Photo
            </button>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent className="max-w-md max-h-[84vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Personal Records</DialogTitle>
            <DialogDescription>Choose which exercise records appear on your profile.</DialogDescription>
          </DialogHeader>

          <ExerciseFilterPicker
            exercises={profile.exerciseOptions}
            selectedExerciseIds={selectedRecordExerciseIds}
            onToggleExercise={(exercise) => togglePersonalRecordExercise(exercise.id)}
            className="flex-1"
            searchPlaceholder="Search personal record exercises..."
            renderExerciseMeta={(exercise) => {
              const record = recordsByExerciseId.get(exercise.id);
              return (
                <div className="mt-2 text-xs text-zinc-500">
                  {record?.hasRecord
                    ? `${formatRecordLift(record)} - ${formatRecordEstimate(record)}`
                    : 'No recorded weight yet'}
                </div>
              );
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogContent className="max-w-md max-h-[84vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Current Goals</DialogTitle>
            <DialogDescription>Choose up to three exercises and set a target weight.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <div className="section-label">Selected Goals</div>
            {currentGoals.length > 0 ? (
              currentGoals.map((goal) => {
                const record = getGoalRecord(goal.exerciseId);
                return (
                  <div key={goal.exerciseId} className="premium-row p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-white">{record?.exercise ?? 'Exercise'}</div>
                        <div className="text-xs text-zinc-500">
                          Current: {record?.hasRecord ? `${record.weight} kg x ${record.reps}` : '-'}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleCurrentGoalExercise(goal.exerciseId)}
                        className="text-sm text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-zinc-400">
                      Target
                      <input
                        type="number"
                        value={goal.targetWeight || ''}
                        onChange={(event) => updateCurrentGoalTarget(goal.exerciseId, Number(event.target.value))}
                        placeholder="kg"
                        className="premium-input flex-1 px-3 py-2 text-white"
                      />
                    </label>
                  </div>
                );
              })
            ) : (
              <div className="empty-state p-3 text-sm text-zinc-400">No goals selected yet.</div>
            )}
          </div>

          <ExerciseFilterPicker
            exercises={profile.exerciseOptions}
            selectedExerciseIds={currentGoals.map((goal) => goal.exerciseId)}
            onToggleExercise={(exercise) => toggleCurrentGoalExercise(exercise.id)}
            isExerciseDisabled={(exercise) =>
              !currentGoals.some((goal) => goal.exerciseId === exercise.id) && currentGoals.length >= 3
            }
            className="flex-1"
            searchPlaceholder="Search goal exercises..."
            unselectedIcon="target"
            renderExerciseMeta={(exercise) => {
              const record = recordsByExerciseId.get(exercise.id);
              return (
                <div className="mt-2 text-xs text-zinc-500">
                  Current: {record?.hasRecord ? `${record.weight} kg x ${record.reps}` : '-'}
                </div>
              );
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={workoutHistoryOpen}
        onOpenChange={(open) => {
          setWorkoutHistoryOpen(open);
          if (!open) setSelectedHistoryDate(null);
        }}
      >
        <DialogContent className="max-w-md max-h-[84vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Workout History</DialogTitle>
            <DialogDescription>Browse logged workouts by month.</DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setHistoryMonth((month) => subMonths(month, 1));
                setSelectedHistoryDate(null);
              }}
              className="premium-button premium-button-secondary w-10 h-10 flex items-center justify-center"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-center">
              <div className="text-white font-semibold">{format(historyMonth, 'MMMM yyyy')}</div>
              <div className="text-xs text-zinc-500">{workoutsInHistoryMonth.length} logged workouts</div>
            </div>
            <button
              onClick={() => {
                setHistoryMonth((month) => addMonths(month, 1));
                setSelectedHistoryDate(null);
              }}
              className="premium-button premium-button-secondary w-10 h-10 flex items-center justify-center"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-zinc-500">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="py-1">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const dayWorkouts = getWorkoutsForDay(day);
              const hasWorkout = dayWorkouts.length > 0;
              const isInCurrentMonth = isSameMonth(day, historyMonth);
              const isSelectable = hasWorkout && isInCurrentMonth;
              const isSelected = selectedHistoryDate ? isSameDay(day, selectedHistoryDate) : false;
              const cellClassName = `min-h-12 rounded-lg border p-1.5 text-left transition-colors ${
                isInCurrentMonth
                  ? hasWorkout
                    ? isSelected
                      ? 'border-blue-300 bg-blue-500/20 ring-1 ring-blue-300/40'
                      : 'border-blue-400/30 bg-blue-500/10 hover:border-blue-300/60 hover:bg-blue-500/15'
                    : 'border-white/10 bg-white/[0.025]'
                  : 'border-white/5 bg-transparent opacity-35'
              }`;

              const cellContent = (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-300">{format(day, 'd')}</span>
                    {hasWorkout && (
                      <span className="rounded-full bg-blue-400/20 px-1.5 py-0.5 text-[10px] text-blue-200">
                        {dayWorkouts.length}
                      </span>
                    )}
                  </div>
                  {isSelected && <div className="mt-1 h-1 w-5 rounded-full bg-blue-300" />}
                </>
              );

              return (
                isSelectable ? (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => setSelectedHistoryDate(day)}
                    className={cellClassName}
                    aria-label={`Show workouts for ${format(day, 'MMMM d, yyyy')}`}
                  >
                    {cellContent}
                  </button>
                ) : (
                  <div key={day.toISOString()} className={cellClassName}>
                    {cellContent}
                  </div>
                )
              );
            })}
          </div>

          <div className="overflow-y-auto flex-1 space-y-2 pr-1">
            {selectedHistoryDate ? (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="section-label">Selected Day</div>
                  <div className="text-sm font-medium text-white">{format(selectedHistoryDate, 'EEEE, MMM d')}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedHistoryDate(null)}
                  className="premium-button premium-button-secondary min-h-9 px-3 text-sm text-zinc-300"
                >
                  Show month
                </button>
              </div>
            ) : (
              <div className="section-label">Logged This Month</div>
            )}

            {selectedHistoryDate ? (
              selectedHistoryWorkouts.map((workout) => (
                <div key={workout.id} className="premium-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-white">{workout.workoutName}</div>
                      <div className="text-xs text-zinc-500">
                        {format(new Date(`${workout.date}T00:00:00`), 'EEEE, MMM d')} - {workout.duration} min
                      </div>
                    </div>
                    <span className="premium-badge px-2 py-1 text-xs">{getWorkoutSetCount(workout)} sets</span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {workout.exercises.map((exercise) => (
                      <div key={`${workout.id}-${exercise.exerciseId}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-medium text-white">{exercise.exerciseName}</div>
                            <div className="text-xs text-zinc-500">{exercise.mainMuscles.join(', ')}</div>
                          </div>
                          <span className="shrink-0 text-right text-xs text-zinc-500">{formatExerciseHistorySummary(exercise)}</span>
                        </div>
                        <div className="space-y-1">
                          {exercise.sets.map((set, index) => (
                            <div key={`${exercise.exerciseId}-${index}`} className="flex items-center justify-between gap-3 text-xs">
                              <span className="text-zinc-500">Set {index + 1}</span>
                              <span className="text-zinc-300">{formatWorkoutSet(set, exercise.exerciseId)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : workoutsInHistoryMonth.length > 0 ? (
              workoutsInHistoryMonth.map((workout) => (
                <div key={workout.id} className="premium-row p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-white">{workout.workoutName}</div>
                      <div className="text-xs text-zinc-500">{format(new Date(`${workout.date}T00:00:00`), 'EEEE, MMM d')}</div>
                    </div>
                    <span className="premium-badge px-2 py-1 text-xs">{workout.duration} min</span>
                  </div>
                  <div className="mt-2 text-xs text-zinc-400">
                    {workout.exercises.length} exercises - {getWorkoutSetCount(workout)} sets
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state p-4 text-sm text-zinc-400">
                No workouts logged in this month.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Check, ChevronRight, Copy, Mail, MessageSquare, Palette, RotateCcw, Save, Send, ShieldAlert, Trash2 } from 'lucide-react';
import { appThemes, useSettings } from '../contexts/SettingsContext';
import { Switch } from '../components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { DataService } from '../services/db';
import { cancelPostWorkoutReminders } from '../services/notifications';

const SUPPORT_EMAIL = 'andr761e@gmail.com';
const feedbackTypes = ['Feature request', 'Bug report', 'Training logic feedback', 'General message'];
const RESET_CONFIRMATION = 'RESET';
const DELETE_CONFIRMATION = 'DELETE';

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const {
    weightUnit,
    weightIncrement,
    theme,
    autoStartTimer,
    timerNotifications,
    workoutReminders,
    restTimers,
    setWeightUnit,
    setWeightIncrement,
    setTheme,
    setAutoStartTimer,
    setTimerNotifications,
    setWorkoutReminders,
    setRestTimers,
  } = useSettings();

  const [editStatsOpen, setEditStatsOpen] = useState(false);
  const [bodyWeight, setBodyWeight] = useState((user?.weight ?? 72).toString());
  const [height, setHeight] = useState((user?.height ?? 170).toString());
  const [experience, setExperience] = useState(user?.experience ?? 'Intermediate');
  const [goal, setGoal] = useState(user?.goal ?? 'General Fitness');
  const [contactOpen, setContactOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState(feedbackTypes[0]);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const [resetDataOpen, setResetDataOpen] = useState(false);
  const [deleteProfileOpen, setDeleteProfileOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [accountActionStatus, setAccountActionStatus] = useState('');
  const [accountActionError, setAccountActionError] = useState('');

  const experienceLevels = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];
  const goals = ['Strength', 'Hypertrophy', 'Endurance', 'General Fitness', 'Weight Loss'];

  const saveProfileStats = () => {
    updateUser({
      weight: Number(bodyWeight) || user?.weight,
      height: Number(height) || user?.height,
      experience,
      goal,
    });
    setEditStatsOpen(false);
  };

  const buildFeedbackBody = () => [
    `From: ${user?.name ?? 'Strive user'} (${user?.email ?? 'no email'})`,
    `Username: ${user?.username ?? '-'}`,
    `Category: ${feedbackType}`,
    '',
    feedbackMessage.trim(),
    '',
    '---',
    'Sent from Strive Settings',
  ].join('\n');

  const openEmailDraft = () => {
    const subject = encodeURIComponent(`Strive app feedback: ${feedbackType}`);
    const body = encodeURIComponent(buildFeedbackBody());
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  const copyFeedback = async () => {
    setCopyStatus('');
    try {
      await navigator.clipboard.writeText(buildFeedbackBody());
      setCopyStatus('Copied message to clipboard.');
    } catch {
      setCopyStatus('Could not copy automatically. Select the message text and copy it manually.');
    }
  };

  const cancelCurrentUserWorkoutReminders = async () => {
    if (!user) return;
    const workoutIds = DataService.getWorkoutsByUserId(user.id).map((workout) => workout.id);
    await Promise.allSettled(workoutIds.map((workoutId) => cancelPostWorkoutReminders(workoutId)));
  };

  const handleResetData = async () => {
    if (!user || resetConfirmText !== RESET_CONFIRMATION) return;

    setAccountActionError('');
    try {
      await cancelCurrentUserWorkoutReminders();
      DataService.resetUserData(user.id);
      setResetDataOpen(false);
      setResetConfirmText('');
      setAccountActionStatus('Training data was reset. Your profile is still active with the starter routines restored.');
    } catch {
      setAccountActionError('Unable to reset your data right now. Please try again.');
    }
  };

  const handleDeleteProfile = async () => {
    if (!user || deleteConfirmText !== DELETE_CONFIRMATION) return;

    setAccountActionError('');
    try {
      await cancelCurrentUserWorkoutReminders();
      DataService.deleteUserProfile(user.id);
      setDeleteProfileOpen(false);
      setDeleteConfirmText('');
      logout();
      navigate('/auth/login', { replace: true });
    } catch {
      setAccountActionError('Unable to delete this profile right now. Please try again.');
    }
  };

  if (!user) return null;

  return (
    <div className="screen-shell">
      <div className="sticky-header">
        <div className="px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="premium-button premium-button-secondary w-11 h-11 flex items-center justify-center" aria-label="Go back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold flex-1">Settings</h1>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="section-label">Theme</h2>
          <span className="premium-badge px-2.5 py-1 text-[11px]">App appearance</span>
        </div>
        <div className="grid gap-3 min-[420px]:grid-cols-2">
          {appThemes.map((item) => {
            const isSelected = theme === item.id;
            const previewStyle = {
              '--theme-preview-bg': item.preview.background,
              '--theme-preview-surface': item.preview.surface,
              '--theme-preview-accent': item.preview.accent,
              '--theme-preview-accent-strong': item.preview.accentStrong,
            } as CSSProperties;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTheme(item.id)}
                className={`theme-option p-4 ${isSelected ? 'theme-option-selected' : ''}`}
                aria-pressed={isSelected}
                style={previewStyle}
              >
                <div className="relative flex items-start gap-3">
                  <div className="theme-preview flex h-14 w-14 shrink-0 items-end gap-1.5 p-2">
                    <span className="theme-preview-accent h-7 w-2.5 rounded-full" />
                    <span className="h-4 w-2.5 rounded-full bg-white/18" />
                    <span className="h-9 w-2.5 rounded-full bg-white/10" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-white">{item.name}</div>
                      {isSelected ? (
                        <span className="theme-selected-dot flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--strive-accent-contrast)]">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      ) : (
                        <Palette className="h-4 w-4 shrink-0 text-zinc-500" />
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-400">{item.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-4">
        <h2 className="section-label mb-3">Units</h2>
        <div className="premium-card overflow-hidden">
          {(['kg', 'lbs'] as const).map((unit) => (
            <button
              key={unit}
              onClick={() => setWeightUnit(unit)}
              className={`w-full p-4 flex items-center justify-between border-b last:border-b-0 border-white/10 transition-colors hover:bg-white/[0.035] ${
                weightUnit === unit ? 'bg-blue-500/10' : ''
              }`}
            >
              <span className="text-white">{unit === 'kg' ? 'Kilograms (kg)' : 'Pounds (lbs)'}</span>
              {weightUnit === unit && <div className="w-2 h-2 rounded-full bg-blue-500" />}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        <h2 className="section-label mb-3">Default Weight Increment</h2>
        <div className="premium-card overflow-hidden">
          {([2.5, 5, 10] as const).map((increment) => (
            <button
              key={increment}
              onClick={() => setWeightIncrement(increment)}
              className={`w-full p-4 flex items-center justify-between border-b last:border-b-0 border-white/10 transition-colors hover:bg-white/[0.035] ${
                weightIncrement === increment ? 'bg-blue-500/10' : ''
              }`}
            >
              <span className="text-white">
                {increment} {weightUnit}
              </span>
              {weightIncrement === increment && <div className="w-2 h-2 rounded-full bg-blue-500" />}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        <h2 className="section-label mb-3">Workouts</h2>
        <div className="premium-card overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b border-white/10">
            <div>
              <div className="text-white mb-1">Auto-start Timer</div>
              <div className="text-xs text-zinc-400">Start timer when workout begins</div>
            </div>
            <Switch checked={autoStartTimer} onCheckedChange={setAutoStartTimer} />
          </div>
          <div className="p-4 flex items-center justify-between border-b border-white/10">
            <div>
              <div className="text-white mb-1">Active Workout Notification</div>
              <div className="text-xs text-zinc-400">Show a persistent timer notification during workouts</div>
            </div>
            <Switch checked={timerNotifications} onCheckedChange={setTimerNotifications} />
          </div>
          <div className="p-4 flex items-center justify-between border-b border-white/10">
            <div>
              <div className="text-white mb-1">Rest Timers</div>
              <div className="text-xs text-zinc-400">Start a countdown after completing a set</div>
            </div>
            <Switch checked={restTimers} onCheckedChange={setRestTimers} />
          </div>
          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="text-white mb-1">Workout Reminders</div>
              <div className="text-xs text-zinc-400">Daily reminders for one week after a logged workout</div>
            </div>
            <Switch checked={workoutReminders} onCheckedChange={setWorkoutReminders} />
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <h2 className="section-label mb-3">Profile</h2>
        <div className="premium-card overflow-hidden">
          <button onClick={() => setEditStatsOpen(true)} className="w-full p-4 flex items-center justify-between transition-colors hover:bg-white/[0.035]">
            <div className="text-left">
              <div className="text-white mb-1">Body Stats & Goals</div>
              <div className="text-xs text-zinc-400">
                {user.weight} kg - {user.height} cm - {user.experience}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
      </div>

      <div className="px-4 py-4">
        <h2 className="section-label mb-3">Account</h2>
        <div className="premium-card overflow-hidden">
          <div className="w-full p-4 flex items-center justify-between border-b border-white/10">
            <span className="text-white">Email</span>
            <span className="text-sm text-zinc-400">{user.email}</span>
          </div>
          <div className="w-full p-4 flex items-center justify-between">
            <span className="text-white">Username</span>
            <span className="text-sm text-zinc-400">{user.username}</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <h2 className="section-label mb-3">Support</h2>
        <div className="premium-card overflow-hidden">
          <button
            type="button"
            onClick={() => {
              setCopyStatus('');
              setContactOpen(true);
            }}
            className="w-full p-4 flex items-center justify-between transition-colors hover:bg-white/[0.035]"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <div className="text-white mb-1">Contact & Requests</div>
                <div className="text-xs text-zinc-400">Send feedback, bugs, or feature ideas</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
      </div>

      <div className="px-4 py-4">
        <h2 className="section-label mb-3">Profile Data</h2>
        <div className="premium-card overflow-hidden border-red-500/20">
          <button
            type="button"
            onClick={() => {
              setAccountActionStatus('');
              setAccountActionError('');
              setResetConfirmText('');
              setResetDataOpen(true);
            }}
            className="w-full border-b border-white/10 p-4 text-left transition-colors hover:bg-white/[0.035]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15 text-orange-300">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <div className="mb-1 text-white">Reset All Data</div>
                  <div className="text-xs text-zinc-400">Clear workouts, PRs, progress settings, goals, and custom routines</div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-zinc-400" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setAccountActionStatus('');
              setAccountActionError('');
              setDeleteConfirmText('');
              setDeleteProfileOpen(true);
            }}
            className="w-full p-4 text-left transition-colors hover:bg-red-500/5"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 text-red-300">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="mb-1 text-red-200">Delete Profile</div>
                  <div className="text-xs text-zinc-400">Remove this local profile and all data attached to it</div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-zinc-400" />
            </div>
          </button>
        </div>

        {accountActionStatus && (
          <div className="mt-3 rounded-xl border border-green-400/20 bg-green-500/10 px-3 py-2 text-sm text-green-300">
            {accountActionStatus}
          </div>
        )}
        {accountActionError && (
          <div className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {accountActionError}
          </div>
        )}
      </div>

      <div className="px-4 py-4 mb-6">
        <div className="text-center text-sm text-zinc-500">
          <p>Strive v1.0.0</p>
          <p className="mt-1">2026 Strive Fitness</p>
        </div>
      </div>

      <Dialog open={editStatsOpen} onOpenChange={setEditStatsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile Stats</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-2 text-sm text-zinc-400">
              Body Weight
              <input
                type="number"
                value={bodyWeight}
                onChange={(event) => setBodyWeight(event.target.value)}
                className="premium-input p-3 text-white"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-zinc-400">
              Height
              <input
                type="number"
                value={height}
                onChange={(event) => setHeight(event.target.value)}
                className="premium-input p-3 text-white"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-zinc-400">
              Experience
              <select
                value={experience}
                onChange={(event) => setExperience(event.target.value)}
                className="premium-input p-3 text-white"
              >
                {experienceLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-zinc-400">
              Goal
              <select
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                className="premium-input p-3 text-white"
              >
                {goals.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            onClick={saveProfileStats}
            className="premium-button premium-button-primary w-full py-3 flex items-center justify-center gap-2 font-medium"
          >
            <Save className="w-4 h-4" />
            Save Stats
          </button>
        </DialogContent>
      </Dialog>

      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contact & Requests</DialogTitle>
            <DialogDescription>
              Write a message about the app. Strive will open your email app with the details filled in.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <label className="flex flex-col gap-2 text-sm text-zinc-400">
              Message type
              <select
                value={feedbackType}
                onChange={(event) => setFeedbackType(event.target.value)}
                className="premium-input p-3 text-white"
              >
                {feedbackTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm text-zinc-400">
              Message
              <textarea
                value={feedbackMessage}
                onChange={(event) => {
                  setFeedbackMessage(event.target.value);
                  setCopyStatus('');
                }}
                rows={7}
                className="premium-input resize-none p-3 text-white"
                placeholder="Tell me what you want changed, what broke, or what would make Strive better..."
              />
            </label>

            {copyStatus && (
              <div className="rounded-xl border border-green-400/20 bg-green-500/10 px-3 py-2 text-sm text-green-300">
                {copyStatus}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={copyFeedback}
                disabled={!feedbackMessage.trim()}
                className="premium-button premium-button-secondary flex min-h-11 items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Copy className="h-4 w-4" />
                Copy
              </button>
              <button
                type="button"
                onClick={openEmailDraft}
                disabled={!feedbackMessage.trim()}
                className="premium-button premium-button-primary flex min-h-11 items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Send
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Mail className="h-3.5 w-3.5" />
              Draft recipient: {SUPPORT_EMAIL}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={resetDataOpen}
        onOpenChange={(open) => {
          setResetDataOpen(open);
          if (!open) setResetConfirmText('');
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-orange-300" />
              Reset all training data?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This clears logged workouts, personal-record history, exercise ranks, current goals, progress preferences,
              custom routines, and scheduled workout reminders. Your profile stays active and the starter routines are restored.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <label className="flex flex-col gap-2 text-sm text-zinc-400">
            Type {RESET_CONFIRMATION} to confirm
            <input
              value={resetConfirmText}
              onChange={(event) => setResetConfirmText(event.target.value.toUpperCase())}
              className="premium-input px-3 py-2 text-white"
              autoComplete="off"
            />
          </label>

          <AlertDialogFooter>
            <AlertDialogCancel className="premium-button premium-button-secondary border-white/10 text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetData}
              disabled={resetConfirmText !== RESET_CONFIRMATION}
              className="premium-button premium-button-danger disabled:cursor-not-allowed disabled:opacity-40"
            >
              Reset Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteProfileOpen}
        onOpenChange={(open) => {
          setDeleteProfileOpen(open);
          if (!open) setDeleteConfirmText('');
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-300" />
              Delete this profile?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes this local profile, workouts, routines, progress data, profile photo, and scheduled
              workout reminders from this device. You will be returned to the login screen.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <label className="flex flex-col gap-2 text-sm text-zinc-400">
            Type {DELETE_CONFIRMATION} to confirm
            <input
              value={deleteConfirmText}
              onChange={(event) => setDeleteConfirmText(event.target.value.toUpperCase())}
              className="premium-input px-3 py-2 text-white"
              autoComplete="off"
            />
          </label>

          <AlertDialogFooter>
            <AlertDialogCancel className="premium-button premium-button-secondary border-white/10 text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProfile}
              disabled={deleteConfirmText !== DELETE_CONFIRMATION}
              className="premium-button premium-button-danger disabled:cursor-not-allowed disabled:opacity-40"
            >
              Delete Profile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

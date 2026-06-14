import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Check, UserPlus, UserRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWorkout } from '../contexts/WorkoutContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

interface ProfileSwitcherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileSwitcherDialog({ open, onOpenChange }: ProfileSwitcherDialogProps) {
  const navigate = useNavigate();
  const { user, profiles, switchProfile } = useAuth();
  const { isWorkoutActive } = useWorkout();
  const [error, setError] = useState('');

  if (!user) return null;

  const handleSwitchProfile = (profileId: string) => {
    if (profileId === user.id) {
      onOpenChange(false);
      return;
    }
    if (isWorkoutActive) {
      setError('Finish or discard the active workout before changing profiles.');
      return;
    }

    try {
      switchProfile(profileId);
      window.location.replace('/');
    } catch (switchError) {
      setError(switchError instanceof Error ? switchError.message : 'Unable to change profiles.');
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) setError('');
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Local Profiles</DialogTitle>
          <DialogDescription>
            Each profile keeps separate workouts, routines, progress, ranks, and goals on this device.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
          {profiles.map((profile) => {
            const isCurrent = profile.id === user.id;
            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => handleSwitchProfile(profile.id)}
                className={`flex min-h-16 w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                  isCurrent
                    ? 'border-blue-400/35 bg-blue-500/10'
                    : 'border-white/10 bg-white/[0.025] hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <UserRound className="h-5 w-5 text-zinc-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-white">{profile.username}</div>
                  <div className="truncate text-xs text-zinc-400">{profile.goal} - {profile.experience}</div>
                </div>
                {isCurrent && (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            if (isWorkoutActive) {
              setError('Finish or discard the active workout before adding another profile.');
              return;
            }
            onOpenChange(false);
            navigate('/setup/new');
          }}
          className="premium-button premium-button-primary flex min-h-12 w-full items-center justify-center gap-2 font-medium"
        >
          <UserPlus className="h-5 w-5" />
          Add Profile
        </button>
      </DialogContent>
    </Dialog>
  );
}

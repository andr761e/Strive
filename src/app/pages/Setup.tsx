import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, HardDrive, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type SetupStep = 'profile' | 'training';

const experienceLevels = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];
const goals = ['Strength', 'Hypertrophy', 'Endurance', 'General Fitness', 'Weight Loss'];
const genderOptions = ['Male', 'Female'];

export function SetupPage() {
  const { user, createProfile, isLoading } = useAuth();
  const location = useLocation();
  const isAddingProfile = location.pathname.endsWith('/new');
  const [step, setStep] = useState<SetupStep>('profile');
  const [username, setUsername] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('180');
  const [weight, setWeight] = useState('80');
  const [experience, setExperience] = useState('Intermediate');
  const [goal, setGoal] = useState('Strength');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user && !isAddingProfile) {
      navigate('/', { replace: true });
    }
  }, [user, isLoading, isAddingProfile, navigate]);

  const validateProfileStep = () => {
    const birthdayDate = new Date(`${birthday}T00:00:00`);

    if (username.trim().length < 2) return 'Please enter a username with at least 2 letters or numbers.';
    if (!birthday || Number.isNaN(birthdayDate.getTime()) || birthdayDate > new Date()) {
      return 'Please enter a valid birthday.';
    }
    if (!genderOptions.includes(gender)) return 'Please select male or female.';
    return '';
  };

  const validateTrainingStep = () => {
    const parsedHeight = Number(height);
    const parsedWeight = Number(weight);

    if (!parsedHeight || parsedHeight < 100 || parsedHeight > 250) {
      return 'Please enter a height between 100 and 250 cm.';
    }
    if (!parsedWeight || parsedWeight < 30 || parsedWeight > 300) {
      return 'Please enter a body weight between 30 and 300 kg.';
    }
    return '';
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (step === 'profile') {
      const profileError = validateProfileStep();
      if (profileError) {
        setError(profileError);
        return;
      }
      setStep('training');
      return;
    }

    const trainingError = validateTrainingStep();
    if (trainingError) {
      setError(trainingError);
      return;
    }

    try {
      createProfile({
        username: username.trim(),
        birthday,
        gender,
        height: Number(height),
        weight: Number(weight),
        experience,
        goal,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create your profile.');
    }
  };

  return (
    <div className="screen-shell flex items-center justify-center px-4 py-8">
      <div className="premium-card w-full max-w-md p-6 sm:p-8">
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/15 font-bold text-blue-300">
              S
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-400">
              Step {step === 'profile' ? '1' : '2'} of 2
            </div>
          </div>
          <h1 className="mb-2 text-3xl font-semibold leading-tight">
            {step === 'profile' ? (isAddingProfile ? 'Add local profile' : 'Set up Strive') : 'Set your training defaults'}
          </h1>
          <p className="text-zinc-400">
            {step === 'profile'
              ? 'Choose a username for this private on-device profile. No email or password required.'
              : 'These details power exercise ranks, progress, and training recommendations.'}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2">
          {(['profile', 'training'] as SetupStep[]).map((item) => (
            <div
              key={item}
              className={`h-1.5 rounded-full ${
                item === 'profile' || step === 'training' ? 'bg-blue-500' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 'profile' ? (
            <>
              <div>
                <label className="mb-2 block text-sm text-zinc-400" htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="premium-input w-full px-4 py-3 outline-none"
                  placeholder="alex_strength"
                  autoComplete="username"
                  autoFocus
                />
                <p className="mt-1 text-xs text-zinc-500">Letters, numbers, and underscores. Stored only on this device.</p>
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400" htmlFor="birthday">
                  Birthday
                </label>
                <input
                  id="birthday"
                  type="date"
                  value={birthday}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(event) => setBirthday(event.target.value)}
                  className="premium-input w-full px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400">Gender</label>
                <div className="grid grid-cols-2 gap-2">
                  {genderOptions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setGender(item)}
                      className={`rounded-xl border p-3 text-left text-sm transition-colors ${
                        gender === item
                          ? 'border-blue-400/40 bg-blue-500/15 text-white'
                          : 'border-white/10 bg-white/[0.035] text-zinc-300 hover:bg-white/[0.06]'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-blue-400/15 bg-blue-500/[0.06] p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                  <HardDrive className="h-4 w-4 text-blue-300" />
                  Stored locally
                </div>
                <p className="text-xs leading-relaxed text-zinc-400">
                  Your profile and training history stay on this device and Strive opens directly to your data.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm text-zinc-400" htmlFor="height">
                    Height
                  </label>
                  <input
                    id="height"
                    type="number"
                    inputMode="decimal"
                    value={height}
                    onChange={(event) => setHeight(event.target.value)}
                    className="premium-input w-full px-4 py-3 outline-none"
                    placeholder="cm"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-zinc-400" htmlFor="weight">
                    Body weight
                  </label>
                  <input
                    id="weight"
                    type="number"
                    inputMode="decimal"
                    value={weight}
                    onChange={(event) => setWeight(event.target.value)}
                    className="premium-input w-full px-4 py-3 outline-none"
                    placeholder="kg"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400">Experience</label>
                <div className="grid grid-cols-2 gap-2">
                  {experienceLevels.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setExperience(level)}
                      className={`rounded-xl border p-3 text-left text-sm transition-colors ${
                        experience === level
                          ? 'border-blue-400/40 bg-blue-500/15 text-white'
                          : 'border-white/10 bg-white/[0.035] text-zinc-300 hover:bg-white/[0.06]'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400">Primary goal</label>
                <div className="grid gap-2">
                  {goals.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setGoal(item)}
                      className={`rounded-xl border p-3 text-left text-sm transition-colors ${
                        goal === item
                          ? 'border-blue-400/40 bg-blue-500/15 text-white'
                          : 'border-white/10 bg-white/[0.035] text-zinc-300 hover:bg-white/[0.06]'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-300" />
                <p className="text-xs leading-relaxed text-zinc-400">
                  Body weight is used for relative-strength ranks. Each workout keeps the weight recorded at that time.
                </p>
              </div>
            </>
          )}

          {error && (
            <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            {step === 'profile' && isAddingProfile && (
              <button
                type="button"
                onClick={() => navigate('/settings', { replace: true })}
                className="premium-button premium-button-secondary flex min-h-12 items-center justify-center px-4 text-zinc-300"
              >
                Cancel
              </button>
            )}
            {step === 'training' && (
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setStep('profile');
                }}
                className="premium-button premium-button-secondary flex min-h-12 items-center justify-center gap-2 px-4 text-zinc-300"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}
            <button
              type="submit"
              className="premium-button premium-button-primary flex min-h-12 flex-1 items-center justify-center gap-2 px-4 font-semibold"
            >
              {step === 'profile' ? (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                'Create local profile'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

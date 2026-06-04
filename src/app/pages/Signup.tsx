import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getPasswordRequirements,
  getPasswordStrength,
  isStrongPassword,
  isValidEmail,
  isValidUsername,
} from '../utils/authValidation';

type SignupStep = 'account' | 'training';

const experienceLevels = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];
const goals = ['Strength', 'Hypertrophy', 'Endurance', 'General Fitness', 'Weight Loss'];
const genderOptions = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

function getStrengthLabel(score: number) {
  if (score <= 2) return 'Weak';
  if (score <= 4) return 'Good';
  return 'Strong';
}

function getStrengthColor(score: number) {
  if (score <= 2) return 'bg-red-500';
  if (score <= 4) return 'bg-yellow-500';
  return 'bg-green-500';
}

export function SignupPage() {
  const { user, signup, isLoading } = useAuth();
  const [step, setStep] = useState<SignupStep>('account');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [height, setHeight] = useState('180');
  const [weight, setWeight] = useState('80');
  const [experience, setExperience] = useState('Intermediate');
  const [goal, setGoal] = useState('Strength');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/', { replace: true });
    }
  }, [user, isLoading, navigate]);

  const passwordRequirements = useMemo(() => getPasswordRequirements(password), [password]);
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const strengthLabel = getStrengthLabel(passwordStrength);

  const validateAccountStep = () => {
    if (!name.trim() || !username.trim() || !email.trim() || !password || !confirmPassword) {
      return 'Please complete all account fields.';
    }
    if (!isValidUsername(username.trim())) {
      return 'Username must be 3-20 characters and use only letters, numbers, or underscores.';
    }
    if (!isValidEmail(email.trim())) {
      return 'Please enter a valid email address.';
    }
    if (!isStrongPassword(password)) {
      return 'Password does not meet the strength requirements.';
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match.';
    }
    return '';
  };

  const validateTrainingStep = () => {
    const parsedHeight = Number(height);
    const parsedWeight = Number(weight);
    const birthdayDate = new Date(`${birthday}T00:00:00`);

    if (!birthday || Number.isNaN(birthdayDate.getTime())) {
      return 'Please enter a valid birthday.';
    }
    if (!gender) {
      return 'Please select a gender.';
    }
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

    if (step === 'account') {
      const accountError = validateAccountStep();
      if (accountError) {
        setError(accountError);
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
      signup({
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        birthday,
        gender,
        password,
        height: Number(height),
        weight: Number(weight),
        experience,
        goal,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account.');
    }
  };

  return (
    <div className="screen-shell flex items-center justify-center px-4 py-10">
      <div className="premium-card w-full max-w-md p-8">
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/15 font-bold text-blue-300">
              S
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-400">
              Step {step === 'account' ? '1' : '2'} of 2
            </div>
          </div>
          <h1 className="mb-2 text-3xl font-semibold leading-tight">
            {step === 'account' ? 'Create your account' : 'Set up your training'}
          </h1>
          <p className="text-zinc-400">
            {step === 'account'
              ? 'Create a local account for workouts, stats, and progress.'
              : 'These defaults help Strive personalize your profile and goals.'}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2">
          {(['account', 'training'] as SignupStep[]).map((item) => (
            <div
              key={item}
              className={`h-1.5 rounded-full ${
                item === 'account' || step === 'training' ? 'bg-blue-500' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 'account' ? (
            <>
              <div>
                <label className="mb-2 block text-sm text-zinc-400" htmlFor="name">
                  Full name
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="premium-input w-full px-4 py-3 outline-none"
                  placeholder="Alex Jones"
                  autoComplete="name"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400" htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="premium-input w-full px-4 py-3 outline-none"
                  placeholder="alexj"
                  autoComplete="username"
                />
                <p className="mt-1 text-xs text-zinc-500">3-20 characters. Letters, numbers, and underscores only.</p>
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="premium-input w-full px-4 py-3 outline-none"
                  placeholder="alex@striveapp.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="premium-input w-full px-4 py-3 pr-11 outline-none"
                    placeholder="Password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-400" htmlFor="confirmPassword">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="premium-input w-full px-4 py-3 outline-none"
                  placeholder="Repeat password"
                  autoComplete="new-password"
                />
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-white">
                    <ShieldCheck className="h-4 w-4 text-blue-300" />
                    Password strength
                  </div>
                  <span className="text-xs text-zinc-400">{password ? strengthLabel : 'Not set'}</span>
                </div>
                <div className="mb-3 grid grid-cols-5 gap-1">
                  {[1, 2, 3, 4, 5].map((segment) => (
                    <div
                      key={segment}
                      className={`h-1.5 rounded-full ${
                        passwordStrength >= segment ? getStrengthColor(passwordStrength) : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                <div className="grid gap-2 text-xs text-zinc-400">
                  {passwordRequirements.map((requirement) => (
                    <div key={requirement.id} className="flex items-center gap-2">
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                          requirement.met
                            ? 'border-green-400/40 bg-green-500/15 text-green-300'
                            : 'border-white/10 text-zinc-600'
                        }`}
                      >
                        {requirement.met && <Check className="h-3 w-3" />}
                      </span>
                      {requirement.label}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="mb-2 block text-sm text-zinc-400" htmlFor="birthday">
                  Birthday
                </label>
                <input
                  id="birthday"
                  type="date"
                  value={birthday}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm text-zinc-400" htmlFor="height">
                    Height
                  </label>
                  <input
                    id="height"
                    type="number"
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
            </>
          )}

          {error && <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

          <div className="flex gap-3">
            {step === 'training' && (
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setStep('account');
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
              {step === 'account' ? (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                'Create account'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-400">
          <p>
            Already have an account?{' '}
            <Link to="/auth/login" className="text-blue-400 hover:text-blue-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

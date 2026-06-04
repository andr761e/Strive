import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const { user, login, isLoading } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/', { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    try {
      login(identifier, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    }
  };

  return (
    <div className="screen-shell flex items-center justify-center px-4 py-10">
      <div className="premium-card w-full max-w-md p-8">
        <div className="mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-400/20 flex items-center justify-center text-blue-300 font-bold mb-4">
            S
          </div>
          <h1 className="text-3xl font-semibold leading-tight mb-2">Welcome back</h1>
          <p className="text-zinc-400">Sign in to continue tracking your workouts.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2" htmlFor="identifier">
              Username or email
            </label>
            <input
              id="identifier"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="premium-input w-full px-4 py-3 outline-none"
              placeholder="alexj or alex@striveapp.com"
              autoComplete="username"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="block text-sm text-zinc-400" htmlFor="password">
                Password
              </label>
              <button
                type="button"
                onClick={() => setRecoveryOpen(true)}
                className="text-sm text-blue-400 transition-colors hover:text-blue-300"
              >
                Forgot?
              </button>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="premium-input w-full px-4 py-3 pr-11 outline-none"
                placeholder="Password"
                autoComplete="current-password"
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

          {error && <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

          <button
            type="submit"
            className="premium-button premium-button-primary w-full px-4 py-3 font-semibold"
          >
            Sign in
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-400">
          <p>
            New to Strive?{' '}
            <Link to="/auth/signup" className="text-blue-400 hover:text-blue-300">
              Create an account
            </Link>
          </p>
        </div>
      </div>

      <Dialog open={recoveryOpen} onOpenChange={setRecoveryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Account recovery</DialogTitle>
            <DialogDescription>
              Password reset is not available for local profiles yet.
            </DialogDescription>
          </DialogHeader>
          <div className="premium-row p-4">
            <div className="mb-2 flex items-center gap-2 text-white">
              <KeyRound className="h-5 w-5 text-blue-300" />
              Current options
            </div>
            <p className="text-sm text-zinc-400">
              Try signing in with either your username or email. If this is a test profile on this device, creating a new local profile is the safest fallback.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

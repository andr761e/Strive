import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

export function SignupPage() {
  const { user, signup, isLoading } = useAuth();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState('');
  const [password, setPassword] = useState('');
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

    if (!name || !username || !email || !birthday || !password) {
      setError('Please complete all fields.');
      return;
    }

    try {
      signup({ name: name.trim(), username: username.trim(), email: email.trim(), birthday, password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4 pb-20">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
        <h1 className="text-3xl font-semibold mb-2">Create your profile</h1>
        <p className="text-zinc-400 mb-6">Sign up and start saving workouts, stats, and progress.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2" htmlFor="name">
              Full name
            </label>
            <input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white focus:border-blue-500 outline-none"
              placeholder="Alex Jones"
              autoComplete="name"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white focus:border-blue-500 outline-none"
              placeholder="alexj"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white focus:border-blue-500 outline-none"
              placeholder="alex@striveapp.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2" htmlFor="birthday">
              Birthday
            </label>
            <input
              id="birthday"
              type="date"
              value={birthday}
              onChange={(event) => setBirthday(event.target.value)}
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white focus:border-blue-500 outline-none"
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-500 transition-colors"
          >
            Create account
          </button>
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

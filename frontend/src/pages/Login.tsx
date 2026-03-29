import { FormEvent, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthShowcase from '../components/AuthShowcase';
import { authApi } from '../lib/auth';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const returnTo = searchParams.get('returnTo') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await authApi.loginWithCredentials(email, password);
      window.location.replace(returnTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed, please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[linear-gradient(135deg,_#fff8f2_0%,_#f6f8ff_50%,_#eefaf7_100%)] px-4 py-8 dark:bg-[linear-gradient(135deg,_#0f172a_0%,_#111827_45%,_#0b1120_100%)] md:px-8 md:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <AuthShowcase />

        <div className="flex items-center justify-center">
          <div className="w-full max-w-xl rounded-[2rem] border border-slate-200/80 bg-white/90 p-8 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-[#111827]/90 md:p-10">
            <div className="mb-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#F08A5D]">Welcome back</p>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">Sign in to continue</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-white/70">
                Enter your account details to access papers, uploads, dashboards, and your saved activity.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="email" className="text-slate-700 dark:text-white/85">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  className="mt-2 h-12 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f172a] dark:text-white"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-slate-700 dark:text-white/85">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                  className="mt-2 h-12 rounded-xl border-slate-200 bg-white dark:border-white/10 dark:bg-[#0f172a] dark:text-white"
                />
              </div>

              {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-[#F08A5D] text-white hover:bg-[#e07a4d]"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600 dark:bg-white/5 dark:text-white/75">
              <p>
                New here?{' '}
                <button
                  type="button"
                  onClick={() => navigate(`/register?returnTo=${encodeURIComponent(returnTo)}`)}
                  className="font-semibold text-[#F08A5D] underline underline-offset-4"
                >
                  Create an account
                </button>
              </p>
              <p className="mt-2 text-xs text-slate-500 dark:text-white/50">You will be returned to your previous page after signing in.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

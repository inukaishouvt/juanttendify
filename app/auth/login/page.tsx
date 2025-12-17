'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string).trim();
    const password = (formData.get('password') as string).trim();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Invalid credentials');
        return;
      }

      // Persist session for both student and teacher
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user.role === 'teacher') {
        router.push('/teacher');
      } else {
        router.push('/student');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Reuse the same green gradient-over-photo background as landing via body background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-emerald-700/80 via-emerald-500/40 to-white/85" />

      {/* Top bar to match prototype */}
      <header className="w-full bg-white/70 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-emerald-600 text-xs font-bold text-white shadow-sm">
              ✓
            </span>
            <span className="text-sm font-semibold text-emerald-900">
              Juanttendify
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-emerald-600 text-white shadow-sm"
              aria-label="Menu"
            >
              <span className="space-y-1">
                <span className="block h-0.5 w-4 bg-white" />
                <span className="block h-0.5 w-4 bg-white" />
                <span className="block h-0.5 w-4 bg-white" />
              </span>
            </button>

            <div className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-emerald-600 bg-white">
              <div className="h-4 w-4 rounded-full border border-emerald-700 mb-1" />
              <div className="absolute bottom-1 h-3 w-6 rounded-full border border-emerald-700 border-t-0" />
            </div>
          </div>
        </nav>
      </header>

      {/* Centered login card */}
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md rounded-[32px] bg-emerald-700/95 px-8 py-10 text-white shadow-xl">
          <h1 className="mb-8 text-center text-3xl font-extrabold tracking-wide">
            LOG IN
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-semibold text-emerald-50"
              >
                E-mail / Phone Number
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-full border-none bg-white px-5 py-3 text-sm font-medium text-emerald-900 shadow-sm outline-none ring-0 focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-semibold text-emerald-50"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full rounded-full border-none bg-white px-5 py-3 text-sm font-medium text-emerald-900 shadow-sm outline-none ring-0 focus:ring-2 focus:ring-emerald-400"
              />
              <div className="mt-2 text-right text-xs text-emerald-50/80">
                Forgot Password?
              </div>
            </div>

            {error && (
              <p className="rounded-md bg-red-100 px-3 py-2 text-xs font-medium text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-full bg-white px-8 py-3 text-sm font-extrabold tracking-wide text-emerald-800 shadow-sm transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Logging in…' : 'LOG IN'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-emerald-50/90">
            Don&apos;t have an account?{' '}
            <Link
              href="/auth/register"
              className="font-semibold underline underline-offset-2"
            >
              Register
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}



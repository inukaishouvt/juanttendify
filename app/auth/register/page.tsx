'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<'student' | 'teacher'>('student');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = (formData.get('name') as string).trim();
    const email = (formData.get('email') as string).trim();
    const password = (formData.get('password') as string).trim();
    const confirm = (formData.get('confirm') as string).trim();
    const studentId = (formData.get('studentId') as string)?.trim() || undefined;

    if (password !== confirm) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          studentId: role === 'student' ? studentId : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Registration failed');
        return;
      }

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
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-emerald-700/80 via-emerald-500/40 to-white/85" />

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

      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md rounded-[32px] bg-emerald-700/95 px-8 py-10 text-white shadow-xl">
          <h1 className="mb-8 text-center text-3xl font-extrabold tracking-wide">
            REGISTER
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="mb-1 block text-sm font-semibold text-emerald-50"
              >
                Full Name
              </label>
              <input
                id="name"
                name="name"
                required
                className="w-full rounded-full border-none bg-white px-5 py-3 text-sm font-medium text-emerald-900 shadow-sm outline-none ring-0 focus:ring-2 focus:ring-emerald-400"
              />
            </div>

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

            <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-emerald-50">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`rounded-full px-4 py-2 ${
                  role === 'student'
                    ? 'bg-white text-emerald-800'
                    : 'bg-emerald-600 text-emerald-50'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`rounded-full px-4 py-2 ${
                  role === 'teacher'
                    ? 'bg-white text-emerald-800'
                    : 'bg-emerald-600 text-emerald-50'
                }`}
              >
                Teacher
              </button>
            </div>

            {role === 'student' && (
              <div>
                <label
                  htmlFor="studentId"
                  className="mb-1 block text-sm font-semibold text-emerald-50"
                >
                  Student ID
                </label>
                <input
                  id="studentId"
                  name="studentId"
                  required
                  className="w-full rounded-full border-none bg-white px-5 py-3 text-sm font-medium text-emerald-900 shadow-sm outline-none ring-0 focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            )}

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
            </div>

            <div>
              <label
                htmlFor="confirm"
                className="mb-1 block text-sm font-semibold text-emerald-50"
              >
                Confirm Password
              </label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                required
                className="w-full rounded-full border-none bg-white px-5 py-3 text-sm font-medium text-emerald-900 shadow-sm outline-none ring-0 focus:ring-2 focus:ring-emerald-400"
              />
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
              {loading ? 'Registering…' : 'REGISTER'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-emerald-50/90">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-semibold underline underline-offset-2"
            >
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}



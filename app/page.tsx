'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [activeModal, setActiveModal] = useState<'login' | 'register' | null>(
    null
  );

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background image + green gradient overlay */}
      <div className="absolute inset-0 -z-20">
        <Image
          src="/Background.jpg"
          alt="Juanttendify background"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-700/80 via-emerald-500/40 to-white/85" />
      </div>

      {/* Content layer */}
      <div className="relative flex min-h-screen flex-col">
        {/* Top navigation bar matching the mock */}
        <header className="w-full bg-white/70 backdrop-blur-md">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-8 sm:py-5">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-sm">
                  <Image
                    src="/Logo.png"
                    alt="Juanttendify logo"
                    width={48}
                    height={48}
                    className="h-10 w-10 object-contain"
                    unoptimized
                  />
                </span>
                <span className="text-lg font-semibold text-emerald-900">
                  Juanttendify
                </span>
              </Link>
              {/* Burger menu icon */}
              <button
                type="button"
                aria-label="Open menu"
                className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 transition-colors"
              >
                <span className="space-y-1.5">
                  <span className="block h-1 w-5 bg-white" />
                  <span className="block h-1 w-5 bg-white" />
                  <span className="block h-1 w-5 bg-white" />
                </span>
              </button>
            </div>

            {/* Profile icon on the right */}
            <div className="hidden sm:flex items-center">
              <div className="relative inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-600 bg-white text-emerald-700">
                <div className="h-6 w-6 rounded-full border border-emerald-700 mb-1" />
                <div className="absolute bottom-1 h-4 w-8 rounded-full border border-emerald-700 border-t-0" />
              </div>
            </div>
          </nav>
        </header>

        {/* Centered hero content */}
        <main className="flex flex-1 items-center justify-center px-6 pb-20 pt-12 sm:px-8 sm:pt-20">
          <div className="text-center text-white drop-shadow-md">
            <h1 className="mb-6 text-5xl font-extrabold tracking-[0.2em] uppercase sm:text-6xl md:text-7xl lg:text-8xl">
              GET STARTED!
            </h1>
            <p className="mb-12 text-lg font-medium italic text-emerald-50 sm:text-xl md:text-2xl">
              Keeping every Juan on time, every time.
            </p>

            <div className="mx-auto flex max-w-md flex-col gap-5">
              <Link
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveModal('register');
                }}
                className="relative inline-flex items-center justify-center rounded-full border-2 border-dashed border-emerald-800 bg-white/95 px-12 py-4 text-base font-extrabold tracking-wide text-emerald-800 transition-colors hover:bg-emerald-700 hover:text-white"
              >
                REGISTER
              </Link>

              <Link
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveModal('login');
                }}
                className="relative inline-flex items-center justify-center rounded-full border-2 border-dashed border-emerald-800 bg-white/90 px-12 py-4 text-base font-extrabold tracking-wide text-emerald-800 transition-colors hover:bg-emerald-700 hover:text-white"
              >
                LOGIN
              </Link>
            </div>
          </div>
        </main>

        {/* Auth modals */}
        {activeModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
            <div
              className="absolute inset-0"
              onClick={() => setActiveModal(null)}
            />
            <div className="relative z-50 w-full max-w-lg rounded-[32px] bg-emerald-700/95 px-10 py-12 text-white shadow-2xl">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="absolute right-6 top-6 text-2xl text-emerald-50 hover:text-white"
                aria-label="Close"
              >
                ✕
              </button>

              {activeModal === 'login' ? (
                <AuthLoginForm onSuccess={() => setActiveModal(null)} />
              ) : (
                <AuthRegisterForm onSuccess={() => setActiveModal(null)} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type AuthLoginFormProps = {
  onSuccess: () => void;
};

function AuthLoginForm({ onSuccess }: AuthLoginFormProps) {
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

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Let the caller decide where to go next (student/teacher pages already handle role).
      onSuccess();
      if (data.user.role === 'teacher') {
        window.location.href = '/teacher';
      } else {
        window.location.href = '/student';
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="mb-6 text-center text-3xl font-extrabold tracking-wide">
        LOG IN
      </h2>

      <div>
        <label
          htmlFor="login-email"
          className="mb-2 block text-base font-semibold text-emerald-50"
        >
          E-mail / Phone Number
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          required
          className="w-full rounded-full border-none bg-white px-6 py-4 text-base font-medium text-emerald-900 shadow-sm outline-none ring-0 focus:ring-2 focus:ring-emerald-400"
        />
      </div>

      <div>
        <label
          htmlFor="login-password"
          className="mb-2 block text-base font-semibold text-emerald-50"
        >
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          required
          className="w-full rounded-full border-none bg-white px-6 py-4 text-base font-medium text-emerald-900 shadow-sm outline-none ring-0 focus:ring-2 focus:ring-emerald-400"
        />
        <div className="mt-3 text-right text-sm text-emerald-50/80">
          Forgot Password?
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-red-100 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-3 w-full rounded-full bg-white px-10 py-4 text-base font-extrabold tracking-wide text-emerald-800 shadow-sm transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? 'Logging in…' : 'LOG IN'}
      </button>
    </form>
  );
}

type AuthRegisterFormProps = {
  onSuccess: () => void;
};

function AuthRegisterForm({ onSuccess }: AuthRegisterFormProps) {
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

      onSuccess();
      if (data.user.role === 'teacher') {
        window.location.href = '/teacher';
      } else {
        window.location.href = '/student';
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="mb-6 text-center text-3xl font-extrabold tracking-wide">
        REGISTER
      </h2>

      <div>
        <label
          htmlFor="reg-name"
          className="mb-2 block text-base font-semibold text-emerald-50"
        >
          Full Name
        </label>
        <input
          id="reg-name"
          name="name"
          required
          className="w-full rounded-full border-none bg-white px-6 py-4 text-base font-medium text-emerald-900 shadow-sm outline-none ring-0 focus:ring-2 focus:ring-emerald-400"
        />
      </div>

      <div>
        <label
          htmlFor="reg-email"
          className="mb-2 block text-base font-semibold text-emerald-50"
        >
          E-mail / Phone Number
        </label>
        <input
          id="reg-email"
          name="email"
          type="email"
          required
          className="w-full rounded-full border-none bg-white px-6 py-4 text-base font-medium text-emerald-900 shadow-sm outline-none ring-0 focus:ring-2 focus:ring-emerald-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm font-semibold text-emerald-50">
        <button
          type="button"
          onClick={() => setRole('student')}
          className={`rounded-full px-5 py-3 ${role === 'student'
              ? 'bg-white text-emerald-800'
              : 'bg-emerald-600 text-emerald-50'
            }`}
        >
          Student
        </button>
        <button
          type="button"
          onClick={() => setRole('teacher')}
          className={`rounded-full px-5 py-3 ${role === 'teacher'
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
            htmlFor="reg-student-id"
            className="mb-2 block text-base font-semibold text-emerald-50"
          >
            Student ID
          </label>
          <input
            id="reg-student-id"
            name="studentId"
            required
            className="w-full rounded-full border-none bg-white px-6 py-4 text-base font-medium text-emerald-900 shadow-sm outline-none ring-0 focus:ring-2 focus:ring-emerald-400"
          />
        </div>
      )}

      <div>
        <label
          htmlFor="reg-password"
          className="mb-2 block text-base font-semibold text-emerald-50"
        >
          Password
        </label>
        <input
          id="reg-password"
          name="password"
          type="password"
          required
          className="w-full rounded-full border-none bg-white px-6 py-4 text-base font-medium text-emerald-900 shadow-sm outline-none ring-0 focus:ring-2 focus:ring-emerald-400"
        />
      </div>

      <div>
        <label
          htmlFor="reg-confirm"
          className="mb-2 block text-base font-semibold text-emerald-50"
        >
          Confirm Password
        </label>
        <input
          id="reg-confirm"
          name="confirm"
          type="password"
          required
          className="w-full rounded-full border-none bg-white px-6 py-4 text-base font-medium text-emerald-900 shadow-sm outline-none ring-0 focus:ring-2 focus:ring-emerald-400"
        />
      </div>

      {error && (
        <p className="rounded-md bg-red-100 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-3 w-full rounded-full bg-white px-10 py-4 text-base font-extrabold tracking-wide text-emerald-800 shadow-sm transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? 'Registering…' : 'REGISTER'}
      </button>
    </form>
  );
}



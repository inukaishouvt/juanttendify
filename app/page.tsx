'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [activeModal, setActiveModal] = useState<'login' | 'register' | null>(
    null
  );
  const [showTC, setShowTC] = useState(false);


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
          <nav className="mx-auto flex w-full items-center justify-between px-6 py-4 sm:px-8 sm:py-5">
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
                <span className="text-lg font-semibold text-emerald-900 font-quicksand">
                  Juanttendify
                </span>
              </Link>

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
                  setShowTC(true);
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
        {(activeModal || showTC) && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
            <div
              className="absolute inset-0"
              onClick={() => {
                setActiveModal(null);
                setShowTC(false);
              }}
            />
            <div className="relative z-50 w-full max-w-sm rounded-[32px] bg-emerald-700/95 px-8 py-8 text-white shadow-2xl">
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  setShowTC(false);
                }}
                className="absolute right-6 top-6 text-2xl text-emerald-50 hover:text-white"
                aria-label="Close"
              >
                ✕
              </button>

              {showTC ? (
                <TermsAndConditions
                  onAccept={() => {
                    setShowTC(false);
                    setActiveModal('register');
                  }}
                  onDecline={() => setShowTC(false)}
                />
              ) : activeModal === 'login' ? (
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
function TermsAndConditions({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) {
  return (
    <div className="space-y-4">
      <h2 className="mb-4 text-center text-2xl font-extrabold tracking-wide">
        TERMS & CONDITIONS
      </h2>
      <div className="max-h-64 overflow-y-auto text-sm text-emerald-50 space-y-3 pr-2 scrollbar-thin scrollbar-thumb-emerald-400 scrollbar-track-emerald-800 text-justify leading-relaxed">
        <p>By using the Juanttendify application, you agree to the following terms:</p>
        <div className="space-y-2">
          <p><strong>1. Account Security:</strong> You are responsible for all activities that occur under your account.</p>
          <p><strong>2. Attendance Policy:</strong> The application uses precise location data for verification. Falsifying location is strictly prohibited.</p>
          <p><strong>3. Data Privacy:</strong> We store your name, ID, and attendance records for institutional use.</p>
          <p><strong>4. Institutional Use:</strong> Data collected is subject to the privacy policies of your respective school/university.</p>
        </div>
      </div>
      <div className="flex gap-4 pt-4">
        <button
          onClick={onDecline}
          className="flex-1 rounded-full border-2 border-emerald-50/50 px-4 py-3 text-xs font-bold hover:bg-emerald-600 transition-colors uppercase tracking-widest"
        >
          Decline
        </button>
        <button
          onClick={onAccept}
          className="flex-1 rounded-full bg-white px-4 py-3 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors uppercase tracking-widest shadow-lg"
        >
          Accept
        </button>
        <div className="text-center pt-4">
          <Link href="/privacy" className="text-xs text-emerald-50/70 hover:text-white underline">
            Privacy Policy
          </Link>
        </div>
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
      } else if (data.user.role === 'sup_adm') {
        window.location.href = '/sup_adm';
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="mb-4 text-center text-2xl font-extrabold tracking-wide">
        LOG IN
      </h2>

      <div>
        <label
          htmlFor="login-email"
          className="mb-1 block text-sm font-semibold text-emerald-50"
        >
          Email address
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          required
          className="w-full rounded-full border-none bg-white px-5 py-3 text-sm font-medium text-emerald-900 shadow-sm outline-none ring-0 focus:ring-2 focus:ring-emerald-400"
        />
      </div>

      <div>
        <label
          htmlFor="login-password"
          className="mb-1 block text-sm font-semibold text-emerald-50"
        >
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          required
          className="w-full rounded-full border-none bg-white px-5 py-3 text-sm font-medium text-emerald-900 shadow-sm outline-none ring-0 focus:ring-2 focus:ring-emerald-400"
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
        className="mt-2 w-full rounded-full bg-white px-8 py-3 text-sm font-extrabold tracking-wide text-emerald-800 shadow-sm transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
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
    const studentLrn = (formData.get('studentLrn') as string)?.trim() || undefined;

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
          studentLrn: role === 'student' ? studentLrn : undefined,
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
    <form onSubmit={handleSubmit} className="space-y-3">
      <h2 className="mb-4 text-center text-2xl font-extrabold tracking-wide">
        REGISTER
      </h2>

      <div>
        <label
          htmlFor="reg-name"
          className="mb-1 block text-sm font-semibold text-emerald-50"
        >
          Full Name
        </label>
        <input
          id="reg-name"
          name="name"
          required
          className="w-full rounded-full border-none bg-white px-5 py-3 text-sm font-medium text-emerald-900 shadow-sm outline-none ring-0 focus:ring-2 focus:ring-emerald-400"
        />
      </div>

      <div>
        <label
          htmlFor="reg-email"
          className="mb-1 block text-sm font-semibold text-emerald-50"
        >
          Email address
        </label>
        <input
          id="reg-email"
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
          className={`rounded-full px-4 py-2 ${role === 'student'
            ? 'bg-white text-emerald-800'
            : 'bg-emerald-600 text-emerald-50'
            }`}
        >
          Student
        </button>
        <button
          type="button"
          onClick={() => setRole('teacher')}
          className={`rounded-full px-4 py-2 ${role === 'teacher'
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
            htmlFor="reg-student-lrn"
            className="mb-1 block text-sm font-semibold text-emerald-50"
          >
            Student LRN
          </label>
          <input
            id="reg-student-lrn"
            name="studentLrn"
            required
            className="w-full rounded-full border-none bg-white px-5 py-3 text-sm font-medium text-emerald-900 shadow-sm outline-none ring-0 focus:ring-2 focus:ring-emerald-400"
          />
        </div>
      )}

      <div>
        <label
          htmlFor="reg-password"
          className="mb-1 block text-sm font-semibold text-emerald-50"
        >
          Password
        </label>
        <input
          id="reg-password"
          name="password"
          type="password"
          required
          className="w-full rounded-full border-none bg-white px-5 py-3 text-sm font-medium text-emerald-900 shadow-sm outline-none ring-0 focus:ring-2 focus:ring-emerald-400"
        />
      </div>

      <div>
        <label
          htmlFor="reg-confirm"
          className="mb-1 block text-sm font-semibold text-emerald-50"
        >
          Confirm Password
        </label>
        <input
          id="reg-confirm"
          name="confirm"
          type="password"
          required
          className="w-full rounded-full border-none bg-white px-5 py-3 text-sm font-medium text-emerald-900 shadow-sm outline-none ring-0 focus:ring-2 focus:ring-emerald-400"
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
        className="mt-2 w-full rounded-full bg-white px-8 py-3 text-sm font-extrabold tracking-wide text-emerald-800 shadow-sm transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? 'Registering…' : 'REGISTER'}
      </button>
    </form>
  );
}



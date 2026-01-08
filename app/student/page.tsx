'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Link from 'next/link';
import Image from 'next/image';
import { QrCode, ClipboardList, LogOut, User, Key, CheckCircle2, ChevronRight, LayoutDashboard } from 'lucide-react';
import { formatTime12h, formatDateManila, getManilaToday } from '@/lib/utils';

type TabKey = 'scanner' | 'attendance' | 'qr' | 'profile';

export default function StudentPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('scanner');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [periods, setPeriods] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(getManilaToday());
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const [scanning, setScanning] = useState(false);
  const isProcessingScan = useRef(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiResponses, setApiResponses] = useState<any[]>([]);

  const isSecretary = user?.role === 'secretary';

  useEffect(() => {
    // Check for token in localStorage
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setToken(storedToken);
      setUser(parsedUser);

      if (parsedUser.role === 'secretary') {
        fetchPeriods(storedToken);
      }
    }
  }, []);

  const fetchPeriods = async (authToken: string) => {
    try {
      const res = await fetch('/api/periods', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setPeriods(data.periods || []);
      }
    } catch (err) {
      console.error('Error fetching periods:', err);
    }
  };

  const fetchAttendance = async (authToken: string, periodId: string, date: string) => {
    if (!periodId || !date) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance/list?periodId=${periodId}&date=${date}`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setAttendance(data.attendance || []);
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && isSecretary && activeTab === 'attendance' && selectedPeriod && selectedDate) {
      fetchAttendance(token, selectedPeriod, selectedDate);
    }
  }, [activeTab, selectedPeriod, selectedDate, token, isSecretary]);

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess('Password updated successfully!');
        (e.target as HTMLFormElement).reset();
      } else {
        setError(data.error || 'Failed to update password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => undefined).finally(() => {
            scannerRef.current?.clear();
            scannerRef.current = null;
          });
        } else {
          scannerRef.current.clear();
          scannerRef.current = null;
        }
      }
    };
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const requestBody = { email, password: '***' }; // Hide password in display

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      // Store API response
      setApiResponses([{
        endpoint: 'POST /api/auth/login',
        request: requestBody,
        response: data,
        status: res.status,
        timestamp: new Date().toISOString(),
      }]);

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setError(null);
    } catch (err) {
      setError('Failed to login');
      setApiResponses([{
        endpoint: 'POST /api/auth/login',
        request: requestBody,
        response: { error: 'Network error' },
        status: 500,
        timestamp: new Date().toISOString(),
      }]);
    }
  };

  const startScanner = async () => {
    if (!scannerContainerRef.current || scannerRef.current) return;

    // Check if we're on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isHTTPS = window.location.protocol === 'https:';

    // iOS requires HTTPS (except for localhost)
    if (isIOS && !isHTTPS && !isLocalhost) {
      setError('iOS Safari requires HTTPS for camera access. Please use https:// or deploy to a server with HTTPS.');
      return;
    }

    const html5QrCode = new Html5Qrcode(scannerContainerRef.current.id);
    scannerRef.current = html5QrCode;

    // Camera configuration
    const config = {
      fps: isIOS ? 5 : 10,
      qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
        const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
        const qrboxSize = Math.floor(minEdgeSize * 0.75);
        return { width: qrboxSize, height: qrboxSize };
      },
      aspectRatio: 1.0,
    };

    const startWithConfig = async (cameraConfig: any) => {
      await html5QrCode.start(
        cameraConfig,
        config,
        (decodedText) => handleScan(decodedText),
        () => { /* ignore scan errors */ }
      );
    };

    try {
      await startWithConfig({ facingMode: 'environment' });
      setScanning(true);
      setError(null);
    } catch (err: any) {
      console.warn('Back camera failed, trying fallback...', err);

      try {
        // Try clearing before fallback or front camera
        await html5QrCode.clear();
      } catch (e) {
        console.error('Clear failed before fallback:', e);
      }

      try {
        // Try simple facingMode: 'user' as fallback
        await startWithConfig({ facingMode: 'user' });
        setScanning(true);
        setError(null);
      } catch (err2: any) {
        console.error('Scanner start error:', err2);
        const errorMessage = err2?.message || err2?.toString() || 'Unknown error';

        if (errorMessage.includes('Permission') || errorMessage.includes('NotAllowed')) {
          setError('Camera permission denied. Please allow camera access in your browser settings.');
        } else if (errorMessage.includes('NotFound') || errorMessage.includes('no camera')) {
          setError('No camera found on this device.');
        } else {
          setError(`Camera error: ${errorMessage}`);
        }

        // Final cleanup on failure
        try {
          await html5QrCode.clear();
          scannerRef.current = null;
        } catch {
          // ignore
        }
      }
    }
  };

  const stopScanner = async () => {
    if (!scannerRef.current) return;
    try {
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
      await scannerRef.current.clear();
    } catch (err) {
      console.warn('Error stopping scanner:', err);
    } finally {
      scannerRef.current = null;
      setScanning(false);
    }
  };

  const getLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true, // Request precise location
          timeout: 10000, // 10 second timeout
          maximumAge: 0, // Don't use cached location
        }
      );
    });
  };

  const handleScan = async (qrCode: string) => {
    if (!token || isProcessingScan.current) return;
    isProcessingScan.current = true;

    let locationData: { latitude: number; longitude: number; accuracy: number } | null = null;

    // Try to get location
    try {
      const position = await getLocation();
      locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };
    } catch (err) {
      // Location access denied or failed - will be marked as in_review
      console.warn('Location access failed:', err);
      // Continue with scan but without location data
    }

    const requestBody = {
      qrCode,
      ...(locationData && {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
      }),
    };

    try {
      const res = await fetch('/api/attendance/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      // Store API response
      setApiResponses(prev => [{
        endpoint: 'POST /api/attendance/scan',
        request: requestBody,
        response: data,
        status: res.status,
        timestamp: new Date().toISOString(),
      }, ...prev]);

      if (!res.ok) {
        setError(data.error);
        stopScanner();
        return;
      }

      setResult(data);
      stopScanner();
      setError(null);
    } catch (err) {
      setError('Failed to scan QR code');
      setApiResponses(prev => [{
        endpoint: 'POST /api/attendance/scan',
        request: requestBody,
        response: { error: 'Network error' },
        status: 500,
        timestamp: new Date().toISOString(),
      }, ...prev]);
      stopScanner();
    } finally {
      isProcessingScan.current = false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    stopScanner();
    setResult(null);
  };

  if (!token || !user) {
    return (
      <div className="min-h-screen relative flex items-center justify-center px-4" style={{ backgroundImage: 'url(/Background.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative bg-white/95 rounded-3xl shadow-2xl px-8 py-10 max-w-md w-full text-center z-10">
          <div className="flex justify-center mb-4">
            <Image src="/Logo.png" alt="Juanttendify Logo" width={120} height={120} className="object-contain" unoptimized />
          </div>
          <h1 className="text-2xl font-extrabold text-emerald-800 mb-2">
            Student access only
          </h1>
          <p className="text-sm text-emerald-700 mb-6">
            Please log in from the main page using a student account to scan
            your teacher&apos;s QR code.
          </p>
          {error && (
            <div className="mb-4 rounded-md bg-red-100 px-3 py-2 text-xs font-medium text-red-700">
              {error}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-emerald-800 mb-1">
                Student email
              </label>
              <input
                type="email"
                name="email"
                required
                className="w-full rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-emerald-800 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                className="w-full rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-emerald-600 px-4 py-2 text-sm font-extrabold tracking-wide text-white shadow-sm hover:bg-emerald-700"
            >
              Log in as student
            </button>
          </form>
          <Link
            href="/"
            className="mt-5 inline-block text-xs font-semibold text-emerald-900 underline underline-offset-2"
          >
            Back to Get Started
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-2 py-4" style={{ backgroundImage: 'url(/Background.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-black/30"></div>
      <div className="relative mx-auto w-full max-w-md z-10">
        {/* Phone frame */}
        <div className="relative mx-auto w-full max-h-[95vh] rounded-[40px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col">
          {/* Top app bar */}
          <div className="flex items-center justify-between bg-emerald-700 px-4 py-3 text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <Image src="/Logo.png" alt="Logo" width={32} height={32} className="object-contain" unoptimized />
              <span className="text-sm font-semibold font-quicksand">Juanttendify</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-[11px] font-medium">
                {user?.name?.split(' ')[0] ?? 'Student'}
              </span>
              <button
                onClick={logout}
                className="text-[11px] rounded-full bg-emerald-900/70 px-3 py-1 font-semibold"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 flex flex-col bg-gradient-to-b from-white/90 to-emerald-50 overflow-hidden min-h-0">
            {activeTab === 'scanner' && (
              <div className="flex-1 flex flex-col p-4 overflow-hidden">
                {!result ? (
                  <>
                    <h1 className="text-center text-sm font-extrabold tracking-[0.18em] text-emerald-800 mb-2 flex-shrink-0">
                      SCAN HERE
                    </h1>
                    {error && (
                      <div className="mb-2 rounded-md bg-red-100 px-3 py-2 text-[10px] font-medium text-red-700 flex-shrink-0">
                        {error}
                      </div>
                    )}

                    {/* Scanner window */}
                    <div className="flex-1 flex items-center justify-center min-h-0 my-2">
                      <div className="relative w-full max-w-[280px] aspect-square rounded-[25px] border-4 border-emerald-700 bg-black/10 overflow-hidden">
                        <div
                          id="qr-reader"
                          ref={scannerContainerRef}
                          className="absolute inset-0 rounded-xl"
                        />
                        <div className="pointer-events-none absolute inset-4 border-2 border-dashed border-yellow-400 rounded-lg" />
                        <p className="pointer-events-none absolute bottom-3 w-full text-center text-[10px] font-semibold tracking-[0.16em] text-white drop-shadow">
                          SCAN HERE
                        </p>
                      </div>
                    </div>

                    <div className="flex-shrink-0 space-y-1">
                      <p className="text-center text-[9px] text-emerald-700 font-medium pt-1">
                        📍 Location access required
                      </p>
                      <button
                        onClick={scanning ? stopScanner : startScanner}
                        className={`w-full rounded-full px-4 py-2.5 text-xs font-extrabold tracking-wide text-white shadow-sm transition-all active:scale-95 ${scanning
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                      >
                        {scanning ? 'Stop Scanner' : 'Start Scanner'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col justify-center animate-in fade-in zoom-in duration-300">
                    <div className="rounded-2xl bg-emerald-700 px-4 py-6 text-center text-white shadow-lg">
                      <div className="flex justify-center mb-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                          <CheckCircle2 size={32} className="text-white" />
                        </div>
                      </div>
                      <h2 className="text-lg font-extrabold mb-1 font-quicksand">
                        Attendance Recorded!
                      </h2>
                      <div className="mt-4 rounded-xl bg-white/95 px-3 py-4 text-emerald-900 shadow-inner">
                        <p className="text-xs font-extrabold truncate">{result.student?.name ?? user.name}</p>
                        <p className="mt-1 text-[10px] text-emerald-600 font-medium">{result.period?.name}</p>
                        <p className="mt-2 text-[13px] font-bold text-emerald-800">{formatTime12h(result.attendance.scannedAt)}</p>

                        <div className="mt-4 flex flex-col items-center gap-1">
                          <span className={`px-4 py-1 rounded-full text-[10px] font-black tracking-wider uppercase ${result.status === 'in' ? 'bg-emerald-100 text-emerald-700' :
                            result.status === 'late' ? 'bg-orange-100 text-orange-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                            {result.status === 'in_review' ? 'IN REVIEW' : (result.status === 'in' ? 'PRESENT' : result.status)}
                          </span>
                          {result.attendance?.locationStatus === 'in_review' && (
                            <p className="text-[9px] text-orange-600 font-bold italic">
                              ⚠ Verification pending
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => { setResult(null); setError(null); }}
                      className="mt-6 w-full rounded-full bg-emerald-600 px-4 py-3 text-xs font-extrabold tracking-wide text-white shadow-lg hover:bg-emerald-700 transition-all active:scale-95"
                    >
                      Scan Another Code
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'attendance' && isSecretary && (
              <div className="flex-1 flex flex-col p-4 overflow-hidden space-y-4">
                <header className="flex-shrink-0">
                  <h2 className="text-sm font-extrabold text-emerald-800 tracking-wider">CLASS LOGS</h2>
                  <p className="text-[10px] text-emerald-600 font-medium">Secretary View</p>
                </header>

                <div className="flex gap-2 flex-shrink-0">
                  <select
                    className="flex-1 rounded-xl border border-emerald-100 bg-white px-3 py-2 text-[11px] font-semibold text-emerald-900 outline-none"
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                  >
                    <option value="">Select Class</option>
                    {periods.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    className="rounded-xl border border-emerald-100 bg-white px-3 py-2 text-[11px] font-semibold text-emerald-900 outline-none"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 rounded-2xl bg-white/50 p-2 shadow-inner border border-emerald-50/50">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 opacity-50">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                      <p className="text-[10px] font-bold text-emerald-800">Fetching Logs...</p>
                    </div>
                  ) : attendance.length > 0 ? (
                    attendance.map((r) => (
                      <div key={r.attendance.id} className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm border border-emerald-50">
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-emerald-900 truncate">{r.student.name}</p>
                          <p className="text-[9px] text-emerald-600">{formatTime12h(r.attendance.scannedAt)}</p>
                        </div>
                        <span className={`flex-shrink-0 ml-2 px-3 py-1 rounded-full text-[9px] font-black uppercase ${r.attendance.status === 'in' ? 'bg-emerald-100 text-emerald-700' :
                          r.attendance.status === 'late' ? 'bg-orange-100 text-orange-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                          {r.attendance.status === 'in' ? 'PRS' : r.attendance.status.slice(0, 3)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full opacity-40">
                      <ClipboardList size={32} className="text-emerald-300 mb-2" />
                      <p className="text-[10px] font-bold text-emerald-800">No logs for this date</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'qr' && isSecretary && (
              <div className="flex-1 flex flex-col p-4 overflow-hidden space-y-4">
                <header className="flex-shrink-0">
                  <h2 className="text-sm font-extrabold text-emerald-800 tracking-wider">ASSISTANT QR</h2>
                  <p className="text-[10px] text-emerald-600 font-medium">Secretary Generator</p>
                </header>

                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                  {/* Simplified QR Generator Component - Since the logic needs to stay safe, 
                       we recommend the secretary uses the teacher's main QR or 
                       we implement a basic version if you really need it.
                       For now, let's keep it simple as requested. */}
                  <div className="p-8 rounded-3xl bg-emerald-50 border-2 border-dashed border-emerald-200 text-emerald-700">
                    <QrCode size={48} className="mx-auto mb-4 opacity-40" />
                    <p className="text-xs font-bold leading-relaxed px-4">
                      Assistant QR features are currently being synchronized with your teacher&apos;s classes.
                    </p>
                  </div>
                  <p className="text-[10px] px-6 text-emerald-500 font-medium">
                    Secretary access allows you to assist in class management and attendance monitoring.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="flex-1 flex flex-col p-5 overflow-y-auto space-y-6">
                <section>
                  <h2 className="text-xs font-black text-emerald-800 tracking-widest uppercase mb-4">Account Information</h2>
                  <div className="rounded-2xl bg-white p-5 shadow-md border border-emerald-50 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                        <User size={24} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold text-emerald-900 truncate">{user.name}</p>
                        <p className="text-xs text-emerald-600 truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-emerald-50 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] font-black text-emerald-800 uppercase opacity-60">Role</p>
                        <p className="text-xs font-bold text-emerald-700 capitalize">{user.role}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-emerald-800 uppercase opacity-60">LRN</p>
                        <p className="text-xs font-bold text-emerald-700">{user.studentLrn || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xs font-black text-emerald-800 tracking-widest uppercase mb-4">Security</h2>
                  <form onSubmit={handlePasswordChange} className="rounded-2xl bg-emerald-900 px-5 py-6 shadow-xl space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Key size={16} className="text-emerald-300" />
                      <h3 className="text-xs font-bold text-white">Change Password</h3>
                    </div>

                    {success && (
                      <div className="rounded-lg bg-emerald-500/20 px-3 py-2 text-[10px] font-bold text-emerald-300">
                        {success}
                      </div>
                    )}
                    {error && (
                      <div className="rounded-lg bg-red-500/20 px-3 py-2 text-[10px] font-bold text-red-300">
                        {error}
                      </div>
                    )}

                    <div className="space-y-3">
                      <input
                        type="password"
                        name="currentPassword"
                        placeholder="Current Password"
                        required
                        className="w-full rounded-xl bg-white/10 px-4 py-2.5 text-xs text-white placeholder-emerald-400 outline-none focus:ring-1 focus:ring-emerald-400 border border-white/5"
                      />
                      <input
                        type="password"
                        name="newPassword"
                        placeholder="New Password"
                        required
                        className="w-full rounded-xl bg-white/10 px-4 py-2.5 text-xs text-white placeholder-emerald-400 outline-none focus:ring-1 focus:ring-emerald-400 border border-white/5"
                      />
                      <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm New Password"
                        required
                        className="w-full rounded-xl bg-white/10 px-4 py-2.5 text-xs text-white placeholder-emerald-400 outline-none focus:ring-1 focus:ring-emerald-400 border border-white/5"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-full bg-emerald-500 py-2.5 text-[11px] font-black tracking-widest text-white uppercase shadow-lg active:scale-95 transition-transform disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Update Password'}
                    </button>
                  </form>
                </section>

                <div className="pb-4">
                  <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 text-red-500 font-bold text-xs p-4 rounded-2xl bg-red-50 border border-red-100 active:scale-95 transition-transform"
                  >
                    <LogOut size={16} />
                    Logout Account
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Navigation */}
          <nav className="flex-shrink-0 bg-white border-t border-emerald-50 px-2 py-1 pb-4 shadow-[0_-5px_20px_rgba(0,0,0,0.03)]">
            <div className="flex justify-around items-center h-14">
              <NavButton
                active={activeTab === 'scanner'}
                onClick={() => setActiveTab('scanner')}
                icon={<LayoutDashboard size={20} />}
                label="Home"
              />

              {isSecretary && (
                <>
                  <NavButton
                    active={activeTab === 'attendance'}
                    onClick={() => setActiveTab('attendance')}
                    icon={<ClipboardList size={20} />}
                    label="Logs"
                  />
                  <NavButton
                    active={activeTab === 'qr'}
                    onClick={() => setActiveTab('qr')}
                    icon={<QrCode size={20} />}
                    label="Assistant"
                  />
                </>
              )}

              <NavButton
                active={activeTab === 'profile'}
                onClick={() => setActiveTab('profile')}
                icon={<User size={20} />}
                label="Profile"
              />
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 w-16 transition-all duration-300 ${active ? 'text-emerald-700' : 'text-emerald-300'
        }`}
    >
      <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-emerald-50' : ''
        }`}>
        {icon}
      </div>
      <span className="text-[9px] font-extrabold tracking-tight">{label}</span>
      {active && <div className="h-1 w-1 rounded-full bg-emerald-700 mt-0.5 animate-in fade-in zoom-in" />}
    </button>
  );
}



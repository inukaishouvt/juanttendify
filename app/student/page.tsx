'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Link from 'next/link';
import Image from 'next/image';

export default function StudentPage() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiResponses, setApiResponses] = useState<any[]>([]);
  const scannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for token in localStorage
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.stop().catch(() => undefined);
        scanner.clear();
      }
    };
  }, [scanner]);

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
    if (!scannerRef.current || scanner) return;

    // Check if we're on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isHTTPS = window.location.protocol === 'https:';

    // iOS requires HTTPS (except for localhost in some cases, but Safari is strict)
    if (isIOS && !isHTTPS && !isLocalhost) {
      setError('iOS Safari requires HTTPS for camera access. Please use https:// or deploy to a server with HTTPS.');
      return;
    }

    // First, try to get camera permission explicitly
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      // If we got the stream, stop it immediately - we just wanted to check permissions
      stream.getTracks().forEach(track => track.stop());
    } catch (permErr: any) {
      console.error('Camera permission error:', permErr);
      if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
        setError('Camera permission denied. Please allow camera access in Safari settings: Settings > Safari > Camera > Allow');
        return;
      } else if (permErr.name === 'NotFoundError') {
        setError('No camera found on this device.');
        return;
      } else if (permErr.name === 'NotReadableError' || permErr.name === 'TrackStartError') {
        setError('Camera is already in use by another app. Please close other apps using the camera.');
        return;
      }
    }

    const html5QrCode = new Html5Qrcode(scannerRef.current.id);
    
    // Simplified camera configs - start with most common
    const cameraConfigs = [
      { facingMode: 'environment' }, // Back camera
      { facingMode: 'user' }, // Front camera
    ];

    let lastError: any = null;

    for (const config of cameraConfigs) {
      try {
        await html5QrCode.start(
          config,
          {
            fps: isIOS ? 5 : 10,
            qrbox: function(viewfinderWidth, viewfinderHeight) {
              const minEdgePercentage = 0.75;
              const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
              const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
              return {
                width: qrboxSize,
                height: qrboxSize
              };
            },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            handleScan(decodedText);
          },
          (errorMessage) => {
            // Ignore scan errors
            console.debug('Scan error:', errorMessage);
          }
        );
        setScanner(html5QrCode);
        setScanning(true);
        setError(null);
        return; // Success!
      } catch (err: any) {
        lastError = err;
        console.warn(`Camera config failed:`, err);
        try {
          await html5QrCode.clear();
        } catch {
          // ignore
        }
      }
    }

    // If all configs failed, show helpful error
    console.error('All camera configs failed:', lastError);
    const errorMessage = lastError?.message || lastError?.toString() || 'Unknown error';
    
    if (errorMessage.includes('Permission') || errorMessage.includes('NotAllowed')) {
      setError('Camera permission denied. Go to Settings > Safari > Camera and allow access, then refresh the page.');
    } else if (errorMessage.includes('NotFound') || errorMessage.includes('no camera')) {
      setError('No camera found on this device.');
    } else if (isIOS && !isHTTPS) {
      setError('iOS Safari requires HTTPS. For localhost testing, you may need to set up HTTPS or use a different browser.');
    } else {
      setError(`Camera error: ${errorMessage}. Try refreshing the page or checking camera permissions.`);
    }
    
    try {
      await html5QrCode.clear();
    } catch {
      // ignore
    }
  };

  const stopScanner = async () => {
    if (!scanner) return;
    try {
      await scanner.stop();
      await scanner.clear();
    } catch {
      // ignore
    } finally {
      setScanner(null);
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
    if (!token) return;

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
      <div className="min-h-screen relative flex items-center justify-center px-4" style={{ backgroundImage: 'url(/background.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative bg-white/95 rounded-3xl shadow-2xl px-8 py-10 max-w-md w-full text-center z-10">
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="Juanttendify Logo" width={120} height={120} className="object-contain" unoptimized />
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
    <div className="min-h-screen relative flex items-center justify-center px-2 py-4" style={{ backgroundImage: 'url(/background.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative mx-auto w-full max-w-md z-10">
          {/* Phone frame */}
          <div className="relative mx-auto w-full max-h-[95vh] rounded-[40px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col">
            {/* Top app bar */}
            <div className="flex items-center justify-between bg-emerald-700 px-4 py-3 text-white flex-shrink-0">
              <div className="flex items-center gap-2">
                <Image src="/logo.png" alt="Logo" width={32} height={32} className="object-contain" unoptimized />
                <span className="text-sm font-semibold">Juanttendify</span>
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

            {/* Content */}
            <div className="flex-1 flex flex-col bg-gradient-to-b from-white/90 to-emerald-50 px-4 pb-4 pt-3 overflow-hidden min-h-0">
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

                  {/* Scanner window - optimized to fit */}
                  <div className="flex-1 flex items-center justify-center min-h-0 my-2">
                    <div className="relative w-full max-w-[280px] aspect-square rounded-[25px] border-4 border-emerald-700 bg-black/10 overflow-hidden">
                      <div
                        id="qr-reader"
                        ref={scannerRef}
                        className="absolute inset-0 rounded-xl"
                      />
                      <div className="pointer-events-none absolute inset-4 border-2 border-dashed border-yellow-400 rounded-lg" />
                      <p className="pointer-events-none absolute bottom-3 w-full text-center text-[10px] font-semibold tracking-[0.16em] text-white drop-shadow">
                        SCAN HERE
                      </p>
                    </div>
                  </div>

                  {/* Bottom section - always visible */}
                  <div className="flex-shrink-0 space-y-1">
                    <p className="text-center text-[9px] text-emerald-700 font-medium">
                      📍 Location access required
                    </p>
                    {typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && window.location.protocol !== 'https:' && (
                      <p className="text-center text-[8px] text-orange-600 font-medium px-2">
                        ⚠️ iOS requires HTTPS
                      </p>
                    )}
                    <button
                      onClick={scanning ? stopScanner : startScanner}
                      className={`w-full rounded-full px-4 py-2.5 text-xs font-extrabold tracking-wide text-white shadow-sm ${
                        scanning
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {scanning ? 'Stop Scanner' : 'Start Scanner'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1 flex flex-col justify-center rounded-2xl bg-emerald-700 px-4 py-5 text-center text-white overflow-y-auto">
                    <h2 className="text-base font-extrabold mb-2">
                      Attendance Recorded!
                    </h2>
                    <div className="rounded-xl bg-white/95 px-3 py-4 text-emerald-900">
                      <p className="text-xs font-semibold">
                        {result.student?.name ?? user.name}
                      </p>
                      <p className="mt-1 text-[10px] text-emerald-700">
                        {result.period?.name}
                      </p>
                      <p className="mt-2 text-[11px] font-semibold text-emerald-800">
                        {new Date(result.attendance.scannedAt).toLocaleTimeString(
                          undefined,
                          { hour: '2-digit', minute: '2-digit' }
                        )}
                      </p>
                      <div className="mt-3 flex flex-col items-center gap-1.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xl text-white">
                          ✓
                        </div>
                        <p className="text-[10px] font-semibold text-emerald-800">
                          Marked as{' '}
                          <span className="uppercase">
                            {result.status === 'in'
                              ? 'PRESENT'
                              : result.status === 'late'
                              ? 'LATE'
                              : result.status === 'in_review'
                              ? 'IN REVIEW'
                              : 'ABSENT'}
                          </span>
                        </p>
                        {result.attendance?.locationStatus === 'in_review' && (
                          <p className="mt-1 text-[9px] text-orange-600 font-medium">
                            ⚠ Location verification pending
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setResult(null);
                      setError(null);
                    }}
                    className="mt-2 w-full rounded-full bg-emerald-600 px-4 py-2 text-xs font-extrabold tracking-wide text-white shadow-sm hover:bg-emerald-700 flex-shrink-0"
                  >
                    Scan Again
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}


'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home, ClipboardList, BarChart3, QrCode, LogOut } from 'lucide-react';

type AttendanceRecord = {
  attendance: {
    id: string;
    status: 'in' | 'late' | 'out' | 'in_review';
    scannedAt: string;
    date: string;
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    locationStatus: 'verified' | 'in_review' | null;
  };
  student: {
    id: string;
    name: string;
    email: string;
  };
  period: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
  };
};

type Period = {
  id: string;
  name: string;
  strand?: string;
  section?: string;
  subject?: string;
  startTime: string;
  endTime: string;
  lateThreshold: number;
  teacherId?: string;
};

type TabKey = 'dashboard' | 'attendance' | 'reports' | 'qr' | 'classes';

export default function TeacherPage() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('dashboard');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'present' | 'absent' | 'late' | 'in_review'
  >('all');
  const [search, setSearch] = useState('');

  // Load session
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (!storedToken || !storedUser) {
      window.location.href = '/';
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== 'teacher') {
      window.location.href = '/';
      return;
    }
    setToken(storedToken);
    setUser(parsedUser);
  }, []);

  // Fetch periods & attendance when session/filters change
  useEffect(() => {
    if (!token) return;
    void fetchPeriods();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    void fetchAttendance();
  }, [token, selectedPeriod, selectedDate]);

  // Auto-refresh attendance data every 5 seconds
  useEffect(() => {
    if (!token) return;

    // Only auto-refresh on dashboard, attendance, and QR tabs
    if (tab !== 'dashboard' && tab !== 'attendance' && tab !== 'qr') return;

    const intervalId = setInterval(() => {
      void fetchAttendance(true);
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(intervalId);
  }, [token, selectedPeriod, selectedDate, tab]);

  async function fetchPeriods() {
    try {
      const res = await fetch('/api/periods', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setPeriods(data.periods);
        if (!selectedPeriod && data.periods.length > 0) {
          setSelectedPeriod(data.periods[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching periods:', err);
    }
  }

  async function fetchAttendance(isSilent = false) {
    if (!token) return;
    if (attendance.length === 0 && !isSilent) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDate) params.append('date', selectedDate);
      if (selectedPeriod) params.append('periodId', selectedPeriod);

      const res = await fetch(`/api/attendance/list?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setAttendance(data.attendance);
      } else {
        setError(data.error ?? 'Failed to load attendance');
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError('Failed to load attendance');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }

  async function generateQR() {
    if (!token || !selectedPeriod) {
      setError('Please select a class period first.');
      return;
    }

    setQrLoading(true);
    try {
      const res = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          periodId: selectedPeriod,
          date: selectedDate,
          expiresInMinutes: 60,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to generate QR code');
        return;
      }

      setQrCode(data.qrCode);
      setQrImage(data.qrCodeImage);
      setError(null);
    } catch (err) {
      console.error('Error generating QR code:', err);
      setError('Failed to generate QR code');
    } finally {
      setQrLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  }

  const filteredAttendance = useMemo(() => {
    return attendance.filter((record) => {
      const status =
        record.attendance.status === 'in'
          ? 'present'
          : record.attendance.status === 'late'
            ? 'late'
            : record.attendance.status === 'in_review'
              ? 'in_review'
              : 'absent';

      if (filterStatus !== 'all' && status !== filterStatus) return false;

      if (
        search &&
        !record.student.name.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [attendance, filterStatus, search]);

  const summary = useMemo(() => {
    let present = 0;
    let late = 0;
    let absent = 0;
    let inReview = 0;

    attendance.forEach((r) => {
      if (r.attendance.status === 'in') present += 1;
      else if (r.attendance.status === 'late') late += 1;
      else if (r.attendance.status === 'in_review') inReview += 1;
      else absent += 1;
    });

    return { present, late, absent, inReview, total: attendance.length };
  }, [attendance]);

  const verifyAttendance = async (attendanceId: string, newStatus: 'in' | 'late' | 'out') => {
    if (!token) return;

    try {
      const res = await fetch('/api/attendance/verify', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          attendanceId,
          status: newStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to verify attendance');
        return;
      }

      // Refresh attendance list
      await fetchAttendance();
      setError(null);
    } catch (err) {
      console.error('Error verifying attendance:', err);
      setError('Failed to verify attendance');
    }
  };

  if (!token || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-t from-emerald-700/80 via-emerald-500/40 to-white/85">
      <div className="mx-auto flex min-h-screen w-full">
        {/* Sidebar */}
        <aside className="flex w-72 flex-col bg-emerald-800/95 px-6 py-8 text-emerald-50">
          <div className="mb-10 flex items-center gap-4">
            <Image
              src="/green Logo.png"
              alt="Juanttendify Logo"
              width={56}
              height={56}
              className="object-contain"
              unoptimized
            />
            <span className="text-base font-semibold font-quicksand">Juanttendify</span>
          </div>

          <nav className="space-y-3 text-base font-semibold">
            <SidebarLink
              label="Dashboard"
              icon={<Home className="w-5 h-5" />}
              active={tab === 'dashboard'}
              onClick={() => setTab('dashboard')}
            />
            <SidebarLink
              label="Attendance Records"
              icon={<ClipboardList className="w-5 h-5" />}
              active={tab === 'attendance'}
              onClick={() => setTab('attendance')}
            />
            <SidebarLink
              label="QR Code Generator"
              icon={<QrCode className="w-5 h-5" />}
              active={tab === 'qr'}
              onClick={() => setTab('qr')}
            />
            <SidebarLink
              label="Class Management"
              icon={<ClipboardList className="w-5 h-5" />}
              active={tab === 'classes'}
              onClick={() => setTab('classes')}
            />
          </nav>

          <div className="mt-auto pt-8">
            <button
              onClick={logout}
              className="flex w-full items-center gap-4 rounded-full px-5 py-3 text-base font-semibold text-emerald-50 hover:bg-emerald-700/80"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col bg-white/80">
          {/* Top bar */}
          <header className="flex items-center justify-between border-b border-emerald-100 bg-white/80 px-10 py-6">
            <div>
              <p className="text-sm font-semibold text-emerald-700">
                Juan Sumulong Memorial Junior College
              </p>
              <p className="text-2xl font-bold text-emerald-900">
                {user.name}&apos;s Dashboard
              </p>
            </div>
            <div className="flex items-center gap-5">
              <div className="rounded-xl bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700">
                {new Date(selectedDate).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-600 bg-white">
                <span className="text-2xl text-emerald-700">👤</span>
              </div>
            </div>
          </header>

          {/* Tabs */}
          <main className="flex-1 overflow-y-auto px-10 py-8">
            {tab === 'dashboard' && (
              <DashboardTab
                periods={periods}
                summary={summary}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                onNavigateToAttendance={() => setTab('attendance')}
                user={user}
              />
            )}

            {tab === 'attendance' && (
              <AttendanceTab
                periods={periods}
                attendance={filteredAttendance}
                selectedDate={selectedDate}
                selectedPeriod={selectedPeriod}
                setSelectedDate={setSelectedDate}
                setSelectedPeriod={setSelectedPeriod}
                loading={loading}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                search={search}
                setSearch={setSearch}
                onVerify={verifyAttendance}
              />
            )}

            {tab === 'qr' && (
              <QrTab
                periods={periods}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                selectedPeriod={selectedPeriod}
                setSelectedPeriod={setSelectedPeriod}
                generateQR={generateQR}
                qrLoading={qrLoading}
                qrCode={qrCode}
                qrImage={qrImage}
                error={error}
                attendance={attendance}
              />
            )}

            {tab === 'classes' && (
              <ClassesTab
                periods={periods}
                onRefresh={fetchPeriods}
                token={token!}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

type SidebarLinkProps = {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
};

function SidebarLink({ label, icon, active, onClick }: SidebarLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-full px-5 py-3 ${active ? 'bg-emerald-600 text-white' : 'text-emerald-50 hover:bg-emerald-700/80'
        }`}
    >
      {icon}
      <span className="text-base font-semibold">{label}</span>
    </button>
  );
}

type DashboardTabProps = {
  periods: Period[];
  summary: { present: number; late: number; absent: number; inReview: number; total: number };
  selectedDate: string;
  onDateChange: (value: string) => void;
  onNavigateToAttendance: () => void;
  user: any;
};

function DashboardTab({
  periods,
  summary,
  selectedDate,
  onDateChange,
  onNavigateToAttendance,
  user,
}: DashboardTabProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-extrabold text-emerald-900">
        Your Dashboard
      </h2>

      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        {/* Subject classes */}
        <div className="rounded-3xl bg-emerald-700/95 p-5 text-white shadow-lg">
          <h3 className="mb-4 text-base font-semibold tracking-[0.15em]">
            SUBJECT CLASSES
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {periods.length === 0 ? (
              <p className="text-base text-emerald-100">
                No periods found yet. Create some in the QR Code Generator tab.
              </p>
            ) : (
              periods.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl bg-white text-emerald-800 px-6 py-4 text-sm font-semibold shadow-sm"
                >
                  <p>{p.name}</p>
                  <p className="mt-2 text-xs text-emerald-600">
                    {p.startTime} – {p.endTime}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Attendance summary */}
        <div className="flex flex-col rounded-3xl bg-emerald-700/95 p-5 text-white shadow-lg">
          <h3 className="mb-1 text-base font-semibold tracking-[0.15em]">
            ATTENDANCE SUMMARY
          </h3>
          <div className="flex flex-1 items-end gap-2">
            {(['present', 'late', 'absent', 'in_review'] as const).map((key) => {
              if (key === 'in_review' && summary.inReview === 0) return null;
              // Map the key to the correct property name in summary
              const summaryKey = key === 'in_review' ? 'inReview' : key;
              const value = summary[summaryKey as keyof typeof summary];
              const max = Math.max(summary.present, summary.late, summary.absent, summary.inReview, 1);
              const height = (value / max) * 100;
              const colors: Record<string, string> = {
                present: 'bg-emerald-400',
                late: 'bg-yellow-300',
                absent: 'bg-red-400',
                in_review: 'bg-orange-400',
              };
              return (
                <div
                  key={key}
                  className="flex flex-1 flex-col items-center justify-end gap-1"
                >
                  <div
                    className={`w-6 rounded-t-full ${colors[key]}`}
                    style={{ height: `${height || 10}%` }}
                  />
                  <span className="text-xs uppercase">
                    {key === 'present' ? 'Present' : key === 'late' ? 'Late' : key === 'in_review' ? 'Review' : 'Absent'}
                  </span>
                  <span className="text-sm font-bold">{value}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-emerald-100">
            <div>
              <p>Total students scanned</p>
              <p className="text-2xl font-bold">{summary.total}</p>
            </div>
            <button
              type="button"
              onClick={onNavigateToAttendance}
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
            >
              View records
            </button>
          </div>
        </div>
      </div>

      {/* Homeroom advisory row */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-3xl bg-emerald-800/95 px-8 py-6 text-white shadow-lg sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold tracking-[0.15em]">
            HOMEROOM ADVISORY
          </p>
          <p className="text-base">Select date to review attendance</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="rounded-full border-none bg-white px-5 py-3 text-sm font-medium text-emerald-800 shadow-sm outline-none ring-0 focus:ring-2 focus:ring-emerald-400"
          />
          <button
            type="button"
            onClick={onNavigateToAttendance}
            className="rounded-full bg-white px-6 py-3 text-sm font-extrabold tracking-wide text-emerald-800 shadow-sm hover:bg-emerald-100"
          >
            VIEW ICT 201
          </button>
        </div>
      </div>
    </div>
  );
}

type AttendanceTabProps = {
  periods: Period[];
  attendance: AttendanceRecord[];
  selectedDate: string;
  selectedPeriod: string;
  setSelectedDate: (v: string) => void;
  setSelectedPeriod: (v: string) => void;
  loading: boolean;
  filterStatus: 'all' | 'present' | 'absent' | 'late' | 'in_review';
  setFilterStatus: (v: 'all' | 'present' | 'absent' | 'late' | 'in_review') => void;
  search: string;
  setSearch: (v: string) => void;
  onVerify: (attendanceId: string, status: 'in' | 'late' | 'out') => void;
};

function AttendanceTab({
  periods,
  attendance,
  selectedDate,
  selectedPeriod,
  setSelectedDate,
  setSelectedPeriod,
  loading,
  filterStatus,
  setFilterStatus,
  search,
  setSearch,
  onVerify,
}: AttendanceTabProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-extrabold text-emerald-900">Attendance</h2>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-5">
        <div className="flex items-center gap-3">
          <span className="text-base font-medium text-emerald-900">Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-full border border-emerald-200 bg-white px-5 py-3 text-sm text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-base font-medium text-emerald-900">Period:</span>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-full border border-emerald-200 bg-white px-5 py-3 text-sm text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <option value="">All</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-base font-medium text-emerald-900">
            Filter:
          </span>
          <div className="flex flex-wrap gap-3 text-sm">
            {['all', 'present', 'absent', 'late', 'in_review'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() =>
                  setFilterStatus(status as 'all' | 'present' | 'absent' | 'late' | 'in_review')
                }
                className={`rounded-full px-4 py-2 font-semibold transition-all ${filterStatus === status
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'bg-emerald-50 text-emerald-800'
                  }`}
              >
                {status === 'all'
                  ? 'Default'
                  : status === 'in_review' ? 'In Review' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="ml-auto flex-1 min-w-[250px] max-w-md">
          <div className="flex items-center rounded-full bg-white px-5 py-3 text-sm text-emerald-800 shadow-sm">
            <span className="mr-3 text-lg text-emerald-500">🔍</span>
            <input
              type="text"
              placeholder="Search Student Name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-0 bg-transparent text-base outline-none"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-3xl bg-white shadow-lg">
        <div className="grid grid-cols-[2fr_1fr_1fr_1.5fr] border-b border-emerald-100 bg-emerald-50 px-8 py-4 text-sm font-extrabold uppercase tracking-[0.18em] text-emerald-800">
          <div>Name</div>
          <div className="text-center">Time-in</div>
          <div className="text-center">Status</div>
          <div className="text-center">Actions</div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-base text-emerald-700">
            Loading records…
          </div>
        ) : attendance.length === 0 ? (
          <div className="py-12 text-center text-base text-emerald-700">
            No attendance records found.
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto">
            {attendance.map((r) => {
              const status =
                r.attendance.status === 'in'
                  ? 'PRESENT'
                  : r.attendance.status === 'late'
                    ? 'LATE'
                    : r.attendance.status === 'in_review'
                      ? 'IN REVIEW'
                      : 'ABSENT';
              const colorClasses =
                status === 'PRESENT'
                  ? 'bg-emerald-600 text-white'
                  : status === 'LATE'
                    ? 'bg-yellow-400 text-emerald-900'
                    : status === 'IN REVIEW'
                      ? 'bg-orange-500 text-white'
                      : 'bg-red-500 text-white';

              const hasLocation = r.attendance.latitude !== null && r.attendance.longitude !== null;
              const lat = r.attendance.latitude ? (r.attendance.latitude / 1e6).toFixed(6) : null;
              const lng = r.attendance.longitude ? (r.attendance.longitude / 1e6).toFixed(6) : null;

              return (
                <div
                  key={r.attendance.id}
                  className="grid grid-cols-[2fr_1fr_1fr_1.5fr] items-center border-b border-emerald-50 px-8 py-4 text-base last:border-b-0"
                >
                  <div className="truncate text-emerald-900">
                    {r.student.name}
                    {r.attendance.status === 'in_review' && (
                      <div className="mt-1 text-xs text-orange-600">
                        📍 {hasLocation ? `${lat}, ${lng}` : 'No location'}
                        {r.attendance.accuracy && ` (±${Math.round(r.attendance.accuracy)}m)`}
                      </div>
                    )}
                  </div>
                  <div className="text-center text-emerald-800">
                    {r.attendance.scannedAt
                      ? new Date(r.attendance.scannedAt).toLocaleTimeString(
                        undefined,
                        { hour: '2-digit', minute: '2-digit' }
                      )
                      : '--'}
                  </div>
                  <div className="flex justify-center">
                    <span className={`rounded-full px-6 py-2 text-sm font-bold ${colorClasses}`}>
                      {status}
                    </span>
                  </div>
                  <div className="flex justify-center gap-2">
                    {r.attendance.status === 'in_review' ? (
                      <>
                        <button
                          onClick={() => onVerify(r.attendance.id, 'in')}
                          className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                          title="Mark as Present"
                        >
                          ✓ Present
                        </button>
                        <button
                          onClick={() => onVerify(r.attendance.id, 'late')}
                          className="rounded-full bg-yellow-400 px-4 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-yellow-500"
                          title="Mark as Late"
                        >
                          ⏰ Late
                        </button>
                        <button
                          onClick={() => onVerify(r.attendance.id, 'out')}
                          className="rounded-full bg-red-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
                          title="Mark as Absent"
                        >
                          ✗ Absent
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-emerald-600">Verified</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

type ReportsTabProps = {
  summary: { present: number; late: number; absent: number; inReview: number; total: number };
  selectedDate: string;
};

function ReportsTab({ summary, selectedDate }: ReportsTabProps) {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-extrabold text-emerald-900">Reports</h2>
      <p className="text-base text-emerald-700">
        Quick overview of attendance for{' '}
        <span className="font-semibold">
          {new Date(selectedDate).toLocaleDateString()}
        </span>
        .
      </p>

      <div className="grid gap-6 sm:grid-cols-3">
        <ReportCard label="Present" value={summary.present} tone="present" />
        <ReportCard label="Late" value={summary.late} tone="late" />
        <ReportCard label="Absent" value={summary.absent} tone="absent" />
      </div>

      <div className="rounded-3xl bg-white p-8 text-base text-emerald-800 shadow">
        <h3 className="mb-4 text-base font-semibold text-emerald-900">
          Insights
        </h3>
        {summary.total === 0 ? (
          <p>No attendance data for this date yet.</p>
        ) : (
          <ul className="list-disc space-y-2 pl-6">
            <li>
              Present rate:{' '}
              <strong>
                {Math.round((summary.present / summary.total) * 100)}%
              </strong>
            </li>
            <li>
              Late rate:{' '}
              <strong>{Math.round((summary.late / summary.total) * 100)}%</strong>
            </li>
            <li>
              Absent rate:{' '}
              <strong>
                {Math.round((summary.absent / summary.total) * 100)}%
              </strong>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}

type ReportCardProps = {
  label: string;
  value: number;
  tone: 'present' | 'late' | 'absent';
};

function ReportCard({ label, value, tone }: ReportCardProps) {
  const tones: Record<ReportCardProps['tone'], string> = {
    present: 'bg-emerald-600',
    late: 'bg-yellow-400',
    absent: 'bg-red-500',
  };

  return (
    <div className={`rounded-3xl ${tones[tone]} p-7 text-white shadow-lg`}>
      <p className="text-sm font-semibold uppercase tracking-[0.18em]">
        {label}
      </p>
      <p className="mt-3 text-4xl font-extrabold">{value}</p>
    </div>
  );
}

type QrTabProps = {
  periods: Period[];
  selectedDate: string;
  setSelectedDate: (v: string) => void;
  selectedPeriod: string;
  setSelectedPeriod: (v: string) => void;
  generateQR: () => void;
  qrLoading: boolean;
  qrCode: string | null;
  qrImage: string | null;
  error: string | null;
  attendance: AttendanceRecord[];
};

function QrTab({
  periods,
  selectedDate,
  setSelectedDate,
  selectedPeriod,
  setSelectedPeriod,
  generateQR,
  qrLoading,
  qrCode,
  qrImage,
  error,
  attendance,
}: QrTabProps) {
  const logs = attendance.slice(0, 6);

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-extrabold text-emerald-900">
        QR Code Generator (Strand + Section with Subject)
      </h2>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* Left: QR area */}
        <div className="rounded-3xl bg-white p-8 shadow-lg">
          <div className="mb-6 flex items-center justify-between text-sm text-emerald-800">
            <div>
              <p className="font-semibold">
                {selectedPeriod
                  ? periods.find((p) => p.id === selectedPeriod)?.name ??
                  'Select a class'
                  : 'Select a class'}
              </p>
              <p className="text-base text-emerald-600">
                {new Date(selectedDate).toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-4 text-sm">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-base text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="">Select Strand + Section with Subject</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-base text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div className="mt-6 flex flex-col items-center gap-5">
            <div className="flex h-80 w-80 items-center justify-center rounded-3xl border-4 border-emerald-700 bg-emerald-50 relative overflow-hidden">
              {qrImage ? (
                <div className="relative h-64 w-64">
                  <img
                    src={qrImage}
                    alt="QR Code"
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <p className="text-sm font-semibold text-emerald-700 text-center px-4">
                  Select a class and click <br /> "Generate New QR Code"
                </p>
              )}
            </div>

            {error && (
              <p className="rounded-md bg-red-100 px-5 py-3 text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            <div className="flex w-full flex-col gap-4 sm:flex-row">
              <button
                type="button"
                onClick={generateQR}
                disabled={qrLoading || !selectedPeriod}
                className="flex-1 rounded-full bg-emerald-600 px-6 py-4 text-sm font-extrabold tracking-wide text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {qrLoading ? 'Generating…' : 'Generate New QR Code'}
              </button>

              <button
                type="button"
                onClick={() => {
                  // Stop session logic: simply clear the QR code
                  if (typeof window !== 'undefined') {
                    // We can't really "stop" the server-side TTL, but we can hide it from view
                    window.location.reload(); // Simple way to reset states
                  }
                }}
                className="flex-1 rounded-full bg-red-600 px-6 py-4 text-sm font-extrabold tracking-wide text-white shadow-sm hover:bg-red-700 transition-colors"
              >
                Stop Session
              </button>
            </div>

            {qrCode && (
              <p className="text-sm text-emerald-700">
                Code: <span className="font-mono">{qrCode}</span>
              </p>
            )}
          </div>
        </div>

        {/* Right: scan logs */}
        <div className="rounded-3xl bg-white p-8 shadow-lg">
          <h3 className="mb-6 text-base font-extrabold uppercase tracking-[0.18em] text-emerald-900">
            Scan Logs
          </h3>
          {logs.length === 0 ? (
            <p className="text-sm text-emerald-700">No scans yet.</p>
          ) : (
            <div className="space-y-3 text-sm text-emerald-800">
              {logs.map((r) => (
                <div
                  key={r.attendance.id}
                  className="flex items-center justify-between rounded-full bg-emerald-50 px-5 py-3"
                >
                  <span>
                    {new Date(r.attendance.scannedAt).toLocaleTimeString(
                      undefined,
                      { hour: '2-digit', minute: '2-digit' }
                    )}
                  </span>
                  <span className="truncate font-semibold">{r.student.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type ClassesTabProps = {
  periods: Period[];
  onRefresh: () => Promise<void>;
  token: string;
};

function ClassesTab({ periods, onRefresh, token }: ClassesTabProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const strands = ['STEM', 'ABM', 'HUMSS', 'ICT', 'HE', 'TOPS'];

  async function handleAddClass(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const strand = formData.get('strand') as string;
    const section = formData.get('section') as string;
    const subject = formData.get('subject') as string;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;
    const lateThreshold = formData.get('lateThreshold') as string;

    try {
      const res = await fetch('/api/periods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: `${strand} ${section} - ${subject}`,
          strand,
          section,
          subject,
          startTime,
          endTime,
          lateThreshold: lateThreshold || 15,
        }),
      });

      if (res.ok) {
        await onRefresh();
        (e.target as HTMLFormElement).reset();
      } else {
        const data = await res.json();
        setError(data.error ?? 'Failed to add class');
      }
    } catch (err) {
      setError('Failed to add class');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateClass(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingPeriod) return;

    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const strand = formData.get('strand') as string;
    const section = formData.get('section') as string;
    const subject = formData.get('subject') as string;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;
    const lateThreshold = formData.get('lateThreshold') as string;

    try {
      const res = await fetch(`/api/periods/${editingPeriod.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: `${strand} ${section} - ${subject}`,
          strand,
          section,
          subject,
          startTime,
          endTime,
          lateThreshold: lateThreshold || 15,
        }),
      });

      if (res.ok) {
        await onRefresh();
        setEditingPeriod(null);
        (e.target as HTMLFormElement).reset();
      } else {
        const data = await res.json();
        setError(data.error ?? 'Failed to update class');
      }
    } catch (err) {
      setError('Failed to update class');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteClass(id: string) {
    if (!confirm('Are you sure you want to delete this class?')) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/periods/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        await onRefresh();
      } else {
        const data = await res.json();
        setError(data.error ?? 'Failed to delete class');
      }
    } catch (err) {
      setError('Failed to delete class');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-extrabold text-emerald-900">Class Management</h2>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
        <div className="rounded-3xl bg-white p-8 shadow-lg">
          <h3 className="mb-6 text-xl font-bold text-emerald-900 font-quicksand">
            {editingPeriod ? 'Edit Class Mapping' : 'Add New Class Mapping'}
          </h3>
          <form onSubmit={editingPeriod ? handleUpdateClass : handleAddClass} className="space-y-4">
            {editingPeriod && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setEditingPeriod(null)}
                  className="text-xs font-semibold text-red-600 hover:underline"
                >
                  Cancel Edit
                </button>
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-semibold text-emerald-700">Strand</label>
              <select
                name="strand"
                required
                defaultValue={editingPeriod?.strand}
                key={editingPeriod ? `edit-strand-${editingPeriod.id}` : 'add-strand'}
                className="w-full rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-400"
              >
                {strands.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-emerald-700">Section</label>
                <input
                  name="section"
                  type="text"
                  placeholder="e.g. 201"
                  required
                  defaultValue={editingPeriod?.section}
                  key={editingPeriod ? `edit-section-${editingPeriod.id}` : 'add-section'}
                  className="w-full rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-emerald-700">Subject</label>
                <input
                  name="subject"
                  type="text"
                  placeholder="e.g. Programming"
                  required
                  defaultValue={editingPeriod?.subject}
                  key={editingPeriod ? `edit-subject-${editingPeriod.id}` : 'add-subject'}
                  className="w-full rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-emerald-700">Start Time</label>
                <input
                  name="startTime"
                  type="time"
                  required
                  defaultValue={editingPeriod?.startTime}
                  key={editingPeriod ? `edit-start-${editingPeriod.id}` : 'add-start'}
                  className="w-full rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-emerald-700">End Time</label>
                <input
                  name="endTime"
                  type="time"
                  required
                  defaultValue={editingPeriod?.endTime}
                  key={editingPeriod ? `edit-end-${editingPeriod.id}` : 'add-end'}
                  className="w-full rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-emerald-700">Late Threshold (minutes)</label>
              <input
                name="lateThreshold"
                type="number"
                defaultValue={editingPeriod ? editingPeriod.lateThreshold : "15"}
                min="0"
                key={editingPeriod ? `edit-late-${editingPeriod.id}` : 'add-late'}
                className="w-full rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            {error && <p className="text-sm font-medium text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-emerald-600 py-4 text-sm font-extrabold text-white transition-colors hover:bg-emerald-700 disabled:bg-emerald-300"
            >
              {loading ? (editingPeriod ? 'Updating...' : 'Adding...') : (editingPeriod ? 'Update Class Mapping' : 'Add Class Mapping')}
            </button>
          </form>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-lg">
          <h3 className="mb-6 text-xl font-bold text-emerald-900 font-quicksand">My Classes</h3>
          {periods.length === 0 ? (
            <p className="text-emerald-700">No classes configured yet.</p>
          ) : (
            <div className="space-y-4">
              {periods.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-2xl bg-emerald-50 p-5 shadow-sm">
                  <div>
                    <p className="text-lg font-bold text-emerald-900 font-quicksand">{p.strand} {p.section} - {p.subject}</p>
                    <p className="text-sm text-emerald-600">{p.startTime} – {p.endTime}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingPeriod(p)}
                        className="rounded-full bg-emerald-100 p-2 text-emerald-600 transition-colors hover:bg-emerald-200"
                        title="Edit Class"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button
                        onClick={() => handleDeleteClass(p.id)}
                        className="rounded-full bg-red-100 p-2 text-red-600 transition-colors hover:bg-red-200"
                        title="Delete Class"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      </button>
                    </div>
                    <span className="rounded-full bg-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
                      {p.strand}
                    </span>
                    <span className="text-xs font-medium text-emerald-600">Late after {p.lateThreshold}m</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

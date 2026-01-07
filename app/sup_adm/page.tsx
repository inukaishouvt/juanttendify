'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { LayoutDashboard, Users, ClipboardList, Clock, Smartphone, LogOut } from 'lucide-react';
import { formatTime12h } from '@/lib/utils';

type User = {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher';
  studentLrn: string | null;
  createdAt: number;
};

type Period = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  lateThreshold: number;
  createdAt: number;
};

type AttendanceRecord = {
  id: string;
  studentId: string;
  periodId: string;
  status: 'in' | 'late' | 'out' | 'in_review';
  date: string;
  scannedAt: number;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  locationStatus: 'verified' | 'in_review' | null;
  student: User;
  period: Period;
};

type QRCode = {
  id: string;
  code: string;
  periodId: string | null;
  date: string;
  expiresAt: number;
  createdAt: number;
  createdBy: string | null;
};

type TabKey = 'dashboard' | 'users' | 'attendance' | 'periods' | 'qrcodes';

export default function SuperAdminPage() {
  const [tab, setTab] = useState<TabKey>('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [users, setUsers] = useState<User[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Form states
  const [showUserForm, setShowUserForm] = useState(false);
  const [showPeriodForm, setShowPeriodForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Refresh statistics and attendance silently
      void fetchAttendance();
      void fetchStats();
      void fetchQRCodes();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUsers(),
        fetchPeriods(),
        fetchAttendance(),
        fetchQRCodes(),
        fetchStats(),
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/sup_adm/users');
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchPeriods = async () => {
    try {
      const res = await fetch('/api/sup_adm/periods');
      const data = await res.json();
      if (res.ok) {
        setPeriods(data.periods || []);
      }
    } catch (err) {
      console.error('Error fetching periods:', err);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await fetch('/api/sup_adm/attendance');
      const data = await res.json();
      if (res.ok) {
        setAttendance(data.attendance || []);
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
    }
  };

  const fetchQRCodes = async () => {
    try {
      const res = await fetch('/api/sup_adm/qrcodes');
      const data = await res.json();
      if (res.ok) {
        setQrCodes(data.qrCodes || []);
      }
    } catch (err) {
      console.error('Error fetching QR codes:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/sup_adm/stats');
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const data: any = {
      email: formData.get('email') as string,
      name: formData.get('name') as string,
      role: formData.get('role') as 'student' | 'teacher',
      studentLrn: formData.get('studentLrn') as string || null,
    };

    // Only include password if it's provided (for updates, password is optional)
    if (password) {
      data.password = password;
    }

    try {
      const isEditing = !!editingUser;
      const url = isEditing ? `/api/sup_adm/users/${editingUser.id}` : '/api/sup_adm/users';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        await fetchUsers();
        setShowUserForm(false);
        setEditingUser(null);
        setError(null);
      } else {
        setError(result.error || `Failed to ${isEditing ? 'update' : 'create'} user`);
      }
    } catch (err) {
      setError(`Failed to ${editingUser ? 'update' : 'create'} user`);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`/api/sup_adm/users/${userId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchUsers();
        setError(null);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete user');
      }
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  const handleCreatePeriod = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      startTime: formData.get('startTime') as string,
      endTime: formData.get('endTime') as string,
      lateThreshold: parseInt(formData.get('lateThreshold') as string) || 15,
    };

    try {
      const isEditing = !!editingPeriod;
      const url = isEditing ? `/api/sup_adm/periods/${editingPeriod.id}` : '/api/sup_adm/periods';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        await fetchPeriods();
        setShowPeriodForm(false);
        setEditingPeriod(null);
        setError(null);
      } else {
        setError(result.error || `Failed to ${isEditing ? 'update' : 'create'} period`);
      }
    } catch (err) {
      setError(`Failed to ${editingPeriod ? 'update' : 'create'} period`);
    }
  };

  const handleEditPeriod = (period: Period) => {
    setEditingPeriod(period);
    setShowPeriodForm(true);
  };

  const handleDeletePeriod = async (periodId: string) => {
    if (!confirm('Are you sure you want to delete this period?')) return;
    try {
      const res = await fetch(`/api/sup_adm/periods/${periodId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchPeriods();
        setError(null);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete period');
      }
    } catch (err) {
      setError('Failed to delete period');
    }
  };

  const handleVerifyAttendance = async (attendanceId: string, status: 'in' | 'late' | 'out') => {
    try {
      const res = await fetch('/api/attendance/verify', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendanceId, status }),
      });
      if (res.ok) {
        await fetchAttendance();
        setError(null);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to verify attendance');
      }
    } catch (err) {
      setError('Failed to verify attendance');
    }
  };

  const logout = () => {
    window.location.href = '/';
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-t from-emerald-700/80 via-emerald-500/40 to-white/85 flex items-center justify-center">
        <div className="text-white text-xl font-bold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-t from-emerald-700/80 via-emerald-500/40 to-white/85">
      {/* Background image */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="/Background.jpg"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-700/80 via-emerald-500/40 to-white/85" />
      </div>

      <div className="mx-auto flex min-h-screen w-full">
        {/* Sidebar */}
        <aside className="flex w-72 flex-col bg-emerald-800/95 px-6 py-8 text-emerald-50">
          <div className="mb-10 flex items-center gap-4">
            <Image
              src="/Logo.png"
              alt="Juanttendify Logo"
              width={56}
              height={56}
              className="object-contain"
              unoptimized
            />
            <div>
              <span className="text-base font-semibold font-quicksand">Juanttendify</span>
              <p className="text-xs text-emerald-200">Super Admin</p>
            </div>
          </div>

          <nav className="space-y-3 text-base font-semibold">
            <SidebarLink
              label="Dashboard"
              icon={<LayoutDashboard className="w-5 h-5" />}
              active={tab === 'dashboard'}
              onClick={() => setTab('dashboard')}
            />
            <SidebarLink
              label="Users"
              icon={<Users className="w-5 h-5" />}
              active={tab === 'users'}
              onClick={() => setTab('users')}
            />
            <SidebarLink
              label="Attendance"
              icon={<ClipboardList className="w-5 h-5" />}
              active={tab === 'attendance'}
              onClick={() => setTab('attendance')}
            />
            <SidebarLink
              label="Periods"
              icon={<Clock className="w-5 h-5" />}
              active={tab === 'periods'}
              onClick={() => setTab('periods')}
            />
            <SidebarLink
              label="QR Codes"
              icon={<Smartphone className="w-5 h-5" />}
              active={tab === 'qrcodes'}
              onClick={() => setTab('qrcodes')}
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
                Super Admin Dashboard
              </p>
            </div>
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-600 bg-white">
              <span className="text-2xl text-emerald-700">🔐</span>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto px-10 py-8">
            {error && (
              <div className="mb-4 rounded-xl bg-red-100 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {tab === 'dashboard' && <DashboardTab stats={stats} />}
            {tab === 'users' && (
              <UsersTab
                users={users}
                onRefresh={fetchUsers}
                onCreate={() => setShowUserForm(true)}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
              />
            )}
            {tab === 'attendance' && (
              <AttendanceTab
                attendance={attendance}
                onRefresh={fetchAttendance}
                onVerify={handleVerifyAttendance}
              />
            )}
            {tab === 'periods' && (
              <PeriodsTab
                periods={periods}
                onRefresh={fetchPeriods}
                onCreate={() => setShowPeriodForm(true)}
                onEdit={handleEditPeriod}
                onDelete={handleDeletePeriod}
              />
            )}
            {tab === 'qrcodes' && <QRCodesTab qrCodes={qrCodes} periods={periods} />}
          </main>
        </div>
      </div>

      {/* Modals */}
      {showUserForm && (
        <UserFormModal
          onClose={() => {
            setShowUserForm(false);
            setEditingUser(null);
          }}
          onSubmit={handleCreateUser}
          user={editingUser}
        />
      )}
      {showPeriodForm && (
        <PeriodFormModal
          onClose={() => {
            setShowPeriodForm(false);
            setEditingPeriod(null);
          }}
          onSubmit={handleCreatePeriod}
          period={editingPeriod}
        />
      )}
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

function DashboardTab({ stats }: { stats: any }) {
  if (!stats) {
    return <div className="text-center py-12 text-emerald-700">Loading statistics...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-extrabold text-emerald-900">System Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Users" value={stats.totalUsers} color="emerald" />
        <StatCard label="Students" value={stats.totalStudents} color="blue" />
        <StatCard label="Teachers" value={stats.totalTeachers} color="green" />
        <StatCard label="Periods" value={stats.totalPeriods} color="orange" />
        <StatCard label="Attendance Records" value={stats.totalAttendance} color="indigo" />
        <StatCard label="QR Codes" value={stats.totalQRCodes} color="pink" />
        <StatCard label="In Review" value={stats.inReview} color="yellow" />
        <StatCard label="Verified" value={stats.verified} color="teal" />
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-600',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    indigo: 'bg-indigo-500',
    pink: 'bg-pink-500',
    yellow: 'bg-yellow-500',
    teal: 'bg-teal-500',
  };

  return (
    <div className={` ${colors[color]} rounded-3xl p-5 text-white shadow-lg`}>
      <p className="text-sm font-semibold uppercase tracking-[0.18em]">{label}</p>
      <p className="text-4xl font-extrabold mt-3">{value || 0}</p>
    </div>
  );
}

function UsersTab({
  users,
  onRefresh,
  onCreate,
  onEdit,
  onDelete,
}: {
  users: User[];
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-extrabold text-emerald-900">Users Management</h2>
        <button
          onClick={onCreate}
          className="px-6 py-3 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-700 shadow-sm"
        >
          + Create User
        </button>
      </div>
      <div className="overflow-hidden rounded-3xl bg-white shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-emerald-50 border-b border-emerald-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-extrabold uppercase tracking-[0.18em] text-emerald-800">Name</th>
                <th className="px-6 py-4 text-left text-sm font-extrabold uppercase tracking-[0.18em] text-emerald-800">Email</th>
                <th className="px-6 py-4 text-left text-sm font-extrabold uppercase tracking-[0.18em] text-emerald-800">Role</th>
                <th className="px-6 py-4 text-left text-sm font-extrabold uppercase tracking-[0.18em] text-emerald-800">Student LRN</th>
                <th className="px-6 py-4 text-left text-sm font-extrabold uppercase tracking-[0.18em] text-emerald-800">Created</th>
                <th className="px-6 py-4 text-left text-sm font-extrabold uppercase tracking-[0.18em] text-emerald-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-emerald-50 last:border-b-0">
                  <td className="px-6 py-4 text-base text-emerald-900 font-medium">{user.name}</td>
                  <td className="px-6 py-4 text-base text-emerald-800">{user.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-4 py-2 rounded-full text-xs font-bold ${user.role === 'teacher'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                        }`}
                    >
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-base text-emerald-800">{user.studentLrn || '-'}</td>
                  <td className="px-6 py-4 text-base text-emerald-800">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit(user)}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-full text-sm font-semibold hover:bg-emerald-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(user.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-semibold hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AttendanceTab({
  attendance,
  onRefresh,
  onVerify,
}: {
  attendance: AttendanceRecord[];
  onRefresh: () => void;
  onVerify: (id: string, status: 'in' | 'late' | 'out') => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-extrabold text-emerald-900">Attendance Records</h2>
        <button
          onClick={onRefresh}
          className="px-6 py-3 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-700 shadow-sm"
        >
          Refresh
        </button>
      </div>
      <div className="overflow-hidden rounded-3xl bg-white shadow-lg">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-emerald-50 border-b border-emerald-100 sticky top-0">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-extrabold uppercase tracking-[0.18em] text-emerald-800">Student</th>
                <th className="px-6 py-4 text-left text-sm font-extrabold uppercase tracking-[0.18em] text-emerald-800">Period</th>
                <th className="px-6 py-4 text-left text-sm font-extrabold uppercase tracking-[0.18em] text-emerald-800">Date</th>
                <th className="px-6 py-4 text-left text-sm font-extrabold uppercase tracking-[0.18em] text-emerald-800">Time</th>
                <th className="px-6 py-4 text-left text-sm font-extrabold uppercase tracking-[0.18em] text-emerald-800">Status</th>
                <th className="px-6 py-4 text-left text-sm font-extrabold uppercase tracking-[0.18em] text-emerald-800">Location</th>
                <th className="px-6 py-4 text-left text-sm font-extrabold uppercase tracking-[0.18em] text-emerald-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((record) => {
                const lat = record.latitude ? (record.latitude / 1e6).toFixed(6) : null;
                const lng = record.longitude ? (record.longitude / 1e6).toFixed(6) : null;
                return (
                  <tr key={record.id} className="border-b border-emerald-50 last:border-b-0">
                    <td className="px-6 py-4 text-base text-emerald-900 font-medium">{record.student.name}</td>
                    <td className="px-6 py-4 text-base text-emerald-800">{record.period.name}</td>
                    <td className="px-6 py-4 text-base text-emerald-800">{record.date}</td>
                    <td className="px-6 py-4 text-base text-emerald-800">
                      {formatTime12h(record.scannedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-4 py-2 rounded-full text-xs font-bold ${record.status === 'in'
                          ? 'bg-emerald-600 text-white'
                          : record.status === 'late'
                            ? 'bg-yellow-400 text-emerald-900'
                            : record.status === 'in_review'
                              ? 'bg-orange-500 text-white'
                              : 'bg-red-500 text-white'
                          }`}
                      >
                        {record.status === 'in' ? 'PRESENT' : record.status === 'late' ? 'LATE' : record.status === 'in_review' ? 'IN REVIEW' : 'ABSENT'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-emerald-700">
                      {lat && lng ? `${lat}, ${lng}` : 'No location'}
                    </td>
                    <td className="px-6 py-4">
                      {record.status === 'in_review' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => onVerify(record.id, 'in')}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-full text-xs font-semibold hover:bg-emerald-700"
                            title="Mark as Present"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => onVerify(record.id, 'late')}
                            className="px-3 py-1.5 bg-yellow-400 text-emerald-900 rounded-full text-xs font-semibold hover:bg-yellow-500"
                            title="Mark as Late"
                          >
                            ⏰
                          </button>
                          <button
                            onClick={() => onVerify(record.id, 'out')}
                            className="px-3 py-1.5 bg-red-500 text-white rounded-full text-xs font-semibold hover:bg-red-600"
                            title="Mark as Absent"
                          >
                            ✗
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PeriodsTab({
  periods,
  onRefresh,
  onCreate,
  onEdit,
  onDelete,
}: {
  periods: Period[];
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (period: Period) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-extrabold text-emerald-900">Periods Management</h2>
        <button
          onClick={onCreate}
          className="px-6 py-3 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-700 shadow-sm"
        >
          + Create Period
        </button>
      </div>
      <div className="overflow-hidden rounded-3xl bg-white shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-emerald-50 border-b border-emerald-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-extrabold uppercase tracking-[0.18em] text-emerald-800">Name</th>
                <th className="px-6 py-4 text-left text-sm font-extrabold uppercase tracking-[0.18em] text-emerald-800">Start Time</th>
                <th className="px-6 py-4 text-left text-sm font-extrabold uppercase tracking-[0.18em] text-emerald-800">End Time</th>
                <th className="px-6 py-4 text-left text-sm font-extrabold uppercase tracking-[0.18em] text-emerald-800">Late Threshold</th>
                <th className="px-6 py-4 text-left text-sm font-extrabold uppercase tracking-[0.18em] text-emerald-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((period) => (
                <tr key={period.id} className="border-b border-emerald-50 last:border-b-0">
                  <td className="px-6 py-4 text-base text-emerald-900 font-semibold">{period.name}</td>
                  <td className="px-6 py-4 text-base text-emerald-800">{formatTime12h(period.startTime)}</td>
                  <td className="px-6 py-4 text-base text-emerald-800">{formatTime12h(period.endTime)}</td>
                  <td className="px-6 py-4 text-base text-emerald-800">{period.lateThreshold} min</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit(period)}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-full text-sm font-semibold hover:bg-emerald-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(period.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-semibold hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function QRCodesTab({ qrCodes, periods }: { qrCodes: QRCode[]; periods: Period[] }) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-extrabold text-emerald-900">QR Codes</h2>
      <div className="overflow-hidden rounded-3xl bg-white shadow-lg">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-emerald-50 border-b border-emerald-100 sticky top-0">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-extrabold uppercase tracking-[0.18em] text-emerald-800">Code</th>
                <th className="px-6 py-4 text-left text-sm font-extrabold uppercase tracking-[0.18em] text-emerald-800">Period</th>
                <th className="px-6 py-4 text-left text-sm font-extrabold uppercase tracking-[0.18em] text-emerald-800">Date</th>
                <th className="px-6 py-4 text-left text-sm font-extrabold uppercase tracking-[0.18em] text-emerald-800">Expires At</th>
                <th className="px-6 py-4 text-left text-sm font-extrabold uppercase tracking-[0.18em] text-emerald-800">Created</th>
              </tr>
            </thead>
            <tbody>
              {qrCodes.map((qr) => {
                const period = periods.find((p) => p.id === qr.periodId);
                return (
                  <tr key={qr.id} className="border-b border-emerald-50 last:border-b-0">
                    <td className="px-6 py-4 font-mono text-xs text-emerald-700">{qr.code.substring(0, 20)}...</td>
                    <td className="px-6 py-4 text-base text-emerald-800">{period?.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-base text-emerald-800">{qr.date}</td>
                    <td className="px-6 py-4 text-base text-emerald-800">
                      {new Date(qr.expiresAt).toLocaleString([], { hour12: true, month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-base text-emerald-800">
                      {new Date(qr.createdAt).toLocaleString([], { hour12: true, month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function UserFormModal({
  onClose,
  onSubmit,
  user,
}: {
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  user: User | null;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-emerald-700/95 rounded-[32px] p-8 max-w-md w-full mx-4 text-white shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-extrabold tracking-wide">
            {user ? 'Edit User' : 'Create User'}
          </h3>
          <button
            onClick={onClose}
            className="text-2xl text-emerald-50 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-base font-semibold text-emerald-50 mb-2">Name</label>
            <input
              type="text"
              name="name"
              defaultValue={user?.name}
              required
              className="w-full rounded-full border-none bg-white px-6 py-4 text-base font-medium text-emerald-900 shadow-sm outline-none ring-0 focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="block text-base font-semibold text-emerald-50 mb-2">Email</label>
            <input
              type="email"
              name="email"
              defaultValue={user?.email}
              required
              className="w-full rounded-full border-none bg-white px-6 py-4 text-base font-medium text-emerald-900 shadow-sm outline-none ring-0 focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="block text-base font-semibold text-emerald-50 mb-2">Password</label>
            <input
              type="password"
              name="password"
              required={!user}
              className="w-full rounded-full border-none bg-white px-6 py-4 text-base font-medium text-emerald-900 shadow-sm outline-none ring-0 focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="block text-base font-semibold text-emerald-50 mb-2">Role</label>
            <select
              name="role"
              defaultValue={user?.role}
              required
              className="w-full rounded-full border-none bg-white px-6 py-4 text-base font-medium text-emerald-900 shadow-sm outline-none ring-0 focus:ring-2 focus:ring-emerald-400"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
          <div>
            <label className="block text-base font-semibold text-emerald-50 mb-2">
              Student LRN (if student)
            </label>
            <input
              type="text"
              name="studentLrn"
              defaultValue={user?.studentLrn || ''}
              className="w-full rounded-full border-none bg-white px-6 py-4 text-base font-medium text-emerald-900 shadow-sm outline-none ring-0 focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 px-6 py-4 bg-white text-emerald-800 rounded-full font-extrabold tracking-wide shadow-sm hover:bg-emerald-100"
            >
              {user ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-emerald-600 text-white rounded-full font-extrabold tracking-wide shadow-sm hover:bg-emerald-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PeriodFormModal({
  onClose,
  onSubmit,
  period,
}: {
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  period: Period | null;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-emerald-700/95 rounded-[32px] p-8 max-w-md w-full mx-4 text-white shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-extrabold tracking-wide">
            {period ? 'Edit Period' : 'Create Period'}
          </h3>
          <button
            onClick={onClose}
            className="text-2xl text-emerald-50 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-base font-semibold text-emerald-50 mb-2">Name</label>
            <input
              type="text"
              name="name"
              defaultValue={period?.name}
              required
              className="w-full rounded-full border-none bg-white px-6 py-4 text-base font-medium text-emerald-900 shadow-sm outline-none ring-0 focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="block text-base font-semibold text-emerald-50 mb-2">Start Time</label>
            <input
              type="time"
              name="startTime"
              defaultValue={period?.startTime}
              required
              className="w-full rounded-full border-none bg-white px-6 py-4 text-base font-medium text-emerald-900 shadow-sm outline-none ring-0 focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="block text-base font-semibold text-emerald-50 mb-2">End Time</label>
            <input
              type="time"
              name="endTime"
              defaultValue={period?.endTime}
              required
              className="w-full rounded-full border-none bg-white px-6 py-4 text-base font-medium text-emerald-900 shadow-sm outline-none ring-0 focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="block text-base font-semibold text-emerald-50 mb-2">
              Late Threshold (minutes)
            </label>
            <input
              type="number"
              name="lateThreshold"
              defaultValue={period?.lateThreshold || 15}
              required
              className="w-full rounded-full border-none bg-white px-6 py-4 text-base font-medium text-emerald-900 shadow-sm outline-none ring-0 focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 px-6 py-4 bg-white text-emerald-800 rounded-full font-extrabold tracking-wide shadow-sm hover:bg-emerald-100"
            >
              {period ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-emerald-600 text-white rounded-full font-extrabold tracking-wide shadow-sm hover:bg-emerald-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

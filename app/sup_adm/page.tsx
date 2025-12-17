'use client';

import { useEffect, useState } from 'react';

type User = {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher';
  studentId: string | null;
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
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      name: formData.get('name') as string,
      role: formData.get('role') as 'student' | 'teacher',
      studentId: formData.get('studentId') as string || null,
    };

    try {
      const res = await fetch('/api/sup_adm/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        await fetchUsers();
        setShowUserForm(false);
        setError(null);
      } else {
        setError(result.error || 'Failed to create user');
      }
    } catch (err) {
      setError('Failed to create user');
    }
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
      const res = await fetch('/api/sup_adm/periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        await fetchPeriods();
        setShowPeriodForm(false);
        setError(null);
      } else {
        setError(result.error || 'Failed to create period');
      }
    } catch (err) {
      setError('Failed to create period');
    }
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

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-t from-purple-700/80 via-purple-500/40 to-white/85 flex items-center justify-center">
        <div className="text-white text-xl font-bold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-t from-purple-700/80 via-purple-500/40 to-white/85">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 bg-white/95 rounded-3xl shadow-2xl p-6">
          <h1 className="text-4xl font-extrabold text-purple-900 mb-2">
            🔐 Super Admin Dashboard
          </h1>
          <p className="text-purple-700">Full system access and management</p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-100 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2 bg-white/95 rounded-2xl p-4 shadow-lg">
          {(['dashboard', 'users', 'attendance', 'periods', 'qrcodes'] as TabKey[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-2 rounded-full font-semibold transition-colors ${
                tab === t
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white/95 rounded-3xl shadow-2xl p-6">
          {tab === 'dashboard' && <DashboardTab stats={stats} />}
          {tab === 'users' && (
            <UsersTab
              users={users}
              onRefresh={fetchUsers}
              onCreate={() => setShowUserForm(true)}
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
              onDelete={handleDeletePeriod}
            />
          )}
          {tab === 'qrcodes' && <QRCodesTab qrCodes={qrCodes} periods={periods} />}
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
    </div>
  );
}

function DashboardTab({ stats }: { stats: any }) {
  if (!stats) {
    return <div className="text-center py-12 text-purple-700">Loading statistics...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-purple-900 mb-4">System Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats.totalUsers} color="purple" />
        <StatCard label="Students" value={stats.totalStudents} color="blue" />
        <StatCard label="Teachers" value={stats.totalTeachers} color="green" />
        <StatCard label="Periods" value={stats.totalPeriods} color="orange" />
        <StatCard label="Attendance Records" value={stats.totalAttendance} color="indigo" />
        <StatCard label="QR Codes" value={stats.totalQRCodes} color="pink" />
        <StatCard label="In Review" value={stats.inReview} color="yellow" />
        <StatCard label="Verified" value={stats.verified} color="emerald" />
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    purple: 'bg-purple-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    indigo: 'bg-indigo-500',
    pink: 'bg-pink-500',
    yellow: 'bg-yellow-500',
    emerald: 'bg-emerald-500',
  };

  return (
    <div className={`${colors[color]} rounded-xl p-6 text-white shadow-lg`}>
      <p className="text-sm font-semibold uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-extrabold mt-2">{value || 0}</p>
    </div>
  );
}

function UsersTab({
  users,
  onRefresh,
  onCreate,
  onDelete,
}: {
  users: User[];
  onRefresh: () => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-purple-900">Users Management</h2>
        <button
          onClick={onCreate}
          className="px-4 py-2 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700"
        >
          + Create User
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-purple-100">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-left">Student ID</th>
              <th className="px-4 py-2 text-left">Created</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="px-4 py-2">{user.name}</td>
                <td className="px-4 py-2">{user.email}</td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      user.role === 'teacher'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-2">{user.studentId || '-'}</td>
                <td className="px-4 py-2">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => onDelete(user.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-purple-900">Attendance Records</h2>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700"
        >
          Refresh
        </button>
      </div>
      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full">
          <thead className="bg-purple-100 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left">Student</th>
              <th className="px-4 py-2 text-left">Period</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Location</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((record) => {
              const lat = record.latitude ? (record.latitude / 1e6).toFixed(6) : null;
              const lng = record.longitude ? (record.longitude / 1e6).toFixed(6) : null;
              return (
                <tr key={record.id} className="border-b">
                  <td className="px-4 py-2">{record.student.name}</td>
                  <td className="px-4 py-2">{record.period.name}</td>
                  <td className="px-4 py-2">{record.date}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        record.status === 'in'
                          ? 'bg-green-100 text-green-700'
                          : record.status === 'late'
                          ? 'bg-yellow-100 text-yellow-700'
                          : record.status === 'in_review'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {lat && lng ? `${lat}, ${lng}` : 'No location'}
                  </td>
                  <td className="px-4 py-2">
                    {record.status === 'in_review' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onVerify(record.id, 'in')}
                          className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => onVerify(record.id, 'late')}
                          className="px-2 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600"
                        >
                          ⏰
                        </button>
                        <button
                          onClick={() => onVerify(record.id, 'out')}
                          className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
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
  );
}

function PeriodsTab({
  periods,
  onRefresh,
  onCreate,
  onDelete,
}: {
  periods: Period[];
  onRefresh: () => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-purple-900">Periods Management</h2>
        <button
          onClick={onCreate}
          className="px-4 py-2 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700"
        >
          + Create Period
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-purple-100">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Start Time</th>
              <th className="px-4 py-2 text-left">End Time</th>
              <th className="px-4 py-2 text-left">Late Threshold</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((period) => (
              <tr key={period.id} className="border-b">
                <td className="px-4 py-2 font-semibold">{period.name}</td>
                <td className="px-4 py-2">{period.startTime}</td>
                <td className="px-4 py-2">{period.endTime}</td>
                <td className="px-4 py-2">{period.lateThreshold} min</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => onDelete(period.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function QRCodesTab({ qrCodes, periods }: { qrCodes: QRCode[]; periods: Period[] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-purple-900">QR Codes</h2>
      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full">
          <thead className="bg-purple-100 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left">Code</th>
              <th className="px-4 py-2 text-left">Period</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Expires At</th>
              <th className="px-4 py-2 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {qrCodes.map((qr) => {
              const period = periods.find((p) => p.id === qr.periodId);
              return (
                <tr key={qr.id} className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">{qr.code.substring(0, 20)}...</td>
                  <td className="px-4 py-2">{period?.name || 'N/A'}</td>
                  <td className="px-4 py-2">{qr.date}</td>
                  <td className="px-4 py-2">
                    {new Date(qr.expiresAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    {new Date(qr.createdAt).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-purple-900 mb-4">
          {user ? 'Edit User' : 'Create User'}
        </h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-purple-800 mb-1">Name</label>
            <input
              type="text"
              name="name"
              defaultValue={user?.name}
              required
              className="w-full rounded-lg border border-purple-200 px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-purple-800 mb-1">Email</label>
            <input
              type="email"
              name="email"
              defaultValue={user?.email}
              required
              className="w-full rounded-lg border border-purple-200 px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-purple-800 mb-1">Password</label>
            <input
              type="password"
              name="password"
              required={!user}
              className="w-full rounded-lg border border-purple-200 px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-purple-800 mb-1">Role</label>
            <select
              name="role"
              defaultValue={user?.role}
              required
              className="w-full rounded-lg border border-purple-200 px-4 py-2"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-purple-800 mb-1">
              Student ID (if student)
            </label>
            <input
              type="text"
              name="studentId"
              defaultValue={user?.studentId || ''}
              className="w-full rounded-lg border border-purple-200 px-4 py-2"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
            >
              {user ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300"
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-purple-900 mb-4">
          {period ? 'Edit Period' : 'Create Period'}
        </h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-purple-800 mb-1">Name</label>
            <input
              type="text"
              name="name"
              defaultValue={period?.name}
              required
              className="w-full rounded-lg border border-purple-200 px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-purple-800 mb-1">Start Time</label>
            <input
              type="time"
              name="startTime"
              defaultValue={period?.startTime}
              required
              className="w-full rounded-lg border border-purple-200 px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-purple-800 mb-1">End Time</label>
            <input
              type="time"
              name="endTime"
              defaultValue={period?.endTime}
              required
              className="w-full rounded-lg border border-purple-200 px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-purple-800 mb-1">
              Late Threshold (minutes)
            </label>
            <input
              type="number"
              name="lateThreshold"
              defaultValue={period?.lateThreshold || 15}
              required
              className="w-full rounded-lg border border-purple-200 px-4 py-2"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
            >
              {period ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


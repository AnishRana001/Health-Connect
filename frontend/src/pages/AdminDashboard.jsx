import { useState, useEffect, useCallback } from 'react';
import {
  Users, Stethoscope, Clock, CalendarCheck, ShieldCheck,
  FileText, Trash2, CheckCircle, XCircle, RefreshCw,
} from 'lucide-react';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import './AdminDashboard.css';

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS = ['Overview', 'Doctor Verification', 'Users', 'Appointments'];

// ── Shared UI atoms ───────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => (
  <span className={`status-badge ${status}`}>
    {status === 'approved' && '✓ '}
    {status === 'pending'  && '⏳ '}
    {status === 'rejected' && '✗ '}
    {status}
  </span>
);

const DocLink = ({ doc, label }) => {
  if (!doc?.url) return <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>;
  return (
    <a className="doc-link" href={doc.url} target="_blank" rel="noopener noreferrer">
      <FileText size={12} /> {doc.originalName || label}
    </a>
  );
};

const StatCard = ({ icon, value, label, colorClass }) => (
  <div className={`stat-card card ${colorClass}`}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-info">
      <div className="stat-value">{value ?? '—'}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>
);

const EmptyState = ({ message }) => (
  <div className="empty-state"><p className="text-muted">{message}</p></div>
);

// ── Overview Tab ──────────────────────────────────────────────────────────────

const OverviewTab = ({ stats }) => (
  <>
    <div className="stats-grid">
      <StatCard icon={<Users size={22} color="white" />}         value={stats?.totalUsers}        label="Total Users"         colorClass="stat-blue"   />
      <StatCard icon={<Stethoscope size={22} color="white" />}   value={stats?.totalDoctors}      label="Total Doctors"       colorClass="stat-purple" />
      <StatCard icon={<Clock size={22} color="white" />}         value={stats?.pendingKYC}        label="Pending KYC"         colorClass="stat-amber"  />
      <StatCard icon={<ShieldCheck size={22} color="white" />}   value={stats?.approvedDoctors}   label="Verified Doctors"    colorClass="stat-green"  />
      <StatCard icon={<CalendarCheck size={22} color="white" />} value={stats?.totalAppointments} label="Appointments"        colorClass="stat-rose"   />
    </div>
    <div className="card" style={{ padding: '1.5rem' }}>
      <h3 style={{ marginBottom: '0.75rem' }}>Quick Summary</h3>
      <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: '1.7' }}>
        Welcome to the <strong>HealthConnect Admin Panel</strong>. Doctors must be{' '}
        <strong>approved</strong> before they appear in the public listing and can accept bookings.
        Use the <em>Doctor Verification</em> tab to review uploaded credentials.
      </p>
    </div>
  </>
);

// ── Doctor Verification Tab ───────────────────────────────────────────────────

const DoctorVerificationTab = ({ doctors, onVerify }) => {
  const [rejectState, setRejectState] = useState({}); // { [id]: { open, note } }

  const toggleReject = (id) =>
    setRejectState((prev) => ({ ...prev, [id]: prev[id]?.open ? undefined : { open: true, note: '' } }));

  const setNote = (id, note) =>
    setRejectState((prev) => ({ ...prev, [id]: { ...prev[id], note } }));

  const submitReject = async (id) => {
    const note = rejectState[id]?.note || '';
    await onVerify(id, 'rejected', note);
    setRejectState((prev) => ({ ...prev, [id]: undefined }));
  };

  if (!doctors.length) return <EmptyState message="No doctors found." />;

  return (
    <div className="card admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Doctor</th>
            <th>Specialization</th>
            <th>License No.</th>
            <th>Hospital</th>
            <th>KYC Documents</th>
            <th>Status</th>
            <th style={{ minWidth: '160px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {doctors.map((doc) => (
            <>
              <tr key={doc._id}>
                <td>
                  <p style={{ fontWeight: 600, marginBottom: '0.15rem' }}>{doc.userId?.name || 'N/A'}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>{doc.userId?.email}</p>
                </td>
                <td>{doc.specialization}</td>
                <td style={{ fontSize: '0.82rem' }}>{doc.licenseNumber || '—'}</td>
                <td style={{ fontSize: '0.82rem' }}>{doc.hospitalAffiliation || '—'}</td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <DocLink doc={doc.documents?.licenseDocument} label="Medical License" />
                    <DocLink doc={doc.documents?.medicalDegree}   label="Degree Certificate" />
                    <DocLink doc={doc.documents?.governmentId}    label="Government ID" />
                  </div>
                </td>
                <td>
                  <StatusBadge status={doc.verificationStatus} />
                  {doc.verificationNote && doc.verificationStatus === 'rejected' && (
                    <p style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: '0.25rem', maxWidth: '140px' }}>
                      {doc.verificationNote}
                    </p>
                  )}
                </td>
                <td>
                  <div className="table-actions">
                    {doc.verificationStatus !== 'approved' && (
                      <button className="btn btn-primary btn-sm" onClick={() => onVerify(doc._id, 'approved', '')}>
                        <CheckCircle size={13} /> Approve
                      </button>
                    )}
                    {doc.verificationStatus !== 'rejected' && (
                      <button className="btn btn-danger btn-sm" onClick={() => toggleReject(doc._id)}>
                        <XCircle size={13} /> Reject
                      </button>
                    )}
                    {doc.verificationStatus === 'rejected' && (
                      <button className="btn btn-outline btn-sm" onClick={() => onVerify(doc._id, 'approved', '')}>
                        Re-approve
                      </button>
                    )}
                  </div>
                  {rejectState[doc._id]?.open && (
                    <div className="verify-inline">
                      <textarea
                        placeholder="Rejection reason (optional)…"
                        value={rejectState[doc._id].note}
                        onChange={(e) => setNote(doc._id, e.target.value)}
                      />
                      <div className="verify-inline-actions">
                        <button className="btn btn-danger btn-sm" onClick={() => submitReject(doc._id)}>Confirm</button>
                        <button className="btn btn-outline btn-sm" onClick={() => toggleReject(doc._id)}>Cancel</button>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Users Tab ─────────────────────────────────────────────────────────────────

const UsersTab = ({ users, onDeleteUser }) => {
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id) => {
    if (deletingId !== id) { setDeletingId(id); return; }
    setDeletingId(null);
    await onDeleteUser(id);
  };

  if (!users.length) return <EmptyState message="No users found." />;

  return (
    <div className="card admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td style={{ fontWeight: 500 }}>{u.name}</td>
              <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{u.email}</td>
              <td><StatusBadge status={u.role} /></td>
              <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
              <td>
                {u.role !== 'admin' && (
                  deletingId === u._id ? (
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Confirm?</span>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u._id)}>Yes</button>
                      <button className="btn btn-outline btn-sm" onClick={() => setDeletingId(null)}>No</button>
                    </div>
                  ) : (
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u._id)}>
                      <Trash2 size={13} /> Delete
                    </button>
                  )
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Appointments Tab ──────────────────────────────────────────────────────────

const AppointmentsTab = ({ appointments }) => {
  if (!appointments.length) return <EmptyState message="No appointments found." />;

  return (
    <div className="card admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Patient</th>
            <th>Doctor</th>
            <th>Date & Time</th>
            <th>Reason</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((apt) => (
            <tr key={apt._id}>
              <td style={{ fontWeight: 500 }}>{apt.userId?.name || '—'}</td>
              <td>Dr. {apt.doctorId?.userId?.name || '—'}</td>
              <td style={{ fontSize: '0.82rem' }}>{apt.date} · {apt.time}</td>
              <td style={{ fontSize: '0.82rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {apt.reason}
              </td>
              <td><StatusBadge status={apt.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Skeleton Loader ───────────────────────────────────────────────────────────

const SkeletonLoader = () => (
  <div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{ height: '90px', borderRadius: '1rem', background: '#e2e8f0' }} className="skeleton" />
      ))}
    </div>
    <div style={{ height: '200px', borderRadius: '1rem', background: '#e2e8f0' }} className="skeleton" />
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const toast = useToast();

  const [activeTab,    setActiveTab]    = useState('Overview');
  const [stats,        setStats]        = useState(null);
  const [doctors,      setDoctors]      = useState([]);
  const [users,        setUsers]        = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, doctorsRes, usersRes, aptsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/doctors'),
        api.get('/admin/users'),
        api.get('/admin/appointments'),
      ]);
      setStats(statsRes.data);
      setDoctors(doctorsRes.data);
      setUsers(usersRes.data);
      setAppointments(aptsRes.data);
    } catch {
      setError('Failed to load admin data. Check your connection and refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleVerify = async (doctorId, status, note) => {
    try {
      const res = await api.put(`/admin/doctors/${doctorId}/verify`, { status, note });
      setDoctors((prev) => prev.map((d) => (d._id === doctorId ? res.data : d)));
      const statsRes = await api.get('/admin/stats');
      setStats(statsRes.data);
      toast.success(`Doctor ${status === 'approved' ? 'approved' : 'rejected'} successfully.`);
    } catch {
      toast.error('Failed to update verification status.');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      const statsRes = await api.get('/admin/stats');
      setStats(statsRes.data);
      toast.success('User deleted successfully.');
    } catch {
      toast.error('Failed to delete user.');
    }
  };

  const pendingKYCCount = doctors.filter((d) => d.verificationStatus === 'pending').length;

  return (
    <div className="admin-page container animate-fade-in">
      {/* Header */}
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Admin Dashboard</h2>
          <p className="text-muted">Manage the HealthConnect platform — verify doctors, monitor users and appointments.</p>
        </div>
        <button onClick={fetchAll} className="btn btn-outline" style={{ flexShrink: 0, gap: '0.4rem' }} disabled={loading}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '0.85rem 1.25rem', borderRadius: '0.6rem', background: '#fee2e2', color: '#991b1b', marginBottom: '1rem', borderLeft: '4px solid #ef4444' }}>
          {error}
        </div>
      )}

      {loading ? <SkeletonLoader /> : (
        <>
          {/* Tabs */}
          <div className="admin-tabs">
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`admin-tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                {tab === 'Doctor Verification' && pendingKYCCount > 0 && (
                  <span style={{
                    marginLeft: '0.4rem', background: '#f59e0b', color: 'white',
                    borderRadius: '999px', fontSize: '0.7rem', padding: '0.1rem 0.45rem', fontWeight: 700,
                  }}>
                    {pendingKYCCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          {activeTab === 'Overview'            && <OverviewTab           stats={stats} />}
          {activeTab === 'Doctor Verification' && <DoctorVerificationTab doctors={doctors}      onVerify={handleVerify} />}
          {activeTab === 'Users'               && <UsersTab              users={users}          onDeleteUser={handleDeleteUser} />}
          {activeTab === 'Appointments'        && <AppointmentsTab       appointments={appointments} />}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;

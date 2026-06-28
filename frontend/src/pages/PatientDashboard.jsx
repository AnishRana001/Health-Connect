import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import MedicineCalendar from '../components/MedicineCalendar';
import { useToast } from '../context/ToastContext';
import {
  CreditCard, Smartphone, Building2, Banknote,
  Clock, CheckCircle2, AlertCircle, IndianRupee,
  Calendar, FileText, Pill, X, CheckCircle, AlertTriangle,
} from 'lucide-react';
import './Dashboard.css';
import './PaymentDashboard.css';

/* ── Payment method label + icon ────────────────────────────── */
const METHOD_LABELS = {
  upi:        { label: 'UPI',            Icon: Smartphone },
  card:       { label: 'Card',           Icon: CreditCard },
  netbanking: { label: 'Net Banking',    Icon: Building2  },
  cash:       { label: 'Cash at Clinic', Icon: Banknote   },
};

const PaymentBadge = ({ apt }) => {
  const { paymentStatus, paymentMethod, mockTransactionId } = apt;

  const config = {
    paid:          { label: 'Paid',           bg: '#dcfce7', color: '#166534', Icon: CheckCircle2 },
    pay_at_clinic: { label: 'Pay at Clinic',  bg: '#fef9c3', color: '#854d0e', Icon: Banknote     },
    unpaid:        { label: 'Unpaid',         bg: '#fee2e2', color: '#991b1b', Icon: AlertCircle  },
    failed:        { label: 'Expired/Failed', bg: '#f1f5f9', color: '#64748b', Icon: AlertCircle  },
  };

  const c = config[paymentStatus] || config.unpaid;
  const { Icon } = c;
  const methodInfo = paymentMethod ? METHOD_LABELS[paymentMethod] : null;

  return (
    <div className="payment-badge-row">
      <span className="payment-status-pill" style={{ background: c.bg, color: c.color }}>
        <Icon size={12} style={{ flexShrink: 0 }} />
        {c.label}
      </span>
      {methodInfo && (
        <span className="payment-method-tag">
          <methodInfo.Icon size={11} />
          {methodInfo.label}
        </span>
      )}
      {mockTransactionId && (
        <span className="payment-txn-id" title={mockTransactionId}>
          <IndianRupee size={10} />
          {mockTransactionId}
        </span>
      )}
    </div>
  );
};

/* ── Reservation countdown inline ────────────────────────────── */
const ReservationCountdown = ({ expiresAt }) => {
  const [secs, setSecs] = useState(null);
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setSecs(Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (secs === null || secs <= 0) return null;
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return (
    <div className="reservation-inline">
      <Clock size={12} />
      Slot reserved — complete payment in {m}:{s}
    </div>
  );
};

/* ── Skeleton Card ─────────────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="appointment-card skeleton-card">
    <div className="apt-card-top skeleton-top">
      <div className="skeleton skeleton-avatar" />
      <div className="skeleton-text-block">
        <div className="skeleton skeleton-line" style={{ width: '60%', height: '14px' }} />
        <div className="skeleton skeleton-line" style={{ width: '40%', height: '11px', marginTop: '6px' }} />
      </div>
      <div className="skeleton skeleton-badge" style={{ marginLeft: 'auto' }} />
    </div>
    <div className="apt-body skeleton-body">
      <div className="skeleton skeleton-line" style={{ width: '55%', height: '12px' }} />
      <div className="skeleton skeleton-line" style={{ width: '45%', height: '12px', marginTop: '8px' }} />
      <div className="skeleton skeleton-line" style={{ width: '70%', height: '12px', marginTop: '8px' }} />
    </div>
  </div>
);

/* ── Status badge class helper ─────────────────────────────────── */
const statusBadgeClass = (status) => {
  switch (status) {
    case 'confirmed': return 'badge badge-success';
    case 'cancelled': return 'badge badge-danger';
    case 'completed': return 'badge badge-success';
    default:          return 'badge badge-pending';
  }
};

/* ── Main Dashboard ──────────────────────────────────────────── */
const PatientDashboard = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data } = await api.get('/appointments/myappointments');
        setAppointments(data);
      } catch (error) {
        console.error('Error fetching appointments', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const handleCancel = async (id) => {
    if (cancellingId !== id) {
      setCancellingId(id);
      return;
    }
    setCancellingId(null);
    try {
      await api.put(`/appointments/${id}/status`, { status: 'cancelled' });
      setAppointments((prev) => prev.map((a) => (a._id === id ? { ...a, status: 'cancelled' } : a)));
      toast.success('Appointment cancelled.');
    } catch {
      toast.error('Failed to cancel appointment. Please try again.');
    }
  };

  const handleCompletePayment = (apt) => {
    navigate(`/payment/${apt._id}`, {
      state: {
        doctorName:           apt.doctorId?.userId?.name,
        specialization:       apt.doctorId?.specialization,
        consultationFee:      apt.doctorId?.consultationFee,
        date:                 apt.date,
        time:                 apt.time,
        reservationExpiresAt: apt.reservationExpiresAt,
      },
    });
  };

  return (
    <div className="dashboard-page container animate-fade-in">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="dashboard-header mt-2 mb-2">
        <div className="dashboard-header-left">
          <p className="dashboard-greeting">Good to see you 👋</p>
          <h2 className="dashboard-title">My Appointments</h2>
          <p className="dashboard-subtitle">View and manage your scheduled consultations.</p>
        </div>
        <button
          className="btn btn-primary dashboard-book-btn"
          onClick={() => navigate('/doctors')}
        >
          <Calendar size={16} />
          Book New Appointment
        </button>
      </div>

      {/* ── Loading skeletons ──────────────────────────────────── */}
      {loading ? (
        <div className="appointments-grid">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : appointments.length === 0 ? (

        /* ── Empty state ──────────────────────────────────────── */
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <h3 className="empty-state-heading">No appointments yet</h3>
          <p className="empty-state-sub">
            You haven&apos;t booked any consultations. Find a doctor and schedule your first visit.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/doctors')}>
            <Calendar size={15} style={{ marginRight: '0.4rem' }} />
            Book Now
          </button>
        </div>

      ) : (
        <>
          <MedicineCalendar appointments={appointments} />

          <div className="section-divider">
            <span className="section-divider-label">Appointment History</span>
          </div>

          <div className="appointments-grid">
            {appointments.map((apt) => {
              const docName = apt.doctorId?.userId?.name || 'Unknown';
              const initial = docName.charAt(0).toUpperCase();
              const spec    = apt.doctorId?.specialization || '';

              return (
                <div key={apt._id} className="appointment-card">

                  {/* ── Card Top ─────────────────────────────── */}
                  <div className="apt-card-top">
                    <div className="apt-doc-avatar">{initial}</div>
                    <div className="apt-doc-info">
                      <div className="apt-doc-name">Dr. {docName}</div>
                      <div className="apt-doc-spec">{spec}</div>
                    </div>
                    <span className={statusBadgeClass(apt.status)} style={{ marginLeft: 'auto', flexShrink: 0 }}>
                      {apt.status}
                    </span>
                  </div>

                  {/* ── Card Body ────────────────────────────── */}
                  <div className="apt-body">
                    <div className="apt-meta-row">
                      <Calendar size={14} className="apt-meta-icon" />
                      {apt.date}
                    </div>
                    <div className="apt-meta-row">
                      <Clock size={14} className="apt-meta-icon" />
                      {apt.time}
                    </div>

                    <PaymentBadge apt={apt} />

                    {apt.paymentStatus === 'unpaid' && apt.status === 'pending' && (
                      <>
                        <ReservationCountdown expiresAt={apt.reservationExpiresAt} />
                        <button
                          className="btn btn-primary complete-payment-btn"
                          onClick={() => handleCompletePayment(apt)}
                        >
                          <IndianRupee size={13} />
                          Complete Payment
                        </button>
                      </>
                    )}

                    <div className="apt-reason">
                      <FileText size={13} className="apt-meta-icon" />
                      <span><strong>Reason:</strong> {apt.reason}</span>
                    </div>

                    {apt.prescription && (
                      <div className="apt-prescription">
                        <div className="apt-prescription-header">
                          <Pill size={13} />
                          Prescription Notes
                        </div>
                        <p className="apt-prescription-text">{apt.prescription}</p>
                      </div>
                    )}
                  </div>

                  {/* ── Card Actions ─────────────────────────── */}
                  <div className="apt-actions">
                    {(apt.status === 'pending' || apt.status === 'confirmed') && apt.paymentStatus !== 'unpaid' && (
                      cancellingId === apt._id ? (
                        <div className="cancel-confirm-row">
                          <span className="cancel-confirm-label">
                            <AlertTriangle size={13} />
                            Confirm cancel?
                          </span>
                          <button
                            onClick={() => handleCancel(apt._id)}
                            className="btn btn-danger cancel-yes-btn"
                          >
                            <CheckCircle size={13} /> Yes
                          </button>
                          <button
                            onClick={() => setCancellingId(null)}
                            className="btn btn-outline cancel-no-btn"
                          >
                            <X size={13} /> No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleCancel(apt._id)}
                          className="btn btn-outline btn-danger cancel-btn"
                        >
                          <X size={14} />
                          Cancel Appointment
                        </button>
                      )
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default PatientDashboard;

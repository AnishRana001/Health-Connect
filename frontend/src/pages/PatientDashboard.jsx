import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import MedicineCalendar from '../components/MedicineCalendar';
import { useToast } from '../context/ToastContext';
import {
  CreditCard, Smartphone, Building2, Banknote,
  Clock, CheckCircle2, AlertCircle, IndianRupee
} from 'lucide-react';
import './Dashboard.css';
import './PaymentDashboard.css';

/* ── Payment method label + icon ────────────────────────────── */
const METHOD_LABELS = {
  upi:        { label: 'UPI',          Icon: Smartphone },
  card:       { label: 'Card',         Icon: CreditCard },
  netbanking: { label: 'Net Banking',  Icon: Building2  },
  cash:       { label: 'Cash at Clinic', Icon: Banknote },
};

const PaymentBadge = ({ apt }) => {
  const { paymentStatus, paymentMethod, mockTransactionId } = apt;

  const config = {
    paid:          { label: 'Paid',            bg: '#dcfce7', color: '#166534', Icon: CheckCircle2 },
    pay_at_clinic: { label: 'Pay at Clinic',   bg: '#fef9c3', color: '#854d0e', Icon: Banknote     },
    unpaid:        { label: 'Unpaid',           bg: '#fee2e2', color: '#991b1b', Icon: AlertCircle  },
    failed:        { label: 'Expired/Failed',   bg: '#f1f5f9', color: '#64748b', Icon: AlertCircle  },
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
      <div className="dashboard-header mt-2 mb-2">
        <h2>My Appointments</h2>
        <p className="text-muted">View and manage your scheduled consultations.</p>
      </div>

      {loading ? (
        <div style={{ padding: '2rem 0' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: '120px', background: '#e2e8f0', borderRadius: '1rem', marginBottom: '1rem' }} className="skeleton" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="card text-center" style={{ padding: '3rem 1rem' }}>
          <h3>No Appointments Found</h3>
          <p className="text-muted mb-1">You haven't booked any appointments yet.</p>
          <a href="/doctors" className="btn btn-primary">Book Now</a>
        </div>
      ) : (
        <>
          <MedicineCalendar appointments={appointments} />

          <h3 className="mt-2 mb-1" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Appointment History</h3>
          <div className="appointments-grid">
            {appointments.map((apt) => (
              <div key={apt._id} className="appointment-card card">
                <div className="apt-body">
                  <h4>Dr. {apt.doctorId?.userId?.name || 'Unknown'}</h4>
                  <p className="text-muted">{apt.doctorId?.specialization}</p>
                  <div className="apt-details">
                    <span className={`badge badge-${
                      apt.status === 'confirmed' ? 'success' :
                      apt.status === 'cancelled' ? 'danger'  :
                      apt.status === 'completed' ? 'success' : 'pending'
                    }`}>
                      {apt.status}
                    </span>
                    <span>{apt.date} at {apt.time}</span>
                  </div>

                  {/* Payment badge row */}
                  <PaymentBadge apt={apt} />

                  {/* Pending payment countdown + resume button */}
                  {apt.paymentStatus === 'unpaid' && apt.status === 'pending' && (
                    <>
                      <ReservationCountdown expiresAt={apt.reservationExpiresAt} />
                      <button
                        className="btn btn-primary"
                        style={{ marginTop: '0.6rem', padding: '0.4rem 0.9rem', fontSize: '0.83rem' }}
                        onClick={() => handleCompletePayment(apt)}
                      >
                        Complete Payment
                      </button>
                    </>
                  )}

                  <p className="mt-1"><strong>Reason:</strong> {apt.reason}</p>
                  {apt.prescription && (
                    <div className="mt-1" style={{ background: 'var(--bg-main)', padding: '0.8rem', borderRadius: '0.4rem', borderLeft: '3px solid var(--primary)' }}>
                      <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Prescription Notes:</p>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.9rem', whiteSpace: 'pre-line' }}>{apt.prescription}</p>
                    </div>
                  )}
                </div>
                <div className="apt-actions">
                  {(apt.status === 'pending' || apt.status === 'confirmed') && apt.paymentStatus !== 'unpaid' && (
                    cancellingId === apt._id ? (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Confirm cancel?</span>
                        <button onClick={() => handleCancel(apt._id)} className="btn btn-danger" style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}>Yes</button>
                        <button onClick={() => setCancellingId(null)} className="btn btn-outline" style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}>No</button>
                      </div>
                    ) : (
                      <button onClick={() => handleCancel(apt._id)} className="btn btn-outline btn-danger">Cancel Appointment</button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PatientDashboard;

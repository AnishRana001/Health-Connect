import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ShieldCheck, Clock, DollarSign, Stethoscope, Calendar } from 'lucide-react';
import api from '../utils/api';
import SlotPicker from '../components/SlotPicker';
import './DoctorProfile.css';

const DoctorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [doctor,       setDoctor]       = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [reason,       setReason]       = useState('');
  const [selection,    setSelection]    = useState({ date: null, time: null });
  const [bookingState, setBookingState] = useState({ status: '', message: '' }); // 'idle' | 'loading' | 'success' | 'error'

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const { data } = await api.get(`/doctors/${id}`);
        setDoctor(data);
      } catch (error) {
        console.error('Failed to fetch doctor', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [id]);

  const handleSlotSelect = ({ date, time }) => {
    setSelection({ date, time });
    // Reset any previous error when user picks a new slot
    if (bookingState.status === 'error') setBookingState({ status: '', message: '' });
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'patient') {
      setBookingState({ status: 'error', message: 'Only patients can book appointments.' });
      return;
    }
    if (!selection.date || !selection.time) {
      setBookingState({ status: 'error', message: 'Please select a date and time slot first.' });
      return;
    }
    if (!reason.trim()) {
      setBookingState({ status: 'error', message: 'Please describe your reason for the visit.' });
      return;
    }

    setBookingState({ status: 'loading', message: '' });
    try {
      const { data: appointment } = await api.post('/appointments', {
        doctorId: doctor._id,
        date:     selection.date,
        time:     selection.time,
        reason,
      });
      // Slot reserved — navigate to payment page with context
      navigate(`/payment/${appointment._id}`, {
        state: {
          doctorName:      doctor.userId?.name,
          specialization:  doctor.specialization,
          consultationFee: doctor.consultationFee,
          date:            selection.date,
          time:            selection.time,
          reservationExpiresAt: appointment.reservationExpiresAt,
        },
      });
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to book appointment. Please try again.';
      setBookingState({ status: 'error', message: msg });
    }
  };

  if (loading) {
    return (
      <div className="doctor-profile-page container animate-fade-in" style={{ paddingTop: '2rem' }}>
        <div className="profile-layout mt-2 gap-2">
          <div className="skeleton" style={{ height: '420px', borderRadius: '1rem' }} />
          <div className="skeleton" style={{ height: '560px', borderRadius: '1rem' }} />
        </div>
      </div>
    );
  }

  if (!doctor) return (
    <div className="container mt-2" style={{ textAlign: 'center', paddingTop: '4rem' }}>
      <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Doctor not found.</p>
    </div>
  );

  const canBook = true;

  return (
    <div className="doctor-profile-page container animate-fade-in">
      <div className="profile-layout mt-2 gap-2">

        {/* ── LEFT: Doctor info ─────────────────────────────────────── */}
        <div className="profile-details card">
          <div className="profile-header">
            {/* Avatar placeholder with initials */}
            <div className="doc-avatar">
              {doctor.userId?.name?.charAt(0).toUpperCase() || 'D'}
            </div>
            <div>
              <h2>Dr. {doctor.userId?.name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                <span className="badge badge-success">{doctor.specialization}</span>
                {doctor.verified && (
                  <span className="verified-badge">
                    <ShieldCheck size={13} /> Verified Doctor
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="profile-body mt-1">
            <p className="about-text">{doctor.about || 'No details provided by the doctor.'}</p>
            <hr className="profile-divider" />

            <div className="info-grid mt-1">
              <div className="info-item">
                <span className="info-label text-muted">
                  <Stethoscope size={13} style={{ marginRight: '0.3rem' }} />Experience
                </span>
                <span className="info-value">{doctor.experience} Years</span>
              </div>
              <div className="info-item">
                <span className="info-label text-muted">
                  <DollarSign size={13} style={{ marginRight: '0.3rem' }} />Consultation Fee
                </span>
                <span className="info-value">${doctor.consultationFee}</span>
              </div>
              <div className="info-item">
                <span className="info-label text-muted">
                  <Calendar size={13} style={{ marginRight: '0.3rem' }} />Working Days
                </span>
                <span className="info-value">{doctor.availableDays.join(', ')}</span>
              </div>
              <div className="info-item">
                <span className="info-label text-muted">
                  <Clock size={13} style={{ marginRight: '0.3rem' }} />Timings
                </span>
                <span className="info-value">
                  {doctor.availableTiming?.start} – {doctor.availableTiming?.end}
                </span>
              </div>
            </div>

            {/* Slot duration pill */}
            {doctor.slotDuration && (
              <div className="slot-duration-pill">
                ⏱ Appointments every {doctor.slotDuration} minutes
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Booking section ────────────────────────────────── */}
        <div className="booking-section card">
          <div className="booking-header">
            <h3 className="booking-title">Book an Appointment</h3>
            <p className="booking-subtitle">Select a date and available time slot below.</p>
          </div>

          {/* Status alerts */}
          {bookingState.status === 'error' && (
            <div className="booking-alert alert-error">
              <ShieldAlert size={18} /> {bookingState.message}
            </div>
          )}

          {canBook && (
            <form onSubmit={handleBooking}>
              {/* SlotPicker */}
              <div className="form-group">
                <label className="form-label" style={{ marginBottom: '0.6rem', display: 'block' }}>
                  Choose Date &amp; Time
                </label>
                <SlotPicker
                  doctorId={doctor._id}
                  workingDays={doctor.availableDays}
                  unavailableDates={doctor.unavailableDates || []}
                  onSelect={handleSlotSelect}
                />
              </div>

              {/* Reason */}
              <div className="form-group mt-1">
                <label className="form-label">Reason for Visit</label>
                <textarea
                  className="form-control"
                  rows="3"
                  required
                  placeholder="Describe your symptoms briefly…"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={bookingState.status === 'loading' || !selection.date || !selection.time}
              >
                {bookingState.status === 'loading' ? 'Booking…' : 'Confirm Booking'}
              </button>

              {!user && (
                <p className="text-muted text-center mt-1">
                  <small>You must be logged in as a patient to book.</small>
                </p>
              )}
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default DoctorProfile;

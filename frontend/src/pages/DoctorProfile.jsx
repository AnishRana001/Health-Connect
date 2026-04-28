import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, CheckCircle } from 'lucide-react';
import api from '../utils/api';
import './DoctorProfile.css';

const DoctorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState({ date: '', time: '', reason: '' });
  const [bookingStatus, setBookingStatus] = useState({ status: '', message: '' });

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

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Check if patient
    if (user.role !== 'patient') {
      setBookingStatus({ status: 'error', message: 'Only patients can book appointments.' });
      return;
    }

    try {
      await api.post('/appointments', {
        doctorId: doctor._id,
        date: bookingData.date,
        time: bookingData.time,
        reason: bookingData.reason
      });
      setBookingStatus({ status: 'success', message: 'Appointment booked successfully!' });
      setBookingData({ date: '', time: '', reason: '' });
      setTimeout(() => navigate('/patient-dashboard'), 3000);
    } catch (error) {
      setBookingStatus({ status: 'error', message: 'Failed to book appointment' });
    }
  };

  if (loading) return <div className="container mt-2">Loading...</div>;
  if (!doctor) return <div className="container mt-2">Doctor not found.</div>;

  return (
    <div className="doctor-profile-page container animate-fade-in">
      <div className="profile-layout mt-2 gap-2">
        <div className="profile-details card">
          <div className="profile-header">
            <h2>Dr. {doctor.userId?.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
              <span className="badge badge-success">{doctor.specialization}</span>
              {doctor.verified && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                  background: 'rgba(16,185,129,0.12)', color: '#10b981',
                  fontSize: '0.78rem', fontWeight: 700, padding: '0.25rem 0.65rem',
                  borderRadius: '999px', border: '1px solid rgba(16,185,129,0.35)',
                }}>
                  <ShieldCheck size={13} /> Verified Doctor
                </span>
              )}
            </div>
          </div>
          <div className="profile-body mt-1">
            <p className="about-text">{doctor.about || 'No details provided by the doctor.'}</p>
            <hr className="profile-divider" />
            <div className="info-grid mt-1">
              <div className="info-item">
                <span className="info-label text-muted">Experience</span>
                <span className="info-value">{doctor.experience} Years</span>
              </div>
              <div className="info-item">
                <span className="info-label text-muted">Consultation Fee</span>
                <span className="info-value">${doctor.consultationFee}</span>
              </div>
              <div className="info-item">
                <span className="info-label text-muted">Availability</span>
                <span className="info-value">{doctor.availableDays.join(', ')}</span>
              </div>
              <div className="info-item">
                <span className="info-label text-muted">Timings</span>
                <span className="info-value">{doctor.availableTiming?.start} - {doctor.availableTiming?.end}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="booking-section card">
          <h3 className="booking-title">Book an Appointment</h3>
          
          {bookingStatus.status === 'error' && (
             <div className="booking-alert alert-error">
                <ShieldAlert size={18} /> {bookingStatus.message}
             </div>
          )}
          {bookingStatus.status === 'success' && (
             <div className="booking-alert alert-success mt-1">
                <CheckCircle size={18} /> {bookingStatus.message}
                <br/><small>Redirecting to dashboard...</small>
             </div>
          )}

          <form onSubmit={handleBooking} className="mt-1">
            <div className="form-group">
              <label className="form-label">Preferred Date</label>
              <input type="date" className="form-control" required
                 value={bookingData.date} onChange={(e) => setBookingData({...bookingData, date: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Preferred Time</label>
              <input type="time" className="form-control" required
                 value={bookingData.time} onChange={(e) => setBookingData({...bookingData, time: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Reason for Visit</label>
              <textarea className="form-control" rows="3" required placeholder="Describe your symptoms briefly..."
                 value={bookingData.reason} onChange={(e) => setBookingData({...bookingData, reason: e.target.value})}></textarea>
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={bookingStatus.status === 'success'}>
               Confirm Booking
            </button>
            {!user && <p className="text-muted text-center mt-1"><small>You must be logged in as a patient to book.</small></p>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;

import { useState, useEffect } from 'react';
import api from '../utils/api';
import MedicineCalendar from '../components/MedicineCalendar';
import './Dashboard.css';

const PatientDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

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
    if(window.confirm('Are you sure you want to cancel this appointment?')){
        try {
            await api.put(`/appointments/${id}/status`, { status: 'cancelled' });
            setAppointments(appointments.map(app => 
                app._id === id ? { ...app, status: 'cancelled' } : app
            ));
        } catch (error) {
            alert('Failed to update status');
        }
    }
  };

  return (
    <div className="dashboard-page container animate-fade-in">
      <div className="dashboard-header mt-2 mb-2">
        <h2>My Appointments</h2>
        <p className="text-muted">View and manage your scheduled consultations.</p>
      </div>

      {loading ? (
        <p>Loading appointments...</p>
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
                  <span className="badge badge-pending">{apt.status}</span>
                  <span>{apt.date} at {apt.time}</span>
                </div>
                <p className="mt-1"><strong>Reason:</strong> {apt.reason}</p>
                {apt.prescription && (
                  <div className="mt-1" style={{ background: 'var(--bg-main)', padding: '0.8rem', borderRadius: '0.4rem', borderLeft: '3px solid var(--primary)' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Prescription Notes:</p>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.9rem', whiteSpace: 'pre-line' }}>{apt.prescription}</p>
                  </div>
                )}
              </div>
              <div className="apt-actions">
                {apt.status === 'pending' || apt.status === 'confirmed' ? (
                  <button onClick={() => handleCancel(apt._id)} className="btn btn-outline btn-danger">Cancel</button>
                ) : null}
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

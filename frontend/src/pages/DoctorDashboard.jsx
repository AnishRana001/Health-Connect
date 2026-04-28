import { useState, useEffect } from 'react';
import api from '../utils/api';
import './Dashboard.css';

const DoctorDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [profile, setProfile] = useState({
    specialization: '', experience: '', consultationFee: '', 
    availableDays: '', about: '', start: '09:00', end: '17:00'
  });
  const [loading, setLoading] = useState(true);
  const [profileSaved, setProfileSaved] = useState(false);
  const [prescriptionForm, setPrescriptionForm] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch appointments
        const aptRes = await api.get('/appointments/doctorappointments');
        setAppointments(aptRes.data);
      } catch (error) {
        console.error('Error fetching doctor data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/appointments/${id}/status`, { status });
      setAppointments(appointments.map(app => 
         app._id === id ? { ...app, status } : app
      ));
    } catch (error) {
      alert('Error updating status');
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...profile,
        availableDays: profile.availableDays.split(',').map(d => d.trim()),
        availableTiming: { start: profile.start, end: profile.end }
      };
      await api.post('/doctors/profile', payload);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (error) {
      alert('Error saving profile');
    }
  };

  const handleOpenPrescription = (apt) => {
    setPrescriptionForm({
      aptId: apt._id,
      prescription: apt.prescription || '',
      medicines: apt.medicines || []
    });
  };

  const handleAddMedicine = () => {
    const today = new Date().toISOString().split('T')[0];
    setPrescriptionForm({
      ...prescriptionForm,
      medicines: [...prescriptionForm.medicines, { name: '', dosage: '', duration: '', startDate: today }]
    });
  };

  const handleMedicineChange = (index, field, value) => {
    const newMeds = [...prescriptionForm.medicines];
    newMeds[index][field] = value;
    setPrescriptionForm({ ...prescriptionForm, medicines: newMeds });
  };
  
  const handleRemoveMedicine = (index) => {
     const newMeds = [...prescriptionForm.medicines];
     newMeds.splice(index, 1);
     setPrescriptionForm({ ...prescriptionForm, medicines: newMeds });
  };

  const handleSubmitPrescription = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/appointments/${prescriptionForm.aptId}/prescription`, {
        prescription: prescriptionForm.prescription,
        medicines: prescriptionForm.medicines
      });
      setAppointments(appointments.map(a => a._id === prescriptionForm.aptId ? res.data : a));
      setPrescriptionForm(null);
      alert('Prescription saved!');
    } catch (error) {
      alert('Error saving prescription');
    }
  };

  return (
    <div className="dashboard-page container animate-fade-in">
      <div className="dashboard-header mt-2 mb-2">
        <h2>Doctor Dashboard</h2>
        <p className="text-muted">Manage your profile and patient consultations.</p>
      </div>

      <div className="flex gap-2" style={{ alignItems: 'flex-start' }}>
        <div className="card" style={{ flex: '1', padding: '1.5rem' }}>
           <h3>Profile Settings</h3>
           {profileSaved && <div className="badge badge-success mb-1">Profile Updated!</div>}
           <form onSubmit={handleProfileSubmit} className="mt-1">
             <div className="profile-form-grid">
               <div className="form-group">
                 <label className="form-label">Specialization</label>
                 <input type="text" className="form-control" required 
                   value={profile.specialization} onChange={(e) => setProfile({ ...profile, specialization: e.target.value })} 
                   placeholder="e.g., Cardiologist" />
               </div>
               <div className="form-group">
                 <label className="form-label">Experience (Years)</label>
                 <input type="number" className="form-control" required
                   value={profile.experience} onChange={(e) => setProfile({ ...profile, experience: e.target.value })} />
               </div>
               <div className="form-group">
                 <label className="form-label">Consultation Fee ($)</label>
                 <input type="number" className="form-control" required
                   value={profile.consultationFee} onChange={(e) => setProfile({ ...profile, consultationFee: e.target.value })} />
               </div>
               <div className="form-group">
                 <label className="form-label">Available Days (comma separated)</label>
                 <input type="text" className="form-control" required
                   value={profile.availableDays} onChange={(e) => setProfile({ ...profile, availableDays: e.target.value })} 
                   placeholder="Mon, Tue, Wed" />
               </div>
               <div className="form-group">
                 <label className="form-label">Start Time</label>
                 <input type="time" className="form-control" required
                   value={profile.start} onChange={(e) => setProfile({ ...profile, start: e.target.value })} />
               </div>
               <div className="form-group">
                 <label className="form-label">End Time</label>
                 <input type="time" className="form-control" required
                   value={profile.end} onChange={(e) => setProfile({ ...profile, end: e.target.value })} />
               </div>
               <div className="form-group full-width">
                 <label className="form-label">About</label>
                 <textarea className="form-control" rows="3"
                   value={profile.about} onChange={(e) => setProfile({ ...profile, about: e.target.value })}></textarea>
               </div>
             </div>
             <button type="submit" className="btn btn-primary mt-1">Save Profile</button>
           </form>
        </div>

        <div className="card" style={{ flex: '2', padding: '1.5rem', background: 'transparent', boxShadow: 'none', border: 'none' }}>
           <h3>Upcoming Appointments</h3>
           {loading ? <p>Loading...</p> : appointments.length === 0 ? (
             <p className="text-muted">No appointments scheduled.</p>
           ) : (
             <div className="appointments-grid" style={{ gridTemplateColumns: '1fr' }}>
               {appointments.map((apt) => (
                 <div key={apt._id} className="appointment-card card">
                   <div className="apt-body flex justify-between items-center" style={{ padding: '1rem' }}>
                     <div>
                       <h4>Patient: {apt.userId?.name}</h4>
                       <p className="text-muted mb-1">{apt.date} at {apt.time}</p>
                       <p><strong>Reason:</strong> {apt.reason}</p>
                     </div>
                     <div className="text-right flex-col items-center gap-1">
                       <span className="badge badge-pending mb-1">{apt.status}</span>
                       <div className="flex gap-1 mt-1">
                         {apt.status === 'pending' && (
                           <>
                             <button onClick={() => handleStatusUpdate(apt._id, 'confirmed')} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Confirm</button>
                             <button onClick={() => handleStatusUpdate(apt._id, 'cancelled')} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Cancel</button>
                           </>
                         )}
                         {apt.status === 'confirmed' && (
                           <button onClick={() => handleStatusUpdate(apt._id, 'completed')} className="btn btn-success" style={{ background: '#10b981', color:'white', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Mark Completed</button>
                         )}
                          {(apt.status === 'confirmed' || apt.status === 'completed') && (
                            <button onClick={() => handleOpenPrescription(apt)} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Prescribe</button>
                          )}
                        </div>
                      </div>
                    </div>
                    {prescriptionForm && prescriptionForm.aptId === apt._id && (
                      <div className="prescription-form" style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: 'var(--card-bg)' }}>
                        <h4 className="mb-1">Submit Prescription</h4>
                        <form onSubmit={handleSubmitPrescription}>
                          <div className="form-group full-width">
                            <label className="form-label">General Prescription / Notes</label>
                            <textarea className="form-control" rows="2" 
                              value={prescriptionForm.prescription} 
                              onChange={e => setPrescriptionForm({...prescriptionForm, prescription: e.target.value})} />
                          </div>
                          <div className="mb-1 mt-1 flex justify-between items-center">
                            <h5>Medicines</h5>
                            <button type="button" onClick={handleAddMedicine} className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>+ Add Medicine</button>
                          </div>
                          {prescriptionForm.medicines.map((med, idx) => (
                            <div key={idx} className="flex gap-1 mb-1 items-center" style={{ background: 'var(--bg-main)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                              <input type="text" className="form-control" placeholder="Name" required
                                value={med.name} onChange={e => handleMedicineChange(idx, 'name', e.target.value)} />
                              <input type="text" className="form-control" placeholder="Dosage (e.g., 1-0-1)" required
                                value={med.dosage} onChange={e => handleMedicineChange(idx, 'dosage', e.target.value)} />
                              <input type="number" className="form-control" placeholder="Days" required style={{ width: '80px' }}
                                value={med.duration} onChange={e => handleMedicineChange(idx, 'duration', e.target.value)} />
                              <input type="date" className="form-control" required
                                value={med.startDate} onChange={e => handleMedicineChange(idx, 'startDate', e.target.value)} />
                              <button type="button" onClick={() => handleRemoveMedicine(idx)} className="btn btn-danger" style={{ padding: '0.4rem 0.6rem' }}>X</button>
                            </div>
                          ))}
                          <div className="flex gap-1 mt-1">
                            <button type="submit" className="btn btn-primary">Save Prescription</button>
                            <button type="button" onClick={() => setPrescriptionForm(null)} className="btn btn-outline">Cancel</button>
                          </div>
                        </form>
                      </div>
                    )}
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;

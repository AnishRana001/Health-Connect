import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks/useApi';
import './Dashboard.css';

// ── Verification Banner ───────────────────────────────────────────────────────

const VerificationBanner = ({ status, note }) => {
  const map = {
    approved: { cls: 'banner-approved', text: '✅ Your account is verified. You are listed on the platform.' },
    rejected: { cls: 'banner-rejected', text: `❌ Verification rejected.${note ? ` Reason: ${note}` : ''} Please update your documents and re-submit.` },
    pending:  { cls: 'banner-pending',  text: '🕐 Your account is pending verification. An admin will review your KYC documents.' },
  };
  const { cls, text } = map[status] ?? map.pending;
  return <div className={`verification-banner ${cls}`}>{text}</div>;
};

// ── KYC Progress Indicator ────────────────────────────────────────────────────

const DOC_SLOTS = [
  { key: 'licenseDocument', label: 'Medical License Certificate' },
  { key: 'medicalDegree',   label: 'Degree Certificate' },
  { key: 'governmentId',    label: 'Government ID' },
];

const KYCProgress = ({ docs }) => {
  const uploaded = DOC_SLOTS.filter(({ key }) => docs[key]?.url).length;
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          Documents uploaded
        </span>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: uploaded === 3 ? '#10b981' : 'var(--text-muted)' }}>
          {uploaded} / 3
        </span>
      </div>
      <div style={{ height: '6px', background: 'var(--border)', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: '999px', transition: 'width 0.4s ease',
          width: `${(uploaded / 3) * 100}%`,
          background: uploaded === 3 ? '#10b981' : 'var(--primary)',
        }} />
      </div>
    </div>
  );
};

// ── Doc Badge ─────────────────────────────────────────────────────────────────

const DocBadge = ({ doc, label }) => {
  if (!doc?.url) {
    return <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Not uploaded</span>;
  }
  return (
    <a href={doc.url} target="_blank" rel="noopener noreferrer"
      className="btn btn-outline"
      style={{ padding: '0.2rem 0.55rem', fontSize: '0.74rem' }}>
      📄 {doc.originalName || label}
    </a>
  );
};

// ── Appointment Status Badge ──────────────────────────────────────────────────

const statusColors = {
  pending:   { bg: '#fef9c3', color: '#854d0e' },
  confirmed: { bg: '#dbeafe', color: '#1d4ed8' },
  completed: { bg: '#dcfce7', color: '#166534' },
  cancelled: { bg: '#fee2e2', color: '#991b1b' },
};

const StatusPill = ({ status }) => {
  const { bg, color } = statusColors[status] ?? statusColors.pending;
  return (
    <span style={{
      padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem',
      fontWeight: 700, textTransform: 'capitalize', background: bg, color,
    }}>
      {status}
    </span>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const EMPTY_PROFILE = {
  specialization: '', experience: '', consultationFee: '',
  availableDays: '', about: '', start: '09:00', end: '17:00',
  licenseNumber: '', hospitalAffiliation: '',
};

const DoctorDashboard = () => {
  const toast = useToast();
  const { execute } = useApi();

  const [appointments,       setAppointments]       = useState([]);
  const [profile,            setProfile]            = useState(EMPTY_PROFILE);
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [verificationNote,   setVerificationNote]   = useState('');
  const [uploadedDocs,       setUploadedDocs]       = useState({});
  const [kycFiles,           setKycFiles]           = useState({ licenseDocument: null, medicalDegree: null, governmentId: null });
  const [loading,            setLoading]            = useState(true);
  const [profileSaving,      setProfileSaving]      = useState(false);
  const [kycUploading,       setKycUploading]       = useState(false);
  const [prescriptionForm,   setPrescriptionForm]   = useState(null);

  // ── Data fetching ───────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    const fetchDashboardData = async () => {
      try {
        const [aptRes, profileRes] = await Promise.all([
          api.get('/appointments/doctorappointments'),
          api.get('/doctors/profile/me'),
        ]);
        if (cancelled) return;
        setAppointments(aptRes.data);
        const doc = profileRes.data;
        if (doc) {
          setVerificationStatus(doc.verificationStatus || 'pending');
          setVerificationNote(doc.verificationNote || '');
          setUploadedDocs(doc.documents ?? {});
          setProfile({
            specialization:     doc.specialization      || '',
            experience:         doc.experience           ?? '',
            consultationFee:    doc.consultationFee      ?? '',
            availableDays:      Array.isArray(doc.availableDays) ? doc.availableDays.join(', ') : '',
            about:              doc.about               || '',
            start:              doc.availableTiming?.start || '09:00',
            end:                doc.availableTiming?.end   || '17:00',
            licenseNumber:      doc.licenseNumber       || '',
            hospitalAffiliation: doc.hospitalAffiliation || '',
          });
        }
      } catch {
        if (!cancelled) toast.error('Failed to load dashboard data. Please refresh.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDashboardData();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Profile submit ──────────────────────────────────────────────────────────

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profile.specialization.trim()) return toast.warning('Specialization is required.');
    setProfileSaving(true);
    try {
      const payload = {
        ...profile,
        availableDays:  profile.availableDays.split(',').map((d) => d.trim()).filter(Boolean),
        availableTiming: { start: profile.start, end: profile.end },
      };
      await api.post('/doctors/profile', payload);
      toast.success('Profile saved successfully!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error saving profile. Please try again.');
    } finally {
      setProfileSaving(false);
    }
  };

  // ── KYC upload ──────────────────────────────────────────────────────────────

  const handleKYCSubmit = async (e) => {
    e.preventDefault();
    const hasFile = kycFiles.licenseDocument || kycFiles.medicalDegree || kycFiles.governmentId;
    if (!hasFile) return toast.warning('Please select at least one document to upload.');
    setKycUploading(true);
    const formData = new FormData();
    if (kycFiles.licenseDocument) formData.append('licenseDocument', kycFiles.licenseDocument);
    if (kycFiles.medicalDegree)   formData.append('medicalDegree',   kycFiles.medicalDegree);
    if (kycFiles.governmentId)    formData.append('governmentId',    kycFiles.governmentId);
    try {
      const res = await api.post('/doctors/kyc', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadedDocs(res.data.documents ?? {});
      if (res.data.verificationStatus) setVerificationStatus(res.data.verificationStatus);
      setKycFiles({ licenseDocument: null, medicalDegree: null, governmentId: null });
      toast.success('Documents uploaded! Awaiting admin review.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setKycUploading(false);
    }
  };

  // ── Appointment actions ─────────────────────────────────────────────────────

  const handleStatusUpdate = async (id, status) => {
    try {
      await execute(() => api.put(`/appointments/${id}/status`, { status }));
      setAppointments((prev) => prev.map((a) => (a._id === id ? { ...a, status } : a)));
      toast.success(`Appointment ${status}.`);
    } catch (err) {
      toast.error(err.message || 'Failed to update appointment status.');
    }
  };

  const handleSubmitPrescription = async (e) => {
    e.preventDefault();
    try {
      const res = await execute(() =>
        api.put(`/appointments/${prescriptionForm.aptId}/prescription`, {
          prescription: prescriptionForm.prescription,
          medicines:    prescriptionForm.medicines,
        })
      );
      setAppointments((prev) => prev.map((a) => (a._id === prescriptionForm.aptId ? res.data : a)));
      setPrescriptionForm(null);
      toast.success('Prescription saved!');
    } catch (err) {
      toast.error(err.message || 'Failed to save prescription.');
    }
  };

  const handleAddMedicine = () => {
    const today = new Date().toISOString().split('T')[0];
    setPrescriptionForm((prev) => ({
      ...prev,
      medicines: [...prev.medicines, { name: '', dosage: '', duration: '', startDate: today }],
    }));
  };

  const handleMedicineChange = (idx, field, value) => {
    setPrescriptionForm((prev) => {
      const meds = [...prev.medicines];
      meds[idx] = { ...meds[idx], [field]: value };
      return { ...prev, medicines: meds };
    });
  };

  const handleRemoveMedicine = (idx) => {
    setPrescriptionForm((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== idx),
    }));
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="dashboard-page container animate-fade-in" style={{ paddingTop: '2rem' }}>
        <div style={{ height: '2rem', background: '#e2e8f0', borderRadius: '0.5rem', marginBottom: '1rem', width: '260px' }} className="skeleton" />
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ flex: i === 1 ? 1 : 2, height: '400px', background: '#e2e8f0', borderRadius: '1rem' }} className="skeleton" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page container animate-fade-in">
      <div className="dashboard-header mt-2 mb-1">
        <h2>Doctor Dashboard</h2>
        <p className="text-muted">Manage your profile, KYC documents, and patient consultations.</p>
      </div>

      <VerificationBanner status={verificationStatus} note={verificationNote} />

      <div className="flex gap-2 mt-2" style={{ alignItems: 'flex-start' }}>

        {/* ── LEFT: Profile + KYC ─────────────────────────────────────── */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Profile */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3>Profile Settings</h3>
            <form onSubmit={handleProfileSubmit} className="mt-1">
              <div className="profile-form-grid">
                {[
                  { key: 'specialization',     label: 'Specialization',          type: 'text',   required: true,  placeholder: 'e.g., Cardiologist' },
                  { key: 'experience',         label: 'Experience (Years)',       type: 'number', required: true,  placeholder: '' },
                  { key: 'consultationFee',    label: 'Consultation Fee ($)',     type: 'number', required: true,  placeholder: '' },
                  { key: 'availableDays',      label: 'Available Days (comma sep)',type: 'text',  required: true,  placeholder: 'Mon, Tue, Wed' },
                  { key: 'start',              label: 'Start Time',              type: 'time',   required: true },
                  { key: 'end',                label: 'End Time',                type: 'time',   required: true },
                  { key: 'licenseNumber',      label: 'Medical License Number',  type: 'text',   required: false, placeholder: 'e.g., MCI-12345' },
                  { key: 'hospitalAffiliation',label: 'Hospital / Clinic',       type: 'text',   required: false, placeholder: 'e.g., City General Hospital' },
                ].map(({ key, label, type, required, placeholder }) => (
                  <div className="form-group" key={key}>
                    <label className="form-label">{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</label>
                    <input type={type} className="form-control" required={required} placeholder={placeholder}
                      value={profile[key]}
                      onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))} />
                  </div>
                ))}
                <div className="form-group full-width">
                  <label className="form-label">About</label>
                  <textarea className="form-control" rows="3"
                    value={profile.about}
                    onChange={(e) => setProfile((p) => ({ ...p, about: e.target.value }))} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary mt-1" disabled={profileSaving}>
                {profileSaving ? 'Saving…' : 'Save Profile'}
              </button>
            </form>
          </div>

          {/* KYC */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3>KYC Documents</h3>
            <p className="text-muted" style={{ fontSize: '0.85rem', margin: '0.4rem 0 1rem' }}>
              Upload credentials for admin verification. PDF, JPG or PNG — max 5 MB each.
            </p>

            <KYCProgress docs={uploadedDocs} />

            {/* Current uploads */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1.25rem' }}>
              {DOC_SLOTS.map(({ key, label }) => (
                <div key={key} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem', background: 'var(--bg-main)', borderRadius: '0.4rem',
                  border: uploadedDocs[key]?.url ? '1px solid #bbf7d0' : '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 500 }}>{label}</span>
                  <DocBadge doc={uploadedDocs[key]} label={label} />
                </div>
              ))}
            </div>

            {/* Upload form */}
            <form onSubmit={handleKYCSubmit}>
              <div className="profile-form-grid">
                {DOC_SLOTS.map(({ key, label }) => (
                  <div className="form-group" key={key} style={key === 'governmentId' ? { gridColumn: '1 / -1' } : {}}>
                    <label className="form-label">{label}</label>
                    <input type="file" className="form-control" accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => setKycFiles((f) => ({ ...f, [key]: e.target.files[0] || null }))} />
                  </div>
                ))}
              </div>
              <button type="submit" className="btn btn-primary mt-1" disabled={kycUploading}>
                {kycUploading ? 'Uploading…' : 'Upload Documents'}
              </button>
            </form>
          </div>
        </div>

        {/* ── RIGHT: Appointments ─────────────────────────────────────── */}
        <div style={{ flex: '2' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3>Appointments</h3>
            {appointments.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem 0' }}>
                <p className="text-muted">No appointments scheduled yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                {appointments.map((apt) => (
                  <div key={apt._id} style={{
                    border: '1px solid var(--border)', borderRadius: '0.75rem', overflow: 'hidden',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
                      <div>
                        <p style={{ fontWeight: 600 }}>{apt.userId?.name}</p>
                        <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', margin: '0.2rem 0' }}>
                          {apt.date} · {apt.time}
                        </p>
                        <p style={{ fontSize: '0.85rem' }}><strong>Reason:</strong> {apt.reason}</p>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                        <StatusPill status={apt.status} />
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {apt.status === 'pending' && (
                            <>
                              <button onClick={() => handleStatusUpdate(apt._id, 'confirmed')} className="btn btn-primary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}>Confirm</button>
                              <button onClick={() => handleStatusUpdate(apt._id, 'cancelled')} className="btn btn-danger"  style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}>Cancel</button>
                            </>
                          )}
                          {apt.status === 'confirmed' && (
                            <button onClick={() => handleStatusUpdate(apt._id, 'completed')} className="btn btn-primary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', background: '#10b981' }}>Mark Completed</button>
                          )}
                          {(apt.status === 'confirmed' || apt.status === 'completed') && (
                            <button onClick={() => setPrescriptionForm({ aptId: apt._id, prescription: apt.prescription || '', medicines: apt.medicines || [] })} className="btn btn-outline" style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}>
                              Prescribe
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Inline prescription form */}
                    {prescriptionForm?.aptId === apt._id && (
                      <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: 'var(--bg-main)' }}>
                        <h4 className="mb-1">Prescription</h4>
                        <form onSubmit={handleSubmitPrescription}>
                          <div className="form-group">
                            <label className="form-label">Notes</label>
                            <textarea className="form-control" rows="2"
                              value={prescriptionForm.prescription}
                              onChange={(e) => setPrescriptionForm((p) => ({ ...p, prescription: e.target.value }))} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.5rem 0' }}>
                            <h5>Medicines</h5>
                            <button type="button" onClick={handleAddMedicine} className="btn btn-outline" style={{ padding: '0.25rem 0.55rem', fontSize: '0.78rem' }}>+ Add</button>
                          </div>
                          {prescriptionForm.medicines.map((med, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                              <input className="form-control" placeholder="Name"    required value={med.name}      onChange={(e) => handleMedicineChange(idx, 'name',      e.target.value)} />
                              <input className="form-control" placeholder="1-0-1"   required value={med.dosage}    onChange={(e) => handleMedicineChange(idx, 'dosage',    e.target.value)} />
                              <input className="form-control" placeholder="Days"    required value={med.duration}  onChange={(e) => handleMedicineChange(idx, 'duration',  e.target.value)} type="number" style={{ width: '80px' }} />
                              <input className="form-control"                       required value={med.startDate} onChange={(e) => handleMedicineChange(idx, 'startDate', e.target.value)} type="date" />
                              <button type="button" onClick={() => handleRemoveMedicine(idx)} className="btn btn-danger" style={{ padding: '0.35rem 0.6rem', flexShrink: 0 }}>✕</button>
                            </div>
                          ))}
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
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
    </div>
  );
};

export default DoctorDashboard;

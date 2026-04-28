import { Link } from 'react-router-dom';
import { Clock, FileText, ShieldCheck } from 'lucide-react';

const PendingVerification = () => {
  return (
    <div style={{
      minHeight: '80vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '2rem',
    }}>
      <div className="card text-center" style={{ maxWidth: '520px', width: '100%', padding: '3rem 2rem' }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}>
          <Clock size={36} color="white" />
        </div>

        <h2 style={{ marginBottom: '0.5rem' }}>Account Pending Verification</h2>
        <p className="text-muted" style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
          Your doctor account has been created. An admin will review your profile and
          KYC documents before you can access the full dashboard and accept patient appointments.
        </p>

        <div style={{
          background: 'var(--bg-main)', borderRadius: '0.75rem',
          padding: '1rem', marginBottom: '1.5rem', textAlign: 'left',
        }}>
          <p style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.9rem' }}>Next steps:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {[
              { icon: <FileText size={16} />, text: 'Complete your profile in the Doctor Dashboard' },
              { icon: <ShieldCheck size={16} />, text: 'Upload your KYC documents (license, degree, hospital proof)' },
              { icon: <Clock size={16} />, text: 'Wait for admin review (usually within 24 hours)' },
            ].map(({ icon, text }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--primary)' }}>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <Link to="/doctor-dashboard" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
          Go to Dashboard & Upload Documents
        </Link>
      </div>
    </div>
  );
};

export default PendingVerification;

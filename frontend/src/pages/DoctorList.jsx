import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, IndianRupee, ShieldCheck } from 'lucide-react';
import api from '../utils/api';
import './DoctorList.css';

/* ── Skeleton placeholder card ───────────────────────── */
const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton-header">
      <div className="skeleton skeleton-avatar" />
      <div className="skeleton-header-lines">
        <div className="skeleton skeleton-line-lg" />
        <div className="skeleton skeleton-line-sm" />
      </div>
    </div>
    <div className="skeleton-body">
      <div className="skeleton skeleton-row" />
      <div className="skeleton skeleton-row" />
      <div className="skeleton skeleton-row" />
    </div>
    <div className="skeleton-footer">
      <div className="skeleton skeleton-btn" />
    </div>
  </div>
);

/* ── Main component ──────────────────────────────────── */
const DoctorList = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const { data } = await api.get('/doctors');
        setDoctors(data);
      } catch (error) {
        console.error('Failed to fetch doctors', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  return (
    <div className="doctor-list-page animate-fade-in">

      {/* ── Hero ─────────────────────────────────────── */}
      <div className="list-hero">
        <div className="container">
          <div className="list-hero-badge">🏥 Verified Specialists</div>
          <h2>Find Your Specialist</h2>
          <p>Browse through our network of highly qualified medical professionals.</p>
        </div>
      </div>

      {/* ── Grid ─────────────────────────────────────── */}
      <div className="container">
        {loading ? (
          <div className="doctors-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : doctors.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🩺</div>
            <h3>No Doctors Available</h3>
            <p>Check back soon — our network is growing every day.</p>
          </div>
        ) : (
          <div className="doctors-grid">
            {doctors.map((doctor) => {
              const name = doctor.userId?.name ?? 'Doctor';
              const initial = name.charAt(0).toUpperCase();

              return (
                <div key={doctor._id} className="doctor-card">

                  {/* Header */}
                  <div className="doctor-card-header">
                    <div className="doc-avatar-list">{initial}</div>
                    <div className="doctor-header-info">
                      <div className="doctor-name">Dr. {name}</div>
                      <div className="doctor-spec-wrap">
                        <span className="doctor-spec-badge">
                          {doctor.specialization}
                        </span>
                        {doctor.verified && (
                          <span className="doctor-verified-badge">
                            <ShieldCheck size={11} />
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="doctor-card-body">
                    <div className="doctor-info-row">
                      <Star size={15} />
                      <div>
                        <span className="info-label-txt">Experience</span>
                        <span className="info-value-txt">
                          {doctor.experience} Years
                        </span>
                      </div>
                    </div>

                    <div className="doctor-info-row">
                      <IndianRupee size={15} />
                      <div>
                        <span className="info-label-txt">Consultation Fee</span>
                        <span className="info-value-txt">
                          ₹{doctor.consultationFee}
                        </span>
                      </div>
                    </div>

                    <div className="doctor-info-row">
                      <Clock size={15} />
                      <div>
                        <span className="info-label-txt">Available Timing</span>
                        <span className="info-value-txt">
                          {doctor.availableTiming?.start} – {doctor.availableTiming?.end}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="doctor-card-footer">
                    <Link
                      to={`/doctors/${doctor._id}`}
                      className="btn-book"
                    >
                      Book Appointment →
                    </Link>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default DoctorList;

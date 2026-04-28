import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, DollarSign, ShieldCheck } from 'lucide-react';
import api from '../utils/api';
import './DoctorList.css';

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
    <div className="doctor-list-page container animate-fade-in">
      <div className="mt-2 mb-2 text-center">
        <h2>Find Your Specialist</h2>
        <p className="text-muted">Browse through our extensive list of highly qualified medical professionals.</p>
      </div>

      {loading ? (
        <div className="text-center mt-2"><p>Loading doctors...</p></div>
      ) : doctors.length === 0 ? (
        <div className="text-center mt-2"><p>No doctors available at the moment.</p></div>
      ) : (
        <div className="doctors-grid">
          {doctors.map((doctor) => (
            <div key={doctor._id} className="doctor-card card">
              <div className="doctor-card-header">
                <div>
                  <h3 className="doctor-name">Dr. {doctor.userId?.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <p className="doctor-spec badge badge-success">{doctor.specialization}</p>
                    {doctor.verified && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                        background: 'rgba(16,185,129,0.12)', color: '#10b981',
                        fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.5rem',
                        borderRadius: '999px', border: '1px solid rgba(16,185,129,0.3)',
                      }}>
                        <ShieldCheck size={11} /> Verified Doctor
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="doctor-card-body">
                <div className="doctor-info-row">
                  <Star size={16} className="text-muted" />
                  <span>{doctor.experience} Years Experience</span>
                </div>
                <div className="doctor-info-row">
                  <DollarSign size={16} className="text-muted" />
                  <span>Fee: ${doctor.consultationFee}</span>
                </div>
                <div className="doctor-info-row">
                  <Clock size={16} className="text-muted" />
                  <span>{doctor.availableTiming?.start} - {doctor.availableTiming?.end}</span>
                </div>
              </div>
              <div className="doctor-card-footer">
                <Link to={`/doctors/${doctor._id}`} className="btn btn-outline" style={{width: '100%'}}>
                  View Profile & Book
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorList;

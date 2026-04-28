import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, DollarSign } from 'lucide-react';
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
                  <p className="doctor-spec badge badge-success">{doctor.specialization}</p>
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

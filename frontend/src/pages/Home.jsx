import { Link } from 'react-router-dom';
import { Calendar, UserCheck, Shield } from 'lucide-react';
import './Home.css';

const Home = () => {
  return (
    <div className="home-page animate-fade-in">
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Your Health, <br />
              <span className="text-gradient">Our Priority.</span>
            </h1>
            <p className="hero-subtitle">
              Book appointments with top doctors instantly. Experience seamless healthcare management with HealthConnect.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                Get Started
              </Link>
              <Link to="/doctors" className="btn btn-outline btn-lg">
                Find a Doctor
              </Link>
            </div>
          </div>
          <div className="hero-image-wrapper">
            <div className="hero-image-placeholder glass-panel">
              <div className="floating-card card-1 shadow-glass">
                <UserCheck size={24} className="icon-success" />
                <div>
                  <h4>10k+</h4>
                  <p>Happy Patients</p>
                </div>
              </div>
              <div className="floating-card card-2 shadow-glass">
                <Calendar size={24} className="icon-primary" />
                <div>
                  <h4>Easy</h4>
                  <p>Scheduling</p>
                </div>
              </div>
              <img src="https://images.unsplash.com/photo-1638202993928-7267aad84c31?q=80&w=600&auto=format&fit=crop" alt="Doctor" className="hero-img" />
            </div>
          </div>
        </div>
      </section>

      <section className="features-section container">
        <div className="text-center mb-2">
          <h2>Why Choose HealthConnect?</h2>
          <p className="text-muted">We provide the best tools to manage your health efficiently.</p>
        </div>
        <div className="features-grid">
          <div className="feature-card card">
            <div className="feature-icon-wrapper">
              <Shield className="feature-icon" />
            </div>
            <h3>Secure & Private</h3>
            <p>Your data is encrypted and completely secure. We value your privacy.</p>
          </div>
          <div className="feature-card card">
            <div className="feature-icon-wrapper">
              <Calendar className="feature-icon" />
            </div>
            <h3>Instant Booking</h3>
            <p>Skip the waiting room. Book your appointment in less than a minute.</p>
          </div>
          <div className="feature-card card">
            <div className="feature-icon-wrapper">
              <UserCheck className="feature-icon" />
            </div>
            <h3>Expert Doctors</h3>
            <p>Consult with the highly experienced and specialized professionals.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

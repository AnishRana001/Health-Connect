import { Link } from 'react-router-dom';
import {
  Activity,
  Award,
  Users,
  Zap,
  Heart,
  Shield,
  Calendar,
  Star,
  ArrowRight,
  CheckCircle,
  UserCheck,
} from 'lucide-react';
import './Home.css';

const features = [
  {
    icon: Shield,
    title: 'Secure & Private',
    desc: 'End-to-end encrypted records. Your data never leaves our HIPAA-compliant infrastructure.',
  },
  {
    icon: Zap,
    title: 'Instant Booking',
    desc: 'Skip the waiting room. Book a confirmed appointment in under 60 seconds, any time of day.',
  },
  {
    icon: Award,
    title: 'Expert Doctors',
    desc: 'Every specialist on HealthConnect is board-certified and peer-reviewed by our medical team.',
  },
  {
    icon: Activity,
    title: '24/7 Support',
    desc: 'Round-the-clock care navigation with live chat, call-back, and urgent-care triage.',
  },
  {
    icon: Heart,
    title: 'Prescription Tracking',
    desc: 'Real-time prescription status, refill reminders, and pharmacy sync — all in one dashboard.',
  },
  {
    icon: CheckCircle,
    title: 'Verified Profiles',
    desc: 'Every doctor profile is manually verified with license numbers, ratings, and patient reviews.',
  },
];

const Home = () => {
  return (
    <div className="home-page animate-fade-in">

      {/* ──────────────────────────────────────────────
          HERO
      ────────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="container hero-container">

          {/* ── Left: copy ── */}
          <div className="hero-content">
            <div className="hero-eyebrow">💊 Trusted by 10,000+ Patients</div>

            <h1 className="hero-title">
              Your Health,{' '}<br />
              <span className="text-gradient">Our Priority.</span>
            </h1>

            <p className="hero-subtitle">
              Book appointments with top-rated doctors instantly.
              Experience seamless, world-class healthcare management
              with HealthConnect.
            </p>

            <div className="hero-actions">
              <Link to="/register" className="btn-hero-primary">
                Get Started Free <ArrowRight size={18} />
              </Link>
              <Link to="/doctors" className="btn-hero-outline">
                Find a Doctor
              </Link>
            </div>

            {/* Stats strip */}
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-num">500+</span>
                <span className="hero-stat-label">Doctors</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-num">10K+</span>
                <span className="hero-stat-label">Patients</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-num">4.9★</span>
                <span className="hero-stat-label">Rating</span>
              </div>
            </div>
          </div>

          {/* ── Right: image ── */}
          <div className="hero-image-wrapper">
            <div className="hero-image-placeholder">
              {/* Floating card — top-left */}
              <div className="floating-card card-1">
                <UserCheck size={24} className="icon-success" />
                <div>
                  <h4>10K+</h4>
                  <p>Happy Patients</p>
                </div>
              </div>

              {/* Floating card — bottom-right */}
              <div className="floating-card card-2">
                <Calendar size={24} className="icon-primary" />
                <div>
                  <h4>Easy</h4>
                  <p>Scheduling</p>
                </div>
              </div>

              <img
                src="https://images.unsplash.com/photo-1638202993928-7267aad84c31?q=80&w=600&auto=format&fit=crop"
                alt="Doctor consultation"
                className="hero-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          FEATURES
      ────────────────────────────────────────────── */}
      <section className="features-section">
        <div className="features-section-inner">
          <div className="section-header">
            <span className="section-tag">✨ Why HealthConnect</span>
            <h2 className="section-title">Everything you need,<br />in one place</h2>
            <p className="section-subtitle">
              We provide the best tools to manage your health efficiently —
              from booking to billing, all under one roof.
            </p>
          </div>

          <div className="features-grid">
            {features.map(({ icon: Icon, title, desc }) => (
              <div className="feature-card" key={title}>
                <div className="feature-icon-wrapper">
                  <Icon className="feature-icon" />
                </div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────
          CTA
      ────────────────────────────────────────────── */}
      <section className="cta-section">
        <div className="container">
          <h2 className="cta-title">Ready to take control of your health?</h2>
          <p className="cta-sub">
            Join thousands of patients who trust HealthConnect for their care.
          </p>
          <Link
            to="/register"
            className="btn-hero-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
          >
            Get Started Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

    </div>
  );
};

export default Home;


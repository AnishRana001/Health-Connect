import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, AlertCircle, Eye, EyeOff, User, Mail, Lock, ChevronDown } from 'lucide-react';
import './Auth.css';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'doctor') navigate('/pending-verification');
      else if (user.role === 'admin') navigate('/admin-dashboard');
      else navigate('/patient-dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return setError('Please fill all fields');
    setError('');
    setLoading(true);
    try {
      await register(name, email, password, role);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Ambient background orbs */}
      <div className="auth-orb auth-orb--1" />
      <div className="auth-orb auth-orb--2" />
      <div className="auth-orb auth-orb--3" />

      <div className="auth-container">
        <div className="auth-card animate-fade-in">

          {/* Logo */}
          <div className="auth-logo-wrap">
            <div className="auth-logo-icon">
              <Stethoscope size={28} color="white" strokeWidth={2} />
            </div>
            <span className="auth-logo-label">HealthConnect</span>
          </div>

          {/* Header */}
          <div className="auth-header">
            <h2>Create account</h2>
            <p>Join HealthConnect today — it's free</p>
          </div>

          {/* Error */}
          {error && (
            <div className="auth-error">
              <AlertCircle size={16} strokeWidth={2} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-icon-wrap">
                <span className="input-icon input-icon--left">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  className="form-control form-control--icon-left"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-icon-wrap">
                <span className="input-icon input-icon--left">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  className="form-control form-control--icon-left"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yours@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-icon-wrap">
                <span className="input-icon input-icon--left">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control form-control--icon-left form-control--icon-right"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="input-icon input-icon--right input-icon--btn"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">I am a</label>
              <div className="input-icon-wrap">
                <span className="input-icon input-icon--left">
                  <Stethoscope size={16} />
                </span>
                <select
                  className="form-control form-control--icon-left form-control--select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="patient">Patient — I need care</option>
                  <option value="doctor">Doctor — I provide care</option>
                </select>
                <span className="input-icon input-icon--right input-icon--static">
                  <ChevronDown size={16} />
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="auth-spinner" />
                  Creating account…
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <p className="auth-footer">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Register;

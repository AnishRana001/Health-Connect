import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, AlertCircle, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.role === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError('Please fill all fields');
    setError('');
    setLoading(true);
    try {
      await login(email, password);
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
            <h2>Welcome back</h2>
            <p>Sign in to your HealthConnect account</p>
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
                  autoComplete="current-password"
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

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="auth-spinner" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <p className="auth-footer">
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Create one free
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Login;

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, LogOut, LayoutDashboard, ShieldCheck } from 'lucide-react';
import './Navbar.css';

const getDashboardPath = (role) => {
  if (role === 'admin') return '/admin-dashboard';
  if (role === 'doctor') return '/doctor-dashboard';
  return '/patient-dashboard';
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className={`navbar glass-panel${scrolled ? ' scrolled' : ''}`}>
      <div className="container navbar-container">

        {/* ── Logo ─────────────────────────────────────────── */}
        <Link to="/" className="navbar-logo">
          <Stethoscope className="nav-icon" />
          <span className="navbar-logo-text">
            Health<span className="navbar-logo-accent">Connect</span>
          </span>
        </Link>

        {/* ── Nav Links ────────────────────────────────────── */}
        <ul className="navbar-links">
          {!user ? (
            <>
              <li>
                <Link to="/doctors" className="navbar-link-btn">
                  Find Doctors
                </Link>
              </li>
              <li>
                <Link to="/login" className="btn btn-outline">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="btn btn-primary">
                  Sign Up
                </Link>
              </li>
            </>
          ) : (
            <>
              {/* User greeting with avatar */}
              <li>
                <span className="navbar-user">
                  <span
                    className="nav-user-avatar"
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
                      color: 'white',
                      fontSize: '0.78rem',
                      fontWeight: '800',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                  </span>
                  &nbsp;Hi,&nbsp;
                  <span className="navbar-user-name">{user.name}</span>
                </span>
              </li>

              {/* Dashboard link */}
              <li>
                <Link
                  to={getDashboardPath(user.role)}
                  className="btn btn-outline"
                >
                  {user.role === 'admin' ? (
                    <>
                      <ShieldCheck size={16} />
                      &nbsp;Admin Panel
                    </>
                  ) : (
                    <>
                      <LayoutDashboard size={16} />
                      &nbsp;Dashboard
                    </>
                  )}
                </Link>
              </li>

              {/* Logout */}
              <li>
                <button onClick={handleLogout} className="btn nav-logout">
                  <LogOut size={16} />
                  &nbsp;Logout
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;

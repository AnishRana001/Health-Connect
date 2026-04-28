import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, LogOut, User as UserIcon, ShieldCheck } from 'lucide-react';
import './Navbar.css';

const getDashboardPath = (role) => {
  if (role === 'admin') return '/admin-dashboard';
  if (role === 'doctor') return '/doctor-dashboard';
  return '/patient-dashboard';
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar glass-panel">
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">
          <Stethoscope className="nav-icon" />
          <span>HealthConnect</span>
        </Link>
        <ul className="navbar-links">
          {!user ? (
            <>
              <li><Link to="/login" className="btn btn-outline">Login</Link></li>
              <li><Link to="/register" className="btn btn-primary">Sign Up</Link></li>
            </>
          ) : (
            <>
              <li>
                <span className="navbar-user">
                  {user.role === 'admin' ? <ShieldCheck size={18} /> : <UserIcon size={18} />}
                  &nbsp;Hi, {user.name}
                </span>
              </li>
              <li>
                <Link to={getDashboardPath(user.role)} className="btn btn-outline">
                  {user.role === 'admin' ? 'Admin Panel' : 'Dashboard'}
                </Link>
              </li>
              <li>
                <button onClick={handleLogout} className="btn nav-logout">
                  <LogOut size={18} /> Logout
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

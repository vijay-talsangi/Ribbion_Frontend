import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Plus, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setProfileDropdown(false);
    navigate('/');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">R</div>
          <span className="logo-text">Ribbion</span>
        </Link>

        {/* Search Bar — Desktop */}
        <form className="navbar-search" onSubmit={handleSearch}>
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            id="search-input"
          />
        </form>

        {/* Right Actions */}
        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              <Link to="/ask" className="btn btn-primary btn-sm ask-btn" id="ask-question-btn">
                <Plus /> Ask Question
              </Link>

              <div className="profile-wrapper" ref={dropdownRef}>
                <button
                  className="avatar-btn"
                  onClick={() => setProfileDropdown(!profileDropdown)}
                  id="profile-btn"
                >
                  <div className="avatar">
                    {getInitials(user?.displayName || user?.username || 'U')}
                  </div>
                </button>

                {profileDropdown && (
                  <div className="profile-dropdown animate-fade-in">
                    <div className="dropdown-header">
                      <p className="dropdown-name">{user?.displayName || user?.username}</p>
                      <p className="dropdown-rep">{user?.reputation} reputation</p>
                    </div>
                    <div className="dropdown-divider" />
                    <Link to={`/users/${user?.id}`} className="dropdown-item" onClick={() => setProfileDropdown(false)}>
                      <User /> Profile
                    </Link>
                    <Link to="/settings" className="dropdown-item" onClick={() => setProfileDropdown(false)}>
                      <Settings /> Settings
                    </Link>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
                      <LogOut /> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="auth-btns">
              <Link to="/login" className="btn btn-ghost btn-sm" id="login-btn">Log In</Link>
              <Link to="/register" className="btn btn-primary btn-sm" id="register-btn">Sign Up</Link>
            </div>
          )}

          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu animate-fade-in">
          <form className="mobile-search" onSubmit={handleSearch}>
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </form>
          <div className="mobile-links">
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link to="/tags" onClick={() => setMobileMenuOpen(false)}>Tags</Link>
            {isAuthenticated ? (
              <>
                <Link to="/ask" onClick={() => setMobileMenuOpen(false)}>Ask Question</Link>
                <Link to={`/users/${user?.id}`} onClick={() => setMobileMenuOpen(false)}>Profile</Link>
                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Log In</Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

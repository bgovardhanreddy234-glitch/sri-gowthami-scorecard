import React, { useEffect, useState } from 'react';
import { Menu, Sun, Moon } from 'lucide-react';

const TopNavbar = ({ user, setSidebarOpen, sidebarOpen }) => {
  const [theme, setTheme] = useState(localStorage.getItem('sgi_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sgi_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <button
          className="menu-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle Menu"
        >
          <Menu size={22} />
        </button>
        <h2 style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.3px' }}>
          Sri Gowthami Educational Institutions
        </h2>
      </div>

      <div className="navbar-right">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title="Toggle Light/Dark Theme"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {user && (
          <div className="user-profile">
            <div className="user-avatar">
              {getInitials(user.faculty ? user.faculty.name : user.username)}
            </div>
            <div className="user-info">
              <span className="user-name">
                {user.name || (user.faculty ? user.faculty.name : (user.studentProfile ? user.studentProfile.name : user.username))}
              </span>
              <span className="user-role">
                {user.role} {user.faculty?.department ? `• ${user.faculty.department.code}` : ''}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopNavbar;

import React from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Award, 
  BarChart3, 
  ShieldAlert, 
  LogOut,
  Star,
  Users,
  GraduationCap,
  UserCheck,
  Building2,
  Bell,
  User,
  BookOpen,
  Calendar
} from 'lucide-react';
import { logoutUser } from '../utils/api';

const Sidebar = ({ currentTab, setCurrentTab, user, onLogout, sidebarOpen, setSidebarOpen }) => {
  const handleLinkClick = (tab) => {
    setCurrentTab(tab);
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    onLogout();
  };

  const isAdmin = user && user.role === 'Admin';
  const isHOD = user && user.role === 'HOD';
  const isFaculty = user && user.role === 'Faculty';
  const isStudent = user && user.role === 'Student';

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          Sri Gowthami
          <span className="subtitle">Performance Portal</span>
        </div>
      </div>

      <ul className="sidebar-menu" style={{ overflowY: 'auto' }}>
        {/* Dashboard */}
        {!isStudent && (
          <li className="sidebar-item">
            <a 
              className={`sidebar-link ${currentTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleLinkClick('dashboard')}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </a>
          </li>
        )}

        {/* Rate Faculty (Student Only) */}
        {isStudent && (
          <li className="sidebar-item">
            <a 
              className={`sidebar-link ${currentTab === 'rate-faculty' ? 'active' : ''}`}
              onClick={() => handleLinkClick('rate-faculty')}
            >
              <Star size={18} />
              <span>Rate Faculty</span>
            </a>
          </li>
        )}

        {/* Scorecard */}
        {!isStudent && (
          <li className="sidebar-item">
            <a 
              className={`sidebar-link ${currentTab === 'records' ? 'active' : ''}`}
              onClick={() => handleLinkClick('records')}
            >
              <Award size={18} />
              <span>Scorecard</span>
            </a>
          </li>
        )}

        {/* Faculty Attendance Portal (Faculty only) */}
        {isFaculty && (
          <li className="sidebar-item">
            <a 
              className={`sidebar-link ${currentTab === 'my-attendance' ? 'active' : ''}`}
              onClick={() => handleLinkClick('my-attendance')}
            >
              <Calendar size={18} />
              <span>My Attendance</span>
            </a>
          </li>
        )}

        {/* Score Entry (HOD / Admin) */}
        {(isAdmin || isHOD) && (
          <li className="sidebar-item">
            <a 
              className={`sidebar-link ${currentTab === 'entry' ? 'active' : ''}`}
              onClick={() => handleLinkClick('entry')}
            >
              <PlusCircle size={18} />
              <span>Score Entry Form</span>
            </a>
          </li>
        )}

        {/* Reports & Analytics (HOD / Admin) */}
        {(isAdmin || isHOD) && (
          <li className="sidebar-item">
            <a 
              className={`sidebar-link ${currentTab === 'analytics' ? 'active' : ''}`}
              onClick={() => handleLinkClick('analytics')}
            >
              <BarChart3 size={18} />
              <span>Reports & Analytics</span>
            </a>
          </li>
        )}

        {/* Faculty Attendance Management (Admin only) */}
        {isAdmin && (
          <li className="sidebar-item">
            <a 
              className={`sidebar-link ${currentTab === 'mark-attendance' ? 'active' : ''}`}
              onClick={() => handleLinkClick('mark-attendance')}
            >
              <Calendar size={18} />
              <span>Faculty Attendance</span>
            </a>
          </li>
        )}

        {/* --- Admin Only Section --- */}
        {isAdmin && (
          <>
            <li className="sidebar-item" style={{ marginTop: 16, paddingLeft: 16, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Directory CRUD
            </li>
            <li className="sidebar-item">
              <a 
                className={`sidebar-link ${currentTab === 'faculty-mgmt' ? 'active' : ''}`}
                onClick={() => handleLinkClick('faculty-mgmt')}
              >
                <Users size={18} />
                <span>Faculty Directory</span>
              </a>
            </li>
            <li className="sidebar-item">
              <a 
                className={`sidebar-link ${currentTab === 'student-mgmt' ? 'active' : ''}`}
                onClick={() => handleLinkClick('student-mgmt')}
              >
                <GraduationCap size={18} />
                <span>Student Directory</span>
              </a>
            </li>
            <li className="sidebar-item">
              <a 
                className={`sidebar-link ${currentTab === 'hod-mgmt' ? 'active' : ''}`}
                onClick={() => handleLinkClick('hod-mgmt')}
              >
                <UserCheck size={18} />
                <span>HOD Directory</span>
              </a>
            </li>
            <li className="sidebar-item">
              <a 
                className={`sidebar-link ${currentTab === 'dept-mgmt' ? 'active' : ''}`}
                onClick={() => handleLinkClick('dept-mgmt')}
              >
                <Building2 size={18} />
                <span>Departments</span>
              </a>
            </li>
            <li className="sidebar-item">
              <a 
                className={`sidebar-link ${currentTab === 'course-mgmt' ? 'active' : ''}`}
                onClick={() => handleLinkClick('course-mgmt')}
              >
                <BookOpen size={18} />
                <span>Courses Directory</span>
              </a>
            </li>
          </>
        )}

        {/* Notifications & Alerts (Admin / HOD) */}
        {(isAdmin || isHOD) && (
          <li className="sidebar-item">
            <a 
              className={`sidebar-link ${currentTab === 'notifications' ? 'active' : ''}`}
              onClick={() => handleLinkClick('notifications')}
            >
              <Bell size={18} />
              <span>Alerts & Notifications</span>
            </a>
          </li>
        )}

        {/* Audit Logs (Admin Only) */}
        {isAdmin && (
          <li className="sidebar-item">
            <a 
              className={`sidebar-link ${currentTab === 'audits' ? 'active' : ''}`}
              onClick={() => handleLinkClick('audits')}
            >
              <ShieldAlert size={18} />
              <span>Audit Logs</span>
            </a>
          </li>
        )}

        {/* Faculty & Classes (All Roles Directory) */}
        <li className="sidebar-item">
          <a 
            className={`sidebar-link ${currentTab === 'dept-faculty-classes' ? 'active' : ''}`}
            onClick={() => handleLinkClick('dept-faculty-classes')}
            id="sidebar-academic-directory"
          >
            <BookOpen size={18} />
            <span>Faculty & Classes</span>
          </a>
        </li>

        {/* Profile (All Roles) */}
        <li className="sidebar-item">
          <a 
            className={`sidebar-link ${currentTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleLinkClick('profile')}
          >
            <User size={18} />
            <span>My Profile</span>
          </a>
        </li>
      </ul>

      <div className="sidebar-footer">
        <a className="sidebar-link" onClick={handleLogout} style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.08)', borderRadius: 0, paddingLeft: 8 }}>
          <LogOut size={18} />
          <span>Sign Out</span>
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;

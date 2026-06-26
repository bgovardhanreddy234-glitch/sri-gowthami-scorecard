import { useEffect, useState } from 'react'
import './App.css'
import Sidebar from './components/Sidebar'
import TopNavbar from './components/TopNavbar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ScorecardTable from './pages/ScorecardTable'
import EntryForm from './pages/EntryForm'
import FacultyDetail from './pages/FacultyDetail'
import Analytics from './pages/Analytics'
import AuditLogs from './pages/AuditLogs'
import RateFaculty from './pages/RateFaculty'
import FacultyMgmt from './pages/FacultyMgmt'
import StudentMgmt from './pages/StudentMgmt'
import HODMgmt from './pages/HODMgmt'
import DeptMgmt from './pages/DeptMgmt'
import CourseMgmt from './pages/CourseMgmt'
import NotificationsPage from './pages/NotificationsPage'
import Profile from './pages/Profile'
import DeptFacultyClasses from './pages/DeptFacultyClasses'
import FacultyAttendanceMarking from './pages/FacultyAttendanceMarking'
import FacultyAttendancePortal from './pages/FacultyAttendancePortal'
import { getSavedUser, logoutUser } from './utils/api'

function App() {
  const [user, setUser] = useState(null)
  const [currentTab, setCurrentTab] = useState('dashboard')
  const [recordId, setRecordId] = useState(null)
  const [selectedFacultyId, setSelectedFacultyId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768)

  useEffect(() => {
    const savedUser = getSavedUser()
    if (savedUser) {
      setUser(savedUser)
      setCurrentTab(savedUser.role === 'Student' ? 'rate-faculty' : 'dashboard')
    } else {
      setCurrentTab('login')
    }
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(true)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleLoginSuccess = (newUser) => {
    setUser(newUser)
    setCurrentTab(newUser.role === 'Student' ? 'rate-faculty' : 'dashboard')
  }

  const handleLogout = () => {
    logoutUser()
    setUser(null)
    setCurrentTab('login')
    setRecordId(null)
    setSelectedFacultyId(null)
  }

  const renderPage = () => {
    if (!user) {
      return <Login onLoginSuccess={handleLoginSuccess} />
    }

    switch (currentTab) {
      case 'dashboard':
        return <Dashboard user={user} setCurrentTab={setCurrentTab} setSelectedFacultyId={setSelectedFacultyId} />
      case 'records':
        return (
          <ScorecardTable
            user={user}
            setCurrentTab={setCurrentTab}
            setRecordId={setRecordId}
            setSelectedFacultyId={setSelectedFacultyId}
          />
        )
      case 'entry':
        return (
          <EntryForm
            user={user}
            recordId={recordId}
            setRecordId={setRecordId}
            setCurrentTab={setCurrentTab}
          />
        )
      case 'rate-faculty':
        return <RateFaculty user={user} setCurrentTab={setCurrentTab} />
      case 'faculty-mgmt':
        return <FacultyMgmt />
      case 'student-mgmt':
        return <StudentMgmt />
      case 'hod-mgmt':
        return <HODMgmt />
      case 'dept-mgmt':
        return <DeptMgmt />
      case 'course-mgmt':
        return <CourseMgmt />
      case 'notifications':
        return <NotificationsPage />
      case 'dept-faculty-classes':
        return <DeptFacultyClasses user={user} />
      case 'mark-attendance':
        return <FacultyAttendanceMarking user={user} />
      case 'my-attendance':
        return <FacultyAttendancePortal user={user} />
      case 'profile':
        return <Profile user={user} />
      case 'detail':
        return <FacultyDetail facultyId={selectedFacultyId} setCurrentTab={setCurrentTab} />
      case 'analytics':
        return <Analytics />
      case 'audits':
        return <AuditLogs />
      default:
        return <Dashboard user={user} setCurrentTab={setCurrentTab} setSelectedFacultyId={setSelectedFacultyId} />
    }
  }

  if (!user) {
    return <div className="app-login-shell">{renderPage()}</div>
  }

  return (
    <div className={`app-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        user={user}
        onLogout={handleLogout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="main-panel">
        <TopNavbar user={user} setSidebarOpen={setSidebarOpen} sidebarOpen={sidebarOpen} />
        <div className="content-wrapper">{renderPage()}</div>
      </div>
    </div>
  )
}

export default App

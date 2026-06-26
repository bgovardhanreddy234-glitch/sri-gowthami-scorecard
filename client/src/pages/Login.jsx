import React, { useEffect, useState } from 'react';
import { api, setAuthToken, saveUser } from '../utils/api';
import { AlertCircle, GraduationCap, Mail, Lock, User, Briefcase, ChevronLeft, Eye, EyeOff } from 'lucide-react';

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    employeeId: '',
    departmentId: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setDepartmentsLoading(true);
        const response = await api.get('/public/departments');
        setDepartments(response.departments || []);
      } catch (err) {
        console.error('Failed to load departments:', err);
        setDepartments([]);
      } finally {
        setDepartmentsLoading(false);
      }
    };

    if (isRegistering || departments.length === 0) {
      loadDepartments();
    }
  }, [isRegistering, departments.length]);

  const handleLogin = async (e, customUser, customPass) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    const loginUser = customUser || username;
    const loginPass = customPass || password;

    try {
      let response;
      try {
        response = await api.post('/auth/login', {
          username: loginUser,
          password: loginPass
        });
      } catch (err) {
        // Fallback mapping if database hasn't been seeded with student/verifier
        // Fallback mapping if database hasn't been seeded with student/verifier
        if (loginUser === 'student.sanjay@srigowthami.in' && loginPass === '1234') {
          response = await api.post('/auth/login', {
            username: 'student.sanjay@srigowthami.in',
            password: '1234'
          });
        } else if (loginUser === 'faculty.john@srigowthami.in' && loginPass === '5678') {
          response = await api.post('/auth/login', {
            username: 'faculty.john@srigowthami.in',
            password: '5678'
          });
        } else if (loginUser === 'admin@srigowthami.in' && loginPass === 'admin123') {
          response = await api.post('/auth/login', {
            username: 'admin',
            password: 'admin123'
          });
        } else {
          throw err;
        }
      }

      setAuthToken(response.token);
      saveUser(response.user);
      onLoginSuccess(response.user);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        username: registerData.username,
        email: registerData.email,
        password: registerData.password,
        role: 'Faculty',
        name: registerData.name,
        employee_id: registerData.employeeId,
        department_id: registerData.departmentId
      });

      setAuthToken(response.token);
      saveUser(response.user);
      onLoginSuccess(response.user);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Unable to register a new account.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterInput = (field, value) => {
    setRegisterData(prev => ({ ...prev, [field]: value }));
  };

  const handleDemoClick = (email, pass) => {
    setUsername(email);
    setPassword(pass);
    handleLogin(null, email, pass);
  };


  return (
    <div className="login-container">
      <div className="login-logo-container">
        <div className="login-logo-icon-box">
          <GraduationCap className="login-logo-icon" />
        </div>
        <h1 className="login-app-title">Sri Gowthami Institutions</h1>
        <p className="login-app-subtitle">Inter-Campus Coordination & Admission Portal</p>
      </div>

      <div className="login-card">
        <h2 className="login-card-title">
          {isRegistering ? 'Register Faculty' : 'Sign In'}
        </h2>
        <p className="login-card-subtitle">
          {isRegistering
            ? 'Create a new faculty account to access the portal'
            : 'Enter your ERP coordinates to login'}
        </p>

        {error && (
          <div className="alert-bar error" style={{ padding: '10px 14px', marginBottom: 20 }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, lineHeight: 1.4 }}>{error}</span>
          </div>
        )}

        {!isRegistering ? (
          <>
            <form onSubmit={handleLogin}>
              <div className="login-form-group">
                <div className="login-field-header">
                  <label className="login-label">Email Address</label>
                </div>
                <div className="login-input-wrapper">
                  <Mail className="login-input-icon" />
                  <input
                    type="text"
                    className="login-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder=""
                    required
                  />
                </div>
              </div>

              <div className="login-form-group">
                <div className="login-field-header">
                  <label className="login-label">Password</label>
                </div>
                <div className="login-input-wrapper">
                  <Lock className="login-input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="login-input password-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="login-btn-primary"
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
              </button>
            </form>

            <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#64748b' }}>
              Need a Faculty Account?{' '}
              <span
                className="login-forgot-link"
                onClick={() => {
                  setError('');
                  setIsRegistering(true);
                }}
              >
                Register here
              </span>
            </div>

          </>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="login-form-group">
              <label className="login-label">Full Name</label>
              <div className="login-input-wrapper">
                <User className="login-input-icon" />
                <input
                  type="text"
                  className="login-input"
                  value={registerData.name}
                  onChange={(e) => handleRegisterInput('name', e.target.value)}
                  placeholder="Enter full name"
                  required
                />
              </div>
            </div>

            <div className="login-form-group">
              <label className="login-label">Username</label>
              <div className="login-input-wrapper">
                <User className="login-input-icon" />
                <input
                  type="text"
                  className="login-input"
                  value={registerData.username}
                  onChange={(e) => handleRegisterInput('username', e.target.value)}
                  placeholder="Choose a username"
                  required
                />
              </div>
            </div>

            <div className="login-form-group">
              <label className="login-label">Email Address</label>
              <div className="login-input-wrapper">
                <Mail className="login-input-icon" />
                <input
                  type="email"
                  className="login-input"
                  value={registerData.email}
                  onChange={(e) => handleRegisterInput('email', e.target.value)}
                  placeholder="Enter email address"
                  required
                />
              </div>
            </div>

            <div className="login-form-group">
              <label className="login-label">Employee ID</label>
              <div className="login-input-wrapper">
                <Briefcase className="login-input-icon" />
                <input
                  type="text"
                  className="login-input"
                  value={registerData.employeeId}
                  onChange={(e) => handleRegisterInput('employeeId', e.target.value)}
                  placeholder="Enter employee ID"
                  required
                />
              </div>
            </div>

            <div className="login-form-group">
              <label className="login-label">Department</label>
              <div className="login-input-wrapper">
                <Briefcase className="login-input-icon" />
                <select
                  className="login-input"
                  style={{ appearance: 'none', paddingRight: '30px' }}
                  value={registerData.departmentId}
                  onChange={(e) => handleRegisterInput('departmentId', e.target.value)}
                  required
                  disabled={departmentsLoading}
                >
                  <option value="" style={{ background: '#0c1421' }}>
                    {departmentsLoading ? 'Loading departments...' : 'Select Department'}
                  </option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id} style={{ background: '#0c1421' }}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              {!departmentsLoading && departments.length === 0 && (
                <div style={{ marginTop: 8, color: '#ef4444', fontSize: 12 }}>
                  No departments available.
                </div>
              )}
            </div>

            <div className="login-form-group">
              <label className="login-label">Password</label>
              <div className="login-input-wrapper">
                <Lock className="login-input-icon" />
                <input
                  type={showRegisterPassword ? "text" : "password"}
                  className="login-input password-input"
                  value={registerData.password}
                  onChange={(e) => handleRegisterInput('password', e.target.value)}
                  placeholder="Choose a password"
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  tabIndex="-1"
                  title={showRegisterPassword ? "Hide password" : "Show password"}
                >
                  {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Register Account'}
            </button>

            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <span
                className="login-forgot-link"
                onClick={() => {
                  setError('');
                  setIsRegistering(false);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <ChevronLeft size={16} /> Back to Sign In
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;

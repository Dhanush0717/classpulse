import React, { useState, useEffect, useRef } from 'react';
import { 
  BrowserRouter, Routes, Route, Link, useNavigate, useParams, Navigate
} from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
  Users, BookOpen, Clock, MapPin, CheckCircle, XCircle, AlertTriangle, 
  ArrowRight, LogOut, Copy, RefreshCw, Star, MessageSquare, Play, Eye, ClipboardCheck,
  Upload, HelpCircle, FileText, Send, Sparkles, Sun, Moon
} from 'lucide-react';

axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

const copyToClipboard = (text, callback) => {
  navigator.clipboard.writeText(text).then(() => {
    if (callback) callback();
  });
};

function App() {
  const [teacher, setTeacher] = useState(() => {
    const saved = localStorage.getItem('teacher');
    return saved ? JSON.parse(saved) : null;
  });

  const [student, setStudent] = useState(() => {
    const saved = localStorage.getItem('student');
    return saved ? JSON.parse(saved) : null;
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const teacherToken = localStorage.getItem('teacherToken');
    const studentToken = localStorage.getItem('studentToken');
    
    if (teacherToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${teacherToken}`;
    } else if (studentToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${studentToken}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [teacher, student]);

  const handleTeacherLogout = () => {
    localStorage.removeItem('teacher');
    localStorage.removeItem('teacherToken');
    setTeacher(null);
  };

  const handleStudentLogout = () => {
    localStorage.removeItem('student');
    localStorage.removeItem('studentToken');
    setStudent(null);
  };

  return (
    <BrowserRouter>
      <Navbar 
        teacher={teacher} 
        student={student} 
        onTeacherLogout={handleTeacherLogout} 
        onStudentLogout={handleStudentLogout} 
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          
          {/* Teacher Routes */}
          <Route 
            path="/teacher/login" 
            element={teacher ? <Navigate to="/teacher/dashboard" /> : <TeacherLogin onLogin={(t, token) => {
              localStorage.setItem('teacher', JSON.stringify(t));
              localStorage.setItem('teacherToken', token);
              setTeacher(t);
            }} />} 
          />
          <Route 
            path="/teacher/register" 
            element={teacher ? <Navigate to="/teacher/dashboard" /> : <TeacherRegister />} 
          />
          <Route 
            path="/teacher/dashboard" 
            element={teacher ? <TeacherDashboard teacher={teacher} /> : <Navigate to="/teacher/login" />} 
          />
          <Route 
            path="/teacher/session/:sessionId" 
            element={teacher ? <TeacherSessionView /> : <Navigate to="/teacher/login" />} 
          />

          {/* Student Routes */}
          <Route 
            path="/student/join" 
            element={student ? <Navigate to="/student/session" /> : <StudentJoin onJoin={(s, token) => {
              localStorage.setItem('student', JSON.stringify(s));
              localStorage.setItem('studentToken', token);
              setStudent(s);
            }} />} 
          />
          <Route 
            path="/student/session" 
            element={student ? <StudentSession student={student} onLogout={handleStudentLogout} /> : <Navigate to="/student/join" />} 
          />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}

/* ==========================================================================
   NAVIGATION BAR
   ========================================================================== */
function Navbar({ teacher, student, onTeacherLogout, onStudentLogout, theme, onToggleTheme }) {
  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">
        <ClipboardCheck size={28} style={{ color: '#6366f1' }} />
        ClassPulse
      </Link>
      <div className="nav-links">
        <button 
          onClick={onToggleTheme} 
          className="btn btn-secondary" 
          style={{ padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        {teacher && (
          <div className="nav-user">
            <span style={{ color: 'var(--text-secondary)' }}>Teacher: <strong style={{ color: '#fff' }}>{teacher.name}</strong></span>
            <Link to="/teacher/dashboard" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>
              Dashboard
            </Link>
            <button onClick={onTeacherLogout} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '13px' }}>
              <LogOut size={14} /> Logout
            </button>
          </div>
        )}
        {student && (
          <div className="nav-user">
            <span style={{ color: 'var(--text-secondary)' }}>Student: <strong style={{ color: '#fff' }}>{student.name}</strong> ({student.usn})</span>
            <button onClick={onStudentLogout} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '13px' }}>
              <LogOut size={14} /> Exit Session
            </button>
          </div>
        )}
        {!teacher && !student && (
          <>
            <Link to="/student/join" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '14px' }}>
              Student Access
            </Link>
            <Link to="/teacher/login" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>
              Teacher Portal
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

/* ==========================================================================
   FOOTER
   ========================================================================== */
function Footer() {
  return (
    <footer style={{ 
      padding: '20px', 
      textAlign: 'center', 
      fontSize: '13px', 
      color: 'var(--text-muted)', 
      borderTop: '1px solid var(--border-light)', 
      marginTop: 'auto',
      backgroundColor: 'rgba(7, 10, 19, 0.5)'
    }}>
      &copy; {new Date().getFullYear()} ClassPulse. Premium Classroom Attendance & Engagement Platform.
    </footer>
  );
}

/* ==========================================================================
   LANDING / PORTAL SELECTOR
   ========================================================================== */
function Landing() {
  return (
    <div className="main-layout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
      <div className="welcome-screen glass-card">
        <h1 className="welcome-logo">ClassPulse</h1>
        <p className="welcome-desc">
          Real-time classroom attendance validation with GPS Geofencing & anonymous engagement metrics.
        </p>
        
        <div className="welcome-buttons">
          <Link to="/student/join" className="btn btn-primary" style={{ padding: '16px', fontSize: '18px', width: '100%' }}>
            Join Lecture as Student <ArrowRight size={18} />
          </Link>
          <Link to="/teacher/login" className="btn btn-secondary" style={{ padding: '16px', fontSize: '18px', width: '100%' }}>
            Access Teacher Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   TEACHER PORTAL: AUTHENTICATION
   ========================================================================== */
function TeacherLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      onLogin(res.data.teacher, res.data.token);
      navigate('/teacher/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-layout">
      <div className="auth-container glass-card">
        <h2 style={{ marginBottom: '24px', textAlign: 'center' }}>Teacher Login</h2>
        
        {error && (
          <div className="alert alert-error">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              className="input-field" 
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Don't have an account? <Link to="/teacher/register" style={{ fontWeight: '500' }}>Register here</Link>
        </p>
      </div>
    </div>
  );
}

function TeacherRegister() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post('/api/auth/register', { name, email, password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="main-layout">
        <div className="auth-container glass-card" style={{ textAlign: 'center' }}>
          <CheckCircle size={48} style={{ color: 'var(--success)', marginBottom: '16px' }} />
          <h2>Registration Successful</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '16px 0 24px' }}>
            Your account has been created. You can now log in.
          </p>
          <Link to="/teacher/login" className="btn btn-primary" style={{ width: '100%' }}>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="main-layout">
      <div className="auth-container glass-card">
        <h2 style={{ marginBottom: '24px', textAlign: 'center' }}>Register Account</h2>
        
        {error && (
          <div className="alert alert-error">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group">
            <label>Full Name</label>
            <input 
              type="text" 
              className="input-field" 
              autoComplete="off"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required 
            />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              className="input-field" 
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Already registered? <Link to="/teacher/login" style={{ fontWeight: '500' }}>Login here</Link>
        </p>
      </div>
    </div>
  );
}

/* ==========================================================================
   TEACHER PORTAL: DASHBOARD
   ========================================================================== */
function TeacherDashboard({ teacher }) {
  const [totals, setTotals] = useState({ totalSessions: 0, activeSessions: 0, totalAttendance: 0 });
  const [recentSessions, setRecentSessions] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [subject, setSubject] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [creationError, setCreationError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterSubject, setFilterSubject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Shortage Dashboard State
  const [activeDashboardTab, setActiveDashboardTab] = useState('lectures'); // 'lectures', 'shortages'
  const [shortageRoster, setShortageRoster] = useState([]);
  const [loadingShortages, setLoadingShortages] = useState(false);
  const [accuracy, setAccuracy] = useState(0);

  const navigate = useNavigate();

  const fetchShortageRoster = async () => {
    setLoadingShortages(true);
    try {
      const res = await axios.get('/api/attendance/shortages');
      setShortageRoster(res.data || []);
    } catch (err) {
      console.error('Failed to load shortage roster', err);
    } finally {
      setLoadingShortages(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get('/api/attendance/dashboard');
      setTotals(res.data.totals);
      setRecentSessions(res.data.recentSessions || []);
    } catch (err) {
      console.error('Failed to load dashboard statistics', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const params = {
        page: currentPage,
        limit: 5,
        subject: filterSubject || undefined,
        status: filterStatus || undefined
      };
      const res = await axios.get('/api/attendance/history', { params });
      setAllSessions(res.data.sessions || []);
      setTotalPages(res.data.pagination.pages || 1);
    } catch (err) {
      console.error('Failed to load history', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [currentPage, filterSubject, filterStatus]);

  useEffect(() => {
    if (activeDashboardTab === 'shortages') {
      fetchShortageRoster();
    }
  }, [activeDashboardTab]);

  const handleAutoLocation = () => {
    setGettingLocation(true);
    setCreationError('');
    if (!navigator.geolocation) {
      setCreationError('Geolocation is not supported by your browser.');
      setGettingLocation(false);
      return;
    }

    let watchId = null;
    let bestPos = null;

    const clearWatchSafe = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
    };

    const timeoutId = setTimeout(() => {
      clearWatchSafe();
      if (bestPos) {
        setLatitude(bestPos.coords.latitude.toFixed(6));
        setLongitude(bestPos.coords.longitude.toFixed(6));
        setAccuracy(bestPos.coords.accuracy || 0);
      } else {
        setCreationError('Location request timed out. Try again.');
      }
      setGettingLocation(false);
    }, 5000);

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!bestPos || pos.coords.accuracy < bestPos.coords.accuracy) {
          bestPos = pos;
          if (pos.coords.accuracy < 15) {
            clearTimeout(timeoutId);
            clearWatchSafe();
            setLatitude(pos.coords.latitude.toFixed(6));
            setLongitude(pos.coords.longitude.toFixed(6));
            setAccuracy(pos.coords.accuracy || 0);
            setGettingLocation(false);
          }
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          clearTimeout(timeoutId);
          clearWatchSafe();
          setCreationError('Location access blocked. Enable GPS permissions.');
          setGettingLocation(false);
        }
      },
      { enableHighAccuracy: true, timeout: 4500, maximumAge: 0 }
    );
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setCreationError('');
    setSuccessMsg('');
    if (!subject.trim() || !latitude || !longitude) {
      setCreationError('Subject and coordinates are required.');
      return;
    }
    try {
      const res = await axios.post('/api/session/create', {
        subject: subject.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: parseFloat(accuracy) || 0
      });
      setSuccessMsg(`Session for "${res.data.subject}" created successfully!`);
      setSubject('');
      setLatitude('');
      setLongitude('');
      
      fetchDashboardData();
      fetchHistory();
      
      setTimeout(() => {
        navigate(`/teacher/session/${res.data._id}`);
      }, 1500);
    } catch (err) {
      setCreationError(err.response?.data?.message || 'Failed to create session.');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="main-layout">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2 style={{ fontSize: '28px' }}>Welcome back, Prof. {teacher.name}</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your active sessions and view student attendance analytics.</p>
        </div>
        <button onClick={fetchDashboardData} className="btn btn-secondary" style={{ padding: '10px' }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Dashboard Sub-navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', marginBottom: '30px', gap: '8px' }}>
        <button 
          onClick={() => setActiveDashboardTab('lectures')} 
          className={`btn ${activeDashboardTab === 'lectures' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '10px 20px', borderRadius: '8px 8px 0 0', borderBottom: 'none' }}
        >
          <BookOpen size={16} /> Session Management
        </button>
        <button 
          onClick={() => setActiveDashboardTab('shortages')} 
          className={`btn ${activeDashboardTab === 'shortages' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '10px 20px', borderRadius: '8px 8px 0 0', borderBottom: 'none' }}
        >
          <AlertTriangle size={16} style={{ color: activeDashboardTab === 'shortages' ? '#fff' : 'var(--danger)' }} /> Attendance Shortages
        </button>
      </div>

      {activeDashboardTab === 'lectures' && (
        <>
          <div className="grid-cols-3" style={{ marginBottom: '35px' }}>
            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ padding: '15px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
                <BookOpen size={28} />
              </div>
              <div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Lectures</p>
                <h3 style={{ fontSize: '28px', marginTop: '4px' }}>{totals.totalSessions}</h3>
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ padding: '15px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                <CheckCircle size={28} />
              </div>
              <div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Active Lectures</p>
                <h3 style={{ fontSize: '28px', marginTop: '4px' }}>
                  {totals.activeSessions} 
                  {totals.activeSessions > 0 && <span className="pulse-active" style={{ marginLeft: '12px' }}></span>}
                </h3>
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ padding: '15px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.1)', color: 'var(--secondary)' }}>
                <Users size={28} />
              </div>
              <div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Attendance Logs</p>
                <h3 style={{ fontSize: '28px', marginTop: '4px' }}>{totals.totalAttendance}</h3>
              </div>
            </div>
          </div>

          <div className="grid-cols-3">
            <div className="glass-card" style={{ gridColumn: 'span 1' }}>
              <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Play size={20} style={{ color: 'var(--primary)' }} />
                Start New Session
              </h3>

              {creationError && (
                <div className="alert alert-error" style={{ padding: '10px', fontSize: '13px' }}>
                  <AlertTriangle size={16} />
                  <span>{creationError}</span>
                </div>
              )}
              {successMsg && (
                <div className="alert alert-success" style={{ padding: '10px', fontSize: '13px' }}>
                  <CheckCircle size={16} />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleCreateSession} autoComplete="off">
                <div className="form-group">
                  <label>Subject / Class Name</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    autoComplete="off"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>GPS Location Coordinates</span>
                    <button 
                      type="button" 
                      onClick={handleAutoLocation} 
                      className="btn btn-secondary" 
                      style={{ padding: '2px 8px', fontSize: '11px', borderRadius: '4px' }}
                      disabled={gettingLocation}
                    >
                      {gettingLocation ? 'Locating...' : 'Auto-Detect'}
                    </button>
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="number" 
                      step="0.000001"
                      className="input-field" 
                      autoComplete="off"
                      aria-label="Latitude"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      required 
                    />
                    <input 
                      type="number" 
                      step="0.000001"
                      className="input-field" 
                      autoComplete="off"
                      aria-label="Longitude"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      required 
                    />
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    Coordinates mark the center of the geofenced attendance zone (50m radius).
                  </p>
                </div>



                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                  Start Lecture Session
                </button>
              </form>
            </div>

            <div className="glass-card" style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={20} style={{ color: 'var(--secondary)' }} />
                  Lecture Sessions History
                </h3>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    className="input-field"
                    autoComplete="off"
                    aria-label="Search subject"
                    style={{ padding: '6px 12px', fontSize: '13px', width: '160px' }}
                    value={filterSubject}
                    onChange={(e) => { setFilterSubject(e.target.value); setCurrentPage(1); }}
                  />
                  <select
                    className="input-field"
                    style={{ padding: '6px 12px', fontSize: '13px', width: '110px' }}
                    value={filterStatus}
                    onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="ended">Ended</option>
                  </select>
                </div>
              </div>

              {allSessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  No lecture sessions found matching filters.
                </div>
              ) : (
                <>
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Subject</th>
                          <th>Class Code</th>
                          <th>Created At</th>
                          <th>Status</th>
                          <th>Attendance</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allSessions.map(session => (
                          <tr key={session._id}>
                            <td style={{ fontWeight: '500' }}>{session.subject}</td>
                            <td style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--secondary)' }}>{session.classCode}</td>
                            <td>{new Date(session.createdAt).toLocaleDateString()} {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                            <td>
                              <span className={`badge ${session.status === 'active' ? 'badge-active' : 'badge-ended'}`}>
                                {session.status === 'active' && <span className="pulse-active" style={{ marginRight: '6px', width: '6px', height: '6px' }}></span>}
                                {session.status}
                              </span>
                            </td>
                            <td>{session.presentCount} / {session.joinedCount} ({session.attendancePercentage}%)</td>
                            <td>
                              <Link to={`/teacher/session/${session._id}`} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>
                                <Eye size={13} /> View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="pagination">
                      <button 
                        onClick={() => handlePageChange(currentPage - 1)} 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '13px' }}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                      <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        Page {currentPage} of {totalPages}
                      </span>
                      <button 
                        onClick={() => handlePageChange(currentPage + 1)} 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '13px' }}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {activeDashboardTab === 'shortages' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>Global Attendance Shortage Roster</h3>
            <button onClick={fetchShortageRoster} className="btn btn-secondary" style={{ padding: '8px 12px' }} disabled={loadingShortages}>
              <RefreshCw size={14} /> Refresh Roster
            </button>
          </div>

          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px' }}>
            The following table lists all students across your sessions whose system-wide cumulative lecture attendance is below the 75% requirement.
          </p>

          {loadingShortages ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>Loading shortage roster...</p>
          ) : shortageRoster.length === 0 ? (
            <div className="alert alert-success" style={{ margin: 0 }}>
              <CheckCircle size={18} />
              <span>No students across your sessions currently have an attendance shortage.</span>
            </div>
          ) : (
            <div className="table-container" style={{ margin: 0 }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>USN</th>
                    <th>Present Count</th>
                    <th>Total Lectures Joined</th>
                    <th>Cumulative Attendance Rate</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {shortageRoster.map((stud, idx) => (
                    <tr key={idx} style={{ background: 'rgba(239, 68, 68, 0.03)' }}>
                      <td style={{ fontWeight: '500' }}>{stud.name}</td>
                      <td style={{ fontWeight: '600' }}>{stud.usn}</td>
                      <td>{stud.totalPresent}</td>
                      <td>{stud.totalJoined}</td>
                      <td>
                        <span style={{ color: 'var(--danger)', fontWeight: '700', fontSize: '15px' }}>
                          {stud.cumulativeRate}%
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-ended" style={{ background: 'var(--danger)', color: '#fff', fontSize: '11px', padding: '3px 10px', borderRadius: '4px' }}>
                          Shortage Warning
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   TEACHER PORTAL: DETAILED SESSION VIEW (LIVE AND HISTORY)
   ========================================================================== */
function TeacherSessionView() {
  const { sessionId } = useParams();
  const fileInputRef = useRef(null);

  const [session, setSession] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [joinedStudents, setJoinedStudents] = useState([]);
  const [feedbackSummary, setFeedbackSummary] = useState(null);
  const [feedbackComments, setFeedbackComments] = useState([]);
  const [paceDistribution, setPaceDistribution] = useState([]);
  const [understandingDistribution, setUnderstandingDistribution] = useState([]);
  
  // Advanced Modules State
  const [doubts, setDoubts] = useState([]);
  const [notes, setNotes] = useState([]);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteFile, setNoteFile] = useState(null);
  const [isNotesUploading, setIsNotesUploading] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualUsn, setManualUsn] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);

  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance', 'feedback', 'notes-doubts'
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedOTP, setCopiedOTP] = useState(false);
  const [otpTimeLeft, setOtpTimeLeft] = useState('');
  const [endingSession, setEndingSession] = useState(false);

  const fetchSessionDetails = async () => {
    try {
      const attRes = await axios.get(`/api/attendance/session/${sessionId}`);
      setSession(attRes.data.session);
      setAttendance(attRes.data.attendance || []);
      setJoinedStudents(attRes.data.joinedStudents || []);

      const fbRes = await axios.get(`/api/feedback/session/${sessionId}`);
      setFeedbackSummary(fbRes.data.summary);
      setFeedbackComments(fbRes.data.feedback || []);
      setPaceDistribution(fbRes.data.paceDistribution || []);
      setUnderstandingDistribution(fbRes.data.understandingDistribution || []);

      const doubtsRes = await axios.get(`/api/doubt/session/${sessionId}`);
      setDoubts(doubtsRes.data || []);

      const notesRes = await axios.get(`/api/notes/session/${sessionId}`);
      setNotes(notesRes.data || []);

      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load session details.');
      setLoading(false);
    }
  };

  // Socket.IO real-time event listeners
  useEffect(() => {
    fetchSessionDetails();

    const socket = io(import.meta.env.VITE_API_URL || undefined);
    socket.emit('joinSession', sessionId);

    socket.on('studentJoined', (newStudent) => {
      setJoinedStudents(prev => {
        if (prev.some(s => s._id === newStudent._id)) return prev;
        return [...prev, newStudent].sort((a, b) => a.name.localeCompare(b.name));
      });
    });

    socket.on('attendanceMarked', (newAtt) => {
      setAttendance(prev => {
        if (prev.some(a => a._id === newAtt._id)) return prev;
        return [...prev, newAtt].sort((a, b) => new Date(a.markedAt) - new Date(b.markedAt));
      });
      if (newAtt.studentId && typeof newAtt.studentId.cumulativeRate !== 'undefined') {
        setJoinedStudents(prev => prev.map(s => {
          if (s.usn === newAtt.studentId.usn) {
            return {
              ...s,
              cumulativeRate: newAtt.studentId.cumulativeRate,
              isShortage: newAtt.studentId.isShortage
            };
          }
          return s;
        }));
      }
    });

    socket.on('feedbackUpdated', (data) => {
      setFeedbackSummary(data.summary);
      setPaceDistribution(data.paceDistribution);
      setUnderstandingDistribution(data.understandingDistribution);
      setFeedbackComments(data.feedback);
    });

    socket.on('newDoubt', (newDoubt) => {
      setDoubts(prev => {
        if (prev.some(d => d._id === newDoubt._id)) return prev;
        return [newDoubt, ...prev];
      });
    });

    socket.on('doubtResolved', (resolvedDoubt) => {
      setDoubts(prev => prev.map(d => d._id === resolvedDoubt._id ? resolvedDoubt : d));
    });

    socket.on('doubtUpvoted', (updatedDoubt) => {
      setDoubts(prev => prev.map(d => d._id === updatedDoubt._id ? updatedDoubt : d));
    });

    socket.on('newNote', (newNote) => {
      setNotes(prev => [newNote, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId]);

  // Countdown timer for OTP
  useEffect(() => {
    if (!session || session.status !== 'active') return;

    const timer = setInterval(() => {
      const now = new Date();
      const expiresAt = session.otpExpiresAt 
        ? new Date(session.otpExpiresAt)
        : new Date(new Date(session.createdAt).getTime() + 30 * 60 * 1000);
      const diff = expiresAt - now;

      if (diff <= 0) {
        setOtpTimeLeft('Expired');
        clearInterval(timer);
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setOtpTimeLeft(`${mins}m ${secs}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [session]);

  const handleEndSession = async () => {
    if (!window.confirm('Are you sure you want to end this lecture session? This will generate the final Gemini AI summary.')) return;
    setEndingSession(true);
    try {
      await axios.patch(`/api/session/${sessionId}/end`);
      fetchSessionDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to end session.');
    } finally {
      setEndingSession(false);
    }
  };

  const handleResolveDoubt = async (doubtId) => {
    try {
      await axios.patch(`/api/doubt/${doubtId}/resolve`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resolve doubt.');
    }
  };

  const handleMarkManual = async (studentId, customName = '', customUsn = '') => {
    try {
      const payload = { sessionId };
      if (studentId) {
        payload.studentId = studentId;
      } else {
        if (!customName.trim() || !customUsn.trim()) {
          alert('Name and USN are required for manual entry.');
          return;
        }
        payload.name = customName.trim();
        payload.usn = customUsn.trim();
      }
      
      const res = await axios.post('/api/attendance/manual', payload);
      alert(res.data.message || 'Attendance marked successfully!');
      
      if (!studentId) {
        setManualName('');
        setManualUsn('');
        setShowManualForm(false);
      }
      
      fetchSessionDetails(); 
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark attendance manually.');
    }
  };

  const handleNoteUpload = async (e) => {
    e.preventDefault();
    if (!noteFile) return;
    setIsNotesUploading(true);

    const formData = new FormData();
    formData.append('file', noteFile);
    formData.append('title', noteTitle.trim() || noteFile.name);

    try {
      await axios.post(`/api/notes/${sessionId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setNoteTitle('');
      setNoteFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      alert('Notes uploaded successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload notes.');
    } finally {
      setIsNotesUploading(false);
    }
  };

  const totalJoined = joinedStudents.length;
  const totalPresent = attendance.length;
  const presentStudentIds = new Set(attendance.map(a => a.studentId?._id));
  const absentStudents = joinedStudents.filter(s => !presentStudentIds.has(s._id));

  if (loading) {
    return (
      <div className="main-layout" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <RefreshCw size={36} className="spin-slow" style={{ animation: 'spin-slow 2s linear infinite', marginBottom: '10px' }} />
          <p>Syncing session logs and feedback analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="main-layout">
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <XCircle size={48} style={{ color: 'var(--danger)', marginBottom: '16px' }} />
          <h2>Error Loading Session</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '16px 0 24px' }}>{error || 'The requested session was not found.'}</p>
          <Link to="/teacher/dashboard" className="btn btn-primary">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const isActive = session.status === 'active';

  return (
    <div className="main-layout">
      {/* Session Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <span className={`badge ${isActive ? 'badge-active' : 'badge-ended'}`} style={{ marginBottom: '8px' }}>
            {isActive && <span className="pulse-active" style={{ marginRight: '6px', width: '6px', height: '6px' }}></span>}
            {session.status} Session
          </span>
          <h2 style={{ fontSize: '30px' }}>{session.subject}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Started: {new Date(session.createdAt).toLocaleString()}
            {!isActive && ` • Ended: ${new Date(session.endedAt).toLocaleString()}`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {isActive && (
            <button 
              onClick={handleEndSession} 
              className="btn btn-danger"
              disabled={endingSession}
            >
              {endingSession ? 'Ending & Summarizing...' : 'End Lecture Session'}
            </button>
          )}
          
          <Link to="/teacher/dashboard" className="btn btn-secondary">
            Back
          </Link>
        </div>
      </div>

      {/* Code Banner for Live Sessions */}
      {isActive && (
        <div className="grid-cols-2" style={{ marginBottom: '30px' }}>
          <div className="code-banner">
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Student Access Code
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px' }}>
              <span className="code-text">{session.classCode}</span>
              <button 
                onClick={() => copyToClipboard(session.classCode, () => {
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                })}
                className="btn btn-secondary" 
                style={{ padding: '6px', borderRadius: '8px' }}
                title="Copy class code"
              >
                {copiedCode ? <span style={{ fontSize: '12px', color: 'var(--success)' }}>Copied!</span> : <Copy size={18} />}
              </button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Share this code so students can join this lecture session.
            </p>
          </div>

          <div className="code-banner" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(99, 102, 241, 0.05))' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Attendance OTP Window
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px' }}>
              <span className="code-text" style={{ color: 'var(--success)', textShadow: '0 0 10px rgba(16, 185, 129, 0.4)' }}>
                {session.otp || 'Active'}
              </span>
              {session.otp && (
                <button 
                  onClick={() => copyToClipboard(session.otp, () => {
                    setCopiedOTP(true);
                    setTimeout(() => setCopiedOTP(false), 2000);
                  })}
                  className="btn btn-secondary" 
                  style={{ padding: '6px', borderRadius: '8px' }}
                >
                  {copiedOTP ? <span style={{ fontSize: '12px', color: 'var(--success)' }}>Copied!</span> : <Copy size={18} />}
                </button>
              )}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Time remaining for attendance: <strong style={{ color: 'var(--warning)' }}>{otpTimeLeft || 'Computing...'}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Tabs Selector */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', marginBottom: '24px', gap: '8px' }}>
        <button 
          onClick={() => setActiveTab('attendance')} 
          className={`btn ${activeTab === 'attendance' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '10px 20px', borderRadius: '8px 8px 0 0', borderBottom: 'none' }}
        >
          <Users size={16} /> Attendance Roster
        </button>
        <button 
          onClick={() => setActiveTab('feedback')} 
          className={`btn ${activeTab === 'feedback' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '10px 20px', borderRadius: '8px 8px 0 0', borderBottom: 'none' }}
        >
          <MessageSquare size={16} /> Engagement & AI Review
        </button>
        <button 
          onClick={() => setActiveTab('notes-doubts')} 
          className={`btn ${activeTab === 'notes-doubts' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '10px 20px', borderRadius: '8px 8px 0 0', borderBottom: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <HelpCircle size={16} /> Notes & Doubts Board
          {doubts.filter(d => !d.isResolved).length > 0 && (
            <span style={{ 
              backgroundColor: '#ef4444', 
              color: '#fff', 
              fontSize: '11px', 
              fontWeight: 'bold', 
              borderRadius: '50%', 
              width: '18px', 
              height: '18px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              lineHeight: '1'
            }}>
              {doubts.filter(d => !d.isResolved).length}
            </span>
          )}
        </button>
      </div>

      {/* TAB CONTENT: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>Attendance Log ({totalPresent} / {totalJoined} Present)</h3>
            <div style={{ display: 'flex', gap: '15px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Present Rate: <strong style={{ color: 'var(--success)' }}>{totalJoined > 0 ? Math.round((totalPresent / totalJoined) * 100) : 0}%</strong>
              </span>
            </div>
          </div>

          {/* Manual Entry Section */}
          <div style={{ marginBottom: '20px', padding: '12px', border: '1px dashed var(--border-light)', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Did a student forget their phone or experience a network issue?
              </span>
              <button 
                onClick={() => setShowManualForm(!showManualForm)}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                {showManualForm ? 'Hide Manual Form' : 'Mark Attendance Manually'}
              </button>
            </div>
            
            {showManualForm && (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleMarkManual(null, manualName, manualUsn);
                }}
                style={{ display: 'flex', gap: '10px', marginTop: '12px', alignItems: 'center', flexWrap: 'wrap' }}
              >
                <input 
                  type="text" 
                  placeholder="Student Name"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="input-field"
                  style={{ flex: 1, minWidth: '150px', padding: '8px', fontSize: '13px', margin: 0 }}
                  required
                />
                <input 
                  type="text" 
                  placeholder="USN"
                  value={manualUsn}
                  onChange={(e) => setManualUsn(e.target.value.toUpperCase())}
                  className="input-field"
                  style={{ flex: 1, minWidth: '120px', padding: '8px', fontSize: '13px', margin: 0 }}
                  required
                />
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  Mark Present
                </button>
              </form>
            )}
          </div>

          <div className="grid-cols-2" style={{ alignItems: 'start' }}>
            <div>
              <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '8px', marginBottom: '12px' }}>
                <strong style={{ fontSize: '15px', color: 'var(--success)' }}>Present List ({totalPresent})</strong>
              </div>
              {attendance.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', padding: '20px 0', fontSize: '14px' }}>No student has marked attendance yet.</p>
              ) : (
                <div className="table-container" style={{ margin: 0 }}>
                  <table className="custom-table" style={{ fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>USN</th>
                        <th>Distance</th>
                        <th>Marked At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map((log) => (
                        <tr key={log._id}>
                          <td style={{ fontWeight: '500' }}>{log.studentId?.name || 'Unknown'}</td>
                          <td>{log.studentId?.usn || 'Unknown'}</td>
                          <td>{log.distance?.toFixed(1)} m</td>
                          <td>{new Date(log.markedAt).toLocaleTimeString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '8px', marginBottom: '12px' }}>
                <strong style={{ fontSize: '15px', color: 'var(--danger)' }}>Absent List ({absentStudents.length})</strong>
              </div>
              {absentStudents.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', padding: '20px 0', fontSize: '14px' }}>All joined students have marked present.</p>
              ) : (
                <div className="table-container" style={{ margin: 0 }}>
                  <table className="custom-table" style={{ fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>USN</th>
                        <th>Joined At</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {absentStudents.map((stud) => (
                        <tr key={stud._id}>
                          <td>{stud.name}</td>
                          <td style={{ fontWeight: '500' }}>{stud.usn}</td>
                          <td>{new Date(stud.joinedAt).toLocaleTimeString()}</td>
                          <td>
                            <button
                              onClick={() => handleMarkManual(stud._id)}
                              className="btn"
                              style={{ 
                                padding: '4px 8px', 
                                fontSize: '11px', 
                                backgroundColor: 'var(--success)', 
                                color: '#fff', 
                                border: 'none', 
                                borderRadius: '4px',
                                cursor: 'pointer' 
                              }}
                            >
                              Mark Present
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ENGAGEMENT & AI SUMMARY */}
      {activeTab === 'feedback' && (
        <div className="grid-cols-2">
          {/* Averages and comments */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '20px' }}>Feedback Ratings</h3>
            
            {!feedbackSummary || feedbackSummary.responseCount === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '60px 0' }}>No feedback submissions recorded.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <div style={{ flex: 1, padding: '16px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.05)', textAlign: 'center', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Avg Pace</span>
                    <h4 style={{ fontSize: '28px', color: 'var(--primary)', margin: '4px 0' }}>
                      {feedbackSummary.averagePace?.toFixed(1)} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/ 5</span>
                    </h4>
                  </div>
                  <div style={{ flex: 1, padding: '16px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.05)', textAlign: 'center', border: '1px solid rgba(168, 85, 247, 0.1)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Avg Understanding</span>
                    <h4 style={{ fontSize: '28px', color: 'var(--secondary)', margin: '4px 0' }}>
                      {feedbackSummary.averageUnderstanding?.toFixed(1)} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/ 5</span>
                    </h4>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Pace Distribution</h4>
                  {Array.from({ length: 5 }, (_, i) => {
                    const r = 5 - i;
                    const item = paceDistribution.find(d => d._id === r);
                    const count = item ? item.count : 0;
                    const pct = Math.round((count / feedbackSummary.responseCount) * 100) || 0;
                    return (
                      <div key={r} className="dist-bar-container">
                        <span style={{ width: '60px' }}>{r} Star</span>
                        <div className="dist-bar-wrapper">
                          <div className="dist-bar-fill" style={{ width: `${pct}%`, background: 'var(--primary)' }}></div>
                        </div>
                        <span style={{ width: '40px', textAlign: 'right' }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>

                <div>
                  <h4 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Understanding Distribution</h4>
                  {Array.from({ length: 5 }, (_, i) => {
                    const r = 5 - i;
                    const item = understandingDistribution.find(d => d._id === r);
                    const count = item ? item.count : 0;
                    const pct = Math.round((count / feedbackSummary.responseCount) * 100) || 0;
                    return (
                      <div key={r} className="dist-bar-container">
                        <span style={{ width: '60px' }}>{r} Star</span>
                        <div className="dist-bar-wrapper">
                          <div className="dist-bar-fill" style={{ width: `${pct}%`, background: 'var(--secondary)' }}></div>
                        </div>
                        <span style={{ width: '40px', textAlign: 'right' }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>

                <div>
                  <h4 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Comments Listing</h4>
                  <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {feedbackComments.filter(f => f.comment?.trim()).length === 0 ? (
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>No comments submitted.</p>
                    ) : (
                      feedbackComments.filter(f => f.comment?.trim()).map((f, idx) => (
                        <div key={idx} style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-light)' }}>
                          <p style={{ fontSize: '13px' }}>"{f.comment}"</p>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pace: {f.pace} • Understanding: {f.understanding}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI Summary display */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} style={{ color: 'var(--warning)' }} />
              Gemini AI Session Review
            </h3>

            {session.aiSummary ? (
              <div 
                style={{ 
                  flex: 1, 
                  overflowY: 'auto', 
                  fontSize: '14px', 
                  lineHeight: '1.6', 
                  color: 'var(--text-primary)', 
                  whiteSpace: 'pre-wrap',
                  textAlign: 'left',
                  background: 'rgba(255, 255, 255, 0.01)',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px dashed var(--border-light)'
                }}
              >
                {session.aiSummary}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <Sparkles size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                <h4>Summary Pending</h4>
                <p style={{ fontSize: '13px', marginTop: '8px', maxWidth: '300px' }}>
                  Gemini API will generate an aggregated summary including pace reviews, doubt listings, and suggestions once you end the session.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: NOTES & DOUBTS BOARD */}
      {activeTab === 'notes-doubts' && (
        <div className="grid-cols-2">
          
          {/* Notes Upload and List */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Upload size={20} style={{ color: 'var(--primary)' }} />
              Lecture Reference Notes
            </h3>

            {isActive && (
              <form onSubmit={handleNoteUpload} autoComplete="off" style={{ marginBottom: '25px', paddingBottom: '20px', borderBottom: '1px solid var(--border-light)' }}>
                <div className="form-group">
                  <label>Document Title</label>
                  <input 
                    type="text" 
                    className="input-field"
                    autoComplete="off"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label>File Upload</label>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={(e) => setNoteFile(e.target.files[0])}
                    required
                    style={{ fontSize: '13px' }}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isNotesUploading || !noteFile}>
                  {isNotesUploading ? 'Uploading to Cloudinary...' : 'Upload Notes Document'}
                </button>
              </form>
            )}

            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
              <strong style={{ fontSize: '14px', display: 'block', marginBottom: '10px' }}>Uploaded Notes ({notes.length})</strong>
              {notes.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No reference materials uploaded.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {notes.map(note => (
                    <div key={note._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={18} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>{note.title}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <a 
                          href={note.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn btn-secondary" 
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                        >
                          View
                        </a>
                        <a 
                          href={note.fileUrl && note.fileUrl.includes('res.cloudinary.com') ? note.fileUrl.replace('/upload/', '/upload/fl_attachment/') : (note.fileUrl || '')} 
                          download
                          className="btn btn-primary" 
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Doubts board */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={20} style={{ color: 'var(--secondary)' }} />
              Live Doubts Board ({doubts.filter(d => !d.isResolved).length} Unresolved)
            </h3>

            <div style={{ maxHeight: '480px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {doubts.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0', fontSize: '13px' }}>
                  No student doubts asked yet.
                </p>
              ) : (
                [...doubts]
                  .sort((a, b) => {
                    if (a.isResolved !== b.isResolved) {
                      return a.isResolved ? 1 : -1;
                    }
                    if (!a.isResolved) {
                      const votesA = a.upvotes ? a.upvotes.length : 0;
                      const votesB = b.upvotes ? b.upvotes.length : 0;
                      if (votesA !== votesB) return votesB - votesA;
                    }
                    return new Date(b.createdAt) - new Date(a.createdAt);
                  })
                  .map(doubt => (
                    <div 
                      key={doubt._id} 
                      style={{ 
                        padding: '16px', 
                        borderRadius: '8px', 
                        background: doubt.isResolved ? 'rgba(16, 185, 129, 0.02)' : 'rgba(245, 158, 11, 0.02)', 
                        border: `1px solid ${doubt.isResolved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <p style={{ fontSize: '14px', lineHeight: '1.4', flex: 1, marginRight: '10px' }}>
                          "{doubt.text}"
                        </p>
                        <span className={`badge ${doubt.isResolved ? 'badge-ended' : 'badge-active'}`} style={{ color: doubt.isResolved ? 'var(--success)' : 'var(--warning)', background: 'transparent', border: 'none', padding: 0 }}>
                          {doubt.isResolved ? 'Resolved' : 'Active'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{new Date(doubt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                          <span>•</span>
                          <strong style={{ color: 'var(--secondary)' }}>👍 {doubt.upvotes ? doubt.upvotes.length : 0} upvotes</strong>
                        </span>
                        
                        {!doubt.isResolved && isActive && (
                          <button 
                            onClick={() => handleResolveDoubt(doubt._id)} 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 10px', fontSize: '11px', color: 'var(--success)', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                          >
                            Mark Resolved
                          </button>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

/* ==========================================================================
   STUDENT PORTAL: JOIN SESSION
   ========================================================================== */
function StudentJoin({ onJoin }) {
  const [name, setName] = useState('');
  const [usn, setUsn] = useState('');
  const [classCode, setClassCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!name.trim() || !usn.trim() || !classCode.trim()) {
      setError('Please fill in all the input fields.');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post('/api/student/join', {
        name: name.trim(),
        usn: usn.trim().toUpperCase(),
        classCode: classCode.trim().toUpperCase()
      });
      
      onJoin(res.data.student, res.data.accessToken);
      navigate('/student/session');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join. Double check the Class Code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-layout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
      <div className="join-container glass-card">
        <h2 style={{ marginBottom: '16px', textAlign: 'center' }}>Join Active Lecture</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '24px', fontSize: '14px' }}>
          Enter your name, university registration number (USN), and the active class code to enter the lecture.
        </p>

        {error && (
          <div className="alert alert-error">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group">
            <label>Your Full Name</label>
            <input 
              type="text" 
              className="input-field" 
              autoComplete="off"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required 
            />
          </div>
          <div className="form-group">
            <label>University Serial Number (USN)</label>
            <input 
              type="text" 
              className="input-field" 
              autoComplete="off"
              value={usn}
              onChange={(e) => setUsn(e.target.value)}
              required 
            />
          </div>
          <div className="form-group">
            <label>Class Code</label>
            <input 
              type="text" 
              className="input-field" 
              autoComplete="off"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
              required 
              style={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
            {loading ? 'Joining lecture...' : 'Join Lecture'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ==========================================================================
   STUDENT PORTAL: ACTIVE SESSION (ATTENDANCE & ANONYMOUS FEEDBACK & DOUBTS)
   ========================================================================== */
function StudentSession({ student, onLogout }) {
  const [session, setSession] = useState(null);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [attendanceDetails, setAttendanceDetails] = useState(null);
  const [feedback, setFeedback] = useState({ pace: 3, understanding: 3, comment: '' });
  const [otp, setOtp] = useState('');
  const [cumulativeAttendance, setCumulativeAttendance] = useState(null);
  
  // Advanced State
  const [doubts, setDoubts] = useState([]);
  const [notes, setNotes] = useState([]);
  const [doubtText, setDoubtText] = useState('');
  const [submittingDoubt, setSubmittingDoubt] = useState(false);
  const [doubtMsg, setDoubtMsg] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('attendance'); // 'attendance', 'feedback', 'resources'

  // Geolocation
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [gpsError, setGpsError] = useState('');
  const [retrievingGps, setRetrievingGps] = useState(true);
  const [accuracy, setAccuracy] = useState(0);

  // States
  const [submittingAttendance, setSubmittingAttendance] = useState(false);
  const [attendanceError, setAttendanceError] = useState('');
  const [attendanceSuccess, setAttendanceSuccess] = useState('');
  const [retriesRemaining, setRetriesRemaining] = useState(2);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const fetchStudentStatus = async () => {
    try {
      const res = await axios.get('/api/student/status');
      setSession(res.data.session);
      setAttendanceMarked(res.data.attendanceMarked);
      setAttendanceDetails(res.data.attendanceDetails);
      if (res.data.feedback) {
        setFeedback(res.data.feedback);
      }
      setRetriesRemaining(Math.max(0, 2 - res.data.student.otpAttempts));
      setCumulativeAttendance(res.data.cumulativeAttendance);

      // Fetch doubts and notes
      const doubtsRes = await axios.get(`/api/doubt/session/${student.sessionId}`);
      setDoubts(doubtsRes.data || []);

      const notesRes = await axios.get(`/api/notes/session/${student.sessionId}`);
      setNotes(notesRes.data || []);

    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403 || err.response?.status === 404) {
        onLogout();
      }
    }
  };

  const triggerGpsLookup = () => {
    setRetrievingGps(true);
    setGpsError('');
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by this browser.');
      setRetrievingGps(false);
      return;
    }

    let watchId = null;
    let bestPos = null;

    const clearWatchSafe = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
    };

    const timeoutId = setTimeout(() => {
      clearWatchSafe();
      if (bestPos) {
        setLatitude(bestPos.coords.latitude);
        setLongitude(bestPos.coords.longitude);
        setAccuracy(bestPos.coords.accuracy || 0);
      } else {
        setGpsError('Location request timed out. Please refresh GPS.');
      }
      setRetrievingGps(false);
    }, 5000);

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!bestPos || pos.coords.accuracy < bestPos.coords.accuracy) {
          bestPos = pos;
          if (pos.coords.accuracy < 15) {
            clearTimeout(timeoutId);
            clearWatchSafe();
            setLatitude(pos.coords.latitude);
            setLongitude(pos.coords.longitude);
            setAccuracy(pos.coords.accuracy || 0);
            setRetrievingGps(false);
          }
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          clearTimeout(timeoutId);
          clearWatchSafe();
          setGpsError('Location access blocked. Please enable GPS permissions to mark attendance.');
          setRetrievingGps(false);
        }
      },
      { enableHighAccuracy: true, timeout: 4500, maximumAge: 0 }
    );
  };

  // Socket.IO Integration
  useEffect(() => {
    fetchStudentStatus();
    triggerGpsLookup();

    const socket = io(import.meta.env.VITE_API_URL || undefined);
    socket.emit('joinSession', student.sessionId);

    socket.on('sessionEnded', (data) => {
      setSession(prev => prev ? { ...prev, status: 'ended', aiSummary: data.aiSummary } : null);
      alert('The professor has ended this lecture session.');
    });

    socket.on('newDoubt', (newDoubt) => {
      setDoubts(prev => {
        if (prev.some(d => d._id === newDoubt._id)) return prev;
        return [newDoubt, ...prev];
      });
    });

    socket.on('doubtResolved', (resolvedDoubt) => {
      setDoubts(prev => prev.map(d => d._id === resolvedDoubt._id ? resolvedDoubt : d));
    });

    socket.on('doubtUpvoted', (updatedDoubt) => {
      setDoubts(prev => prev.map(d => d._id === updatedDoubt._id ? updatedDoubt : d));
    });

    socket.on('newNote', (newNote) => {
      setNotes(prev => [newNote, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleUpvoteDoubt = async (doubtId) => {
    try {
      const res = await axios.post(`/api/doubt/${doubtId}/upvote`);
      setDoubts(prev => prev.map(d => d._id === doubtId ? res.data : d));
    } catch (err) {
      console.error('Failed to upvote doubt', err);
    }
  };

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    setAttendanceError('');
    setAttendanceSuccess('');
    
    if (!otp.trim()) {
      setAttendanceError('Attendance OTP is required.');
      return;
    }

    if (latitude === null || longitude === null) {
      setAttendanceError('GPS Coordinates not found. Please enable location and click retry.');
      return;
    }

    let deviceId = localStorage.getItem('classpulse_device_id');
    if (!deviceId) {
      deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('classpulse_device_id', deviceId);
    }

    setSubmittingAttendance(true);
    try {
      const res = await axios.post('/api/attendance/mark', {
        otp: otp.trim(),
        latitude,
        longitude,
        accuracy,
        deviceId
      });
      setAttendanceSuccess(res.data.message || 'Attendance marked successfully!');
      setAttendanceMarked(true);
      fetchStudentStatus();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to mark attendance.';
      setAttendanceError(msg);
      
      if (err.response?.data?.retriesRemaining !== undefined) {
        setRetriesRemaining(err.response.data.retriesRemaining);
      } else {
        fetchStudentStatus();
      }
    } finally {
      setSubmittingAttendance(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setFeedbackMsg('');
    setSubmittingFeedback(true);
    try {
      await axios.post('/api/feedback', {
        pace: feedback.pace,
        understanding: feedback.understanding,
        comment: feedback.comment
      });
      setFeedbackMsg('Feedback updated successfully (Anonymous)');
      setTimeout(() => setFeedbackMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleSubmitDoubt = async (e) => {
    e.preventDefault();
    if (!doubtText.trim()) return;
    setDoubtMsg('');
    setSubmittingDoubt(true);

    try {
      await axios.post('/api/doubt', { text: doubtText.trim() });
      setDoubtText('');
      setDoubtMsg('Doubt posted anonymously to the board!');
      setTimeout(() => setDoubtMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post doubt.');
    } finally {
      setSubmittingDoubt(false);
    }
  };

  if (!session) {
    return (
      <div className="main-layout" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <RefreshCw size={36} className="spin-slow" style={{ animation: 'spin-slow 2s linear infinite', marginBottom: '10px' }} />
          <p>Syncing session status with classroom backend...</p>
        </div>
      </div>
    );
  }

  const isLectureEnded = session.status === 'ended';

  return (
    <div className="main-layout" style={{ maxWidth: '800px' }}>
      
      {/* Session Title Card */}
      <div className="glass-card" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className={`badge ${isLectureEnded ? 'badge-ended' : 'badge-active'}`}>
            Session {session.status}
          </span>
          <h2 style={{ fontSize: '22px', marginTop: '6px' }}>{session.subject}</h2>
        </div>
        <button onClick={fetchStudentStatus} className="btn btn-secondary" style={{ padding: '8px' }}>
          <RefreshCw size={14} /> Sync Status
        </button>
      </div>

      {isLectureEnded && (
        <div className="alert alert-info">
          <Clock size={18} />
          <span>The professor has closed this lecture session. You can review your attendance state and notes below.</span>
        </div>
      )}

      {/* Tabs Selector */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', marginBottom: '24px', gap: '8px' }}>
        <button 
          onClick={() => setActiveSubTab('attendance')} 
          className={`btn ${activeSubTab === 'attendance' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px 8px 0 0', borderBottom: 'none' }}
        >
          Attendance Validation
        </button>
        <button 
          onClick={() => setActiveSubTab('feedback')} 
          className={`btn ${activeSubTab === 'feedback' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px 8px 0 0', borderBottom: 'none' }}
        >
          Anonymous Feedback
        </button>
        <button 
          onClick={() => setActiveSubTab('resources')} 
          className={`btn ${activeSubTab === 'resources' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px 8px 0 0', borderBottom: 'none' }}
        >
          Notes & Doubts ({notes.length} / {doubts.filter(d => !d.isResolved).length})
        </button>
        <button 
          onClick={() => setActiveSubTab('record')} 
          className={`btn ${activeSubTab === 'record' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px 8px 0 0', borderBottom: 'none' }}
        >
          My Attendance
        </button>
      </div>

      {/* TAB CONTENT: ATTENDANCE */}
      {activeSubTab === 'attendance' && (
        <div className="glass-card">
          <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={20} style={{ color: 'var(--primary)' }} />
            Mark Geofenced Attendance
          </h3>

          {attendanceMarked ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <CheckCircle size={54} style={{ color: 'var(--success)', marginBottom: '12px' }} />
              <h4 style={{ fontSize: '20px', color: 'var(--success)' }}>Attendance Verified</h4>
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>
                Your attendance was recorded successfully.
                {attendanceDetails && ` (Distance: ${attendanceDetails.distance?.toFixed(1)}m from teacher)`}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '12px' }}>
                You can safely close this screen or disable location services.
              </p>
            </div>
          ) : isLectureEnded ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <XCircle size={54} style={{ color: 'var(--danger)', marginBottom: '12px' }} />
              <h4 style={{ fontSize: '20px', color: 'var(--danger)' }}>Session Ended</h4>
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                This session has ended. Attendance is closed.
              </p>
            </div>
          ) : retriesRemaining <= 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <XCircle size={54} style={{ color: 'var(--danger)', marginBottom: '12px' }} />
              <h4 style={{ fontSize: '20px', color: 'var(--danger)' }}>Access Blocked</h4>
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                OTP retry limit (2 attempts) reached.
              </p>
            </div>
          ) : (
            <div>
              {attendanceError && (
                <div className="alert alert-error">
                  <AlertTriangle size={18} />
                  <span>{attendanceError}</span>
                </div>
              )}
              {attendanceSuccess && (
                <div className="alert alert-success">
                  <CheckCircle size={18} />
                  <span>{attendanceSuccess}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-light)', borderRadius: '8px', marginBottom: '20px' }}>
                <div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>GPS Status:</p>
                  {retrievingGps ? (
                    <span style={{ fontSize: '14px', color: 'var(--warning)', fontWeight: '500' }}>Locating...</span>
                  ) : gpsError ? (
                    <span style={{ fontSize: '14px', color: 'var(--danger)', fontWeight: '500' }}>Location Access Error</span>
                  ) : (
                    <span style={{ fontSize: '14px', color: 'var(--success)', fontWeight: '500' }}>
                      Locked ({latitude?.toFixed(6)}, {longitude?.toFixed(6)})
                    </span>
                  )}
                </div>
                <button type="button" onClick={triggerGpsLookup} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                  Refresh GPS
                </button>
              </div>

              {gpsError && (
                <p style={{ fontSize: '12px', color: 'var(--danger)', marginBottom: '16px', marginTop: '-10px' }}>
                  ⚠️ {gpsError}
                </p>
              )}

              <form onSubmit={handleMarkAttendance} autoComplete="off">
                <div className="form-group">
                  <label>Attendance OTP</label>
                  <input 
                    type="text" 
                    maxLength="6"
                    className="input-field" 
                    autoComplete="off"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required 
                    style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '0.25em', fontFamily: 'monospace', fontWeight: 'bold' }}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%' }}
                  disabled={submittingAttendance || retrievingGps}
                >
                  {submittingAttendance ? 'Validating Geofence & OTP...' : 'Mark Attendance'}
                </button>

                <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>
                  You have <strong style={{ color: 'var(--warning)' }}>{retriesRemaining}</strong> {retriesRemaining === 1 ? 'attempt' : 'attempts'} remaining.
                </p>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: FEEDBACK */}
      {activeSubTab === 'feedback' && (
        <div className="glass-card">
          <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Star size={20} style={{ color: 'var(--secondary)' }} />
            Rate Lecture (Anonymous)
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
            Submit anonymous sliders for pace and understanding. The server hashes your identity internally for duplicate controls but never exposes student details.
          </p>

          {feedbackMsg && (
            <div className="alert alert-success" style={{ padding: '10px', fontSize: '13px' }}>
              <CheckCircle size={16} />
              <span>{feedbackMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmitFeedback} autoComplete="off">
            <div className="form-group">
              <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Lecture Pace (1 = Too Slow, 3 = Perfect, 5 = Too Fast)</span>
                <strong style={{ color: 'var(--primary)' }}>{feedback.pace} / 5</strong>
              </label>
              <div className="rating-selector">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={`rating-btn ${feedback.pace === val ? 'selected' : ''}`}
                    onClick={() => !isLectureEnded && setFeedback({ ...feedback, pace: val })}
                    disabled={isLectureEnded}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Understanding Level (1 = Completely Lost, 5 = Very Clear)</span>
                <strong style={{ color: 'var(--secondary)' }}>{feedback.understanding} / 5</strong>
              </label>
              <div className="rating-selector">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={`rating-btn ${feedback.understanding === val ? 'selected' : ''}`}
                    onClick={() => !isLectureEnded && setFeedback({ ...feedback, understanding: val })}
                    disabled={isLectureEnded}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Questions / Comments for Professor (Optional, max 500 chars)</label>
              <textarea
                className="input-field"
                rows="3"
                autoComplete="off"
                maxLength="500"
                value={feedback.comment}
                onChange={(e) => !isLectureEnded && setFeedback({ ...feedback, comment: e.target.value })}
                disabled={isLectureEnded}
                style={{ resize: 'vertical' }}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-secondary" 
              style={{ width: '100%', borderColor: 'var(--primary-glow)' }}
              disabled={submittingFeedback || isLectureEnded}
            >
              {isLectureEnded ? 'Lecture Ended' : submittingFeedback ? 'Submitting...' : 'Update Feedback'}
            </button>
          </form>
        </div>
      )}

      {/* TAB CONTENT: RESOURCES (NOTES & DOUBTS) */}
      {activeSubTab === 'resources' && (
        <div className="grid-cols-2">
          
          {/* Notes download panel */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} style={{ color: 'var(--primary)' }} />
              Lecture Slides & Notes
            </h3>

            {notes.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '20px 0', textAlign: 'center' }}>No lecture notes uploaded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto' }}>
                {notes.map(note => (
                  <div key={note._id} style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={14} style={{ color: 'var(--primary)' }} />
                      {note.title}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <a 
                        href={note.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn btn-secondary" 
                        style={{ padding: '4px 10px', fontSize: '11px' }}
                      >
                        View
                      </a>
                      <a 
                        href={note.fileUrl && note.fileUrl.includes('res.cloudinary.com') ? note.fileUrl.replace('/upload/', '/upload/fl_attachment/') : (note.fileUrl || '')} 
                        download
                        className="btn btn-primary" 
                        style={{ padding: '4px 10px', fontSize: '11px' }}
                      >
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ask doubts board */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={18} style={{ color: 'var(--secondary)' }} />
              Anonymous Doubt Board
            </h3>

            {isLectureEnded ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '15px' }}>Lecture has ended. Question submissions are closed.</p>
            ) : (
              <form onSubmit={handleSubmitDoubt} autoComplete="off" style={{ marginBottom: '20px' }}>
                {doubtMsg && (
                  <div className="alert alert-success" style={{ padding: '8px', fontSize: '12px', marginBottom: '10px' }}>
                    <span>{doubtMsg}</span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    className="input-field"
                    autoComplete="off"
                    value={doubtText}
                    onChange={(e) => setDoubtText(e.target.value)}
                    required
                    maxLength="500"
                    style={{ fontSize: '13px', padding: '8px 12px' }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }} disabled={submittingDoubt || !doubtText.trim()}>
                    <Send size={14} />
                  </button>
                </div>
              </form>
            )}

            <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {doubts.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '10px' }}>No doubts asked yet.</p>
              ) : (
                [...doubts]
                  .sort((a, b) => {
                    if (a.isResolved !== b.isResolved) {
                      return a.isResolved ? 1 : -1;
                    }
                    if (!a.isResolved) {
                      const votesA = a.upvotes ? a.upvotes.length : 0;
                      const votesB = b.upvotes ? b.upvotes.length : 0;
                      if (votesA !== votesB) return votesB - votesA;
                    }
                    return new Date(b.createdAt) - new Date(a.createdAt);
                  })
                  .map(doubt => (
                    <div 
                      key={doubt._id} 
                      style={{ 
                        padding: '10px', 
                        borderRadius: '6px', 
                        background: doubt.isResolved ? 'rgba(16, 185, 129, 0.02)' : 'rgba(245, 158, 11, 0.02)', 
                        border: `1px solid ${doubt.isResolved ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <p style={{ fontSize: '13px', flex: 1, marginRight: '10px' }}>"{doubt.text}"</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {!doubt.isResolved && (
                          <button
                            onClick={() => handleUpvoteDoubt(doubt._id)}
                            className="btn btn-secondary"
                            style={{
                              padding: '2px 8px',
                              fontSize: '11px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              borderRadius: '4px',
                              borderColor: doubt.upvotes?.includes(student.id) ? 'var(--secondary)' : 'var(--border-light)',
                              background: doubt.upvotes?.includes(student.id) ? 'rgba(168, 85, 247, 0.1)' : 'transparent',
                              color: doubt.upvotes?.includes(student.id) ? 'var(--secondary)' : 'var(--text-secondary)'
                            }}
                          >
                            👍 {doubt.upvotes ? doubt.upvotes.length : 0}
                          </button>
                        )}
                        <span style={{ fontSize: '11px', fontWeight: '500', color: doubt.isResolved ? 'var(--success)' : 'var(--warning)' }}>
                          {doubt.isResolved ? 'Resolved' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

        </div>
      )}

      {activeSubTab === 'record' && (
        <div className="glass-card">
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardCheck size={20} style={{ color: 'var(--primary)' }} />
            My Attendance Record
          </h3>
          
          {cumulativeAttendance ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className={`alert ${cumulativeAttendance.rate < 75 ? 'alert-error' : 'alert-success'}`} style={{ margin: 0 }}>
                <CheckCircle size={18} />
                <span>
                  <strong>Semester Attendance Record:</strong> You have been present in <strong>{cumulativeAttendance.totalPresent}</strong> out of <strong>{cumulativeAttendance.totalJoined}</strong> lectures (<strong>{cumulativeAttendance.rate}%</strong>).
                </span>
              </div>
              
              {cumulativeAttendance.rate < 75 ? (
                <div className="alert alert-error" style={{ margin: 0 }}>
                  <AlertTriangle size={18} style={{ color: '#fff' }} />
                  <span>
                    <strong style={{ color: '#fff' }}>⚠️ ATTENDANCE SHORTAGE WARNING: Your overall attendance is below the required 75% threshold.</strong>
                  </span>
                </div>
              ) : (
                <div className="alert alert-success" style={{ margin: 0 }}>
                  <CheckCircle size={18} />
                  <span>
                    <strong>Status: Safe.</strong> Your attendance is above the 75% threshold.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Loading attendance record...</p>
          )}
        </div>
      )}

      {/* AI Summary display for ended students */}
      {isLectureEnded && session.aiSummary && (
        <div className="glass-card" style={{ marginTop: '24px' }}>
          <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} style={{ color: 'var(--warning)' }} />
            Gemini Lecture Summary & Review
          </h3>
          <div 
            style={{ 
              fontSize: '14px', 
              lineHeight: '1.6', 
              color: 'var(--text-primary)', 
              whiteSpace: 'pre-wrap',
              textAlign: 'left',
              background: 'rgba(255, 255, 255, 0.01)',
              padding: '16px',
              borderRadius: '8px',
              border: '1px dashed var(--border-light)'
            }}
          >
            {session.aiSummary}
          </div>
        </div>
      )}

    </div>
  );
}

export default App;

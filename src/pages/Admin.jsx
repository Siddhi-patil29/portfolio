import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ArrowLeft, Trash2, Plus, LogOut, Save, ArrowUp, ArrowDown, RefreshCw, AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://portfolio-backend-i9vy.onrender.com/api';
const BACKEND_BASE = import.meta.env.VITE_BACKEND_BASE || 'https://portfolio-backend-i9vy.onrender.com';
const IS_LOCAL = BACKEND_BASE.includes('localhost') || BACKEND_BASE.includes('127.0.0.1');
const AXIOS_TIMEOUT = IS_LOCAL ? 10000 : 50000; // 10s locally, 50s for cold-start Render
const HEALTH_CHECK_TIMEOUT = IS_LOCAL ? 5000 : 15000; // faster health check locally

// Helper: resolve image URL — Cloudinary images are already full URLs
const resolveImg = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BACKEND_BASE}${url}`;
};

const Admin = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null

  // Server wake-up state (shown on login screen)
  const [serverStatus, setServerStatus] = useState('checking'); // 'checking' | 'online' | 'waking'
  const [retryCount, setRetryCount] = useState(0);
  const wakeIntervalRef = useRef(null);
  const wakeTimerRef = useRef(null);
  
  // Data State
  const [profile, setProfile] = useState({});
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);
  const [experience, setExperience] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [education, setEducation] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [messages, setMessages] = useState([]);

  // File states for profile
  const [profileImage, setProfileImage] = useState(null);
  const [collegeImage, setCollegeImage] = useState(null);

  // Form States
  const [skillForm, setSkillForm] = useState({ category: 'Technical', name: '' });
  const [projForm, setProjForm] = useState({ title: '', problem: '', solution: '', tools: '', role: '', outcome: '', github_url: '', live_url: '' });
  const [projImage, setProjImage] = useState(null);
  const [expForm, setExpForm] = useState({ role: '', company: '', period: '', description: '' });
  const [certForm, setCertForm] = useState({ title: '', issuer: '', year: '' });
  const [eduForm, setEduForm] = useState({ degree: '', institution: '', year: '', description: '' });
  const [achForm, setAchForm] = useState({ title: '', date: '', description: '' });
  const [achImage, setAchImage] = useState(null);

  // Ping server on mount to start warm-up before login
  useEffect(() => {
    pingServer();
    return () => {
      clearTimeout(wakeTimerRef.current);
    };
  }, []);

  // Only fetch data once BOTH: user is logged in AND server is confirmed online
  useEffect(() => {
    if (isAuthenticated && (serverStatus === 'online' || serverStatus === 'db_error')) {
      if (serverStatus === 'db_error') {
        setDataError('DB_DISCONNECTED: Cannot reach MongoDB Atlas. Your current IP is not whitelisted. Go to MongoDB Atlas → Network Access → Add IP Address → Allow 0.0.0.0/0');
        return;
      }
      fetchData();
    }
  }, [isAuthenticated, serverStatus]);

  const pingServer = async () => {
    setServerStatus('checking');
    try {
      const { data } = await axios.get(`${BACKEND_BASE}/health`, { timeout: HEALTH_CHECK_TIMEOUT });
      if (data.dbReady === false) {
        // Server is up but DB is disconnected — special state
        setServerStatus('db_error');
      } else {
        setServerStatus('online');
      }
    } catch {
      if (IS_LOCAL) {
        setServerStatus('waking');
        setRetryCount(prev => prev + 1);
        const retry = async () => {
          try {
            const { data } = await axios.get(`${BACKEND_BASE}/health`, { timeout: 4000 });
            if (data.dbReady === false) setServerStatus('db_error');
            else setServerStatus('online');
          } catch {
            setRetryCount(prev => prev + 1);
            wakeTimerRef.current = setTimeout(retry, 3000);
          }
        };
        wakeTimerRef.current = setTimeout(retry, 3000);
      } else {
        setServerStatus('waking');
        setRetryCount(prev => prev + 1);
        const retry = async () => {
          try {
            const { data } = await axios.get(`${BACKEND_BASE}/health`, { timeout: 8000 });
            if (data.dbReady === false) setServerStatus('db_error');
            else setServerStatus('online');
          } catch {
            setRetryCount(prev => prev + 1);
            wakeTimerRef.current = setTimeout(retry, 5000);
          }
        };
        wakeTimerRef.current = setTimeout(retry, 5000);
      }
    }
  };

  const fetchData = async () => {
    setDataLoading(true);
    setDataError(null);
    try {
      const { data } = await axios.get(`${API_URL}/all`, { timeout: AXIOS_TIMEOUT });
      setProfile(data.profile || {});
      setSkills(data.skills || []);
      setProjects(data.projects || []);
      setExperience(data.experience || []);
      setCertifications(data.certifications || []);
      setEducation(data.education || []);
      setAchievements(data.achievements || []);
      setMessages(data.messages || []);
      setDataError(null);
    } catch (err) {
      console.error('Data fetch error', err);
      const errData = err.response?.data;
      if (errData?.error === 'DB_DISCONNECTED') {
        setDataError('DB_DISCONNECTED: ' + errData.message);
      } else if (errData?.error === 'DB_CONNECTING') {
        setDataError('Database is still starting up — please wait 10 seconds and click Retry.');
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setDataError('Request timed out. The server may be starting up. Click Retry in a moment.');
      } else if (err.response?.status === 500) {
        setDataError('Server error — Check your MONGODB_URI in server .env file.');
      } else if (err.code === 'ERR_NETWORK') {
        setDataError('Network error — backend may be offline. Please check the server terminal.');
      } else {
        setDataError(`Error: ${err.message}`);
      }
    } finally {
      setDataLoading(false);
    }
  };

  const showSaveStatus = (type) => {
    setSaveStatus(type);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
      // If server is already confirmed online, fetch immediately
      // (the useEffect will also trigger, but this is a safety net)
      if (serverStatus === 'online') {
        setTimeout(() => fetchData(), 100);
      }
    } else {
      alert('Incorrect password');
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(profile).forEach(key => {
        if (profile[key] !== null && profile[key] !== undefined) {
          formData.append(key, profile[key]);
        }
      });
      if (profileImage) formData.append('profile_image', profileImage);
      if (collegeImage) formData.append('college_image', collegeImage);

      await axios.put(`${API_URL}/profile`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      showSaveStatus('success');
      setProfileImage(null);
      setCollegeImage(null);
      fetchData();
    } catch (err) {
      console.error(err);
      showSaveStatus('error');
    }
  };

  const submitEntity = async (e, endpoint, formState, setFormState, defaultState, isMultipart = false, imageFile = null) => {
    e.preventDefault();
    try {
      if (isMultipart) {
        const formData = new FormData();
        Object.keys(formState).forEach(key => formData.append(key, formState[key]));
        if (imageFile) formData.append('image', imageFile);
        await axios.post(`${API_URL}/${endpoint}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await axios.post(`${API_URL}/${endpoint}`, formState);
      }
      setFormState(defaultState);
      showSaveStatus('success');
      fetchData();
    } catch (err) {
      console.error(err);
      showSaveStatus('error');
    }
  };

  const deleteRecord = async (endpoint, id) => {
    if (window.confirm('Delete this record?')) {
      try {
        await axios.delete(`${API_URL}/${endpoint}/${id}`, { timeout: AXIOS_TIMEOUT });
        fetchData();
      } catch (err) { console.error(err); }
    }
  };

  const moveItem = async (endpoint, listState, setListState, index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === listState.length - 1) return;
  
    const newList = [...listState];
    const item = newList.splice(index, 1)[0];
    newList.splice(direction === 'up' ? index - 1 : index + 1, 0, item);
  
    setListState(newList);
  
    try {
      // MongoDB uses _id, not id
      await axios.put(`${API_URL}/${endpoint}/reorder`, { orderedIds: newList.map(i => i._id || i.id) }, { timeout: AXIOS_TIMEOUT });
    } catch (err) {
      console.error(err);
      fetchData(); // Revert on failure
    }
  };

  // ── Login Screen ──
  if (!isAuthenticated) {
    const isOnline = serverStatus === 'online';
    const isWaking = serverStatus === 'waking';
    const isChecking = serverStatus === 'checking';
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ width: '420px', textAlign: 'center', borderTop: '4px solid var(--primary-color)' }}>
          <h2 style={{ marginBottom: '0.5rem', color: 'var(--primary-color)' }}>Admin Access</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Enter password to manage your portfolio</p>

          {/* Server status indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
            padding: '0.8rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', fontWeight: '600',
            background: isOnline ? 'rgba(34,197,94,0.1)' : isWaking ? 'rgba(251,191,36,0.1)' : 'rgba(148,163,184,0.1)',
            border: `1px solid ${isOnline ? '#22c55e' : isWaking ? '#fbbf24' : '#64748b'}`,
            color: isOnline ? '#22c55e' : isWaking ? '#fbbf24' : '#94a3b8'
          }}>
            {isOnline && <><CheckCircle size={16} /> Server is online — ready!</>}
            {isWaking && (
              <>
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> 
                Waking server ({retryCount})… 
              </>
            )}
            {isChecking && <><RefreshCw size={16} style={{ animation: 'spin 1.2s linear infinite' }} /> Checking connection…</>}
          </div>

          <form onSubmit={handleLogin}>
            <input
              type="password"
              className="input-field"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ marginBottom: '1.5rem' }}
              autoFocus
            />
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Login</button>
          </form>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Default password: admin123</p>
          {isWaking && (
            <p style={{ marginTop: '0.8rem', color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.6, background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '4px' }}>
              {IS_LOCAL
                ? <><strong style={{color:'#fbbf24'}}>Local server not running!</strong><br/>Run <code style={{background:'rgba(255,255,255,0.1)',padding:'2px 5px',borderRadius:'3px'}}>npm run dev</code> in the server folder.<br/>Then <strong>You can log in now</strong> — data will auto-load.</>
                : <>The backend is on Render's free tier and needs ~30s to wake up.<br/><strong>You can log in now</strong> — data will load automatically.</>}
            </p>
          )}
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Post-login: Server still waking up ──
  if (isAuthenticated && serverStatus !== 'online') {
    const isChecking = serverStatus === 'checking';
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ width: '480px', textAlign: 'center', borderTop: '4px solid #fbbf24' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{isChecking ? '🔍' : '⚡'}</div>
          <h2 style={{ marginBottom: '0.5rem', color: '#fbbf24' }}>
            {isChecking ? 'Connecting…' : 'Server Warming Up'}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            {isChecking
              ? 'Establishing secure connection to the backend...'
              : <>Your backend is waking up from its sleep cycle.<br/>This usually takes <strong style={{ color: '#fbbf24' }}>30–45 seconds</strong> on the free tier.</>}
          </p>

          {/* Animated activity indicator */}
          {serverStatus === 'waking' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ background: 'var(--border-color)', borderRadius: '99px', height: '10px', overflow: 'hidden', marginBottom: '0.75rem', position: 'relative' }}>
                <div style={{
                  height: '100%', borderRadius: '99px',
                  background: 'linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24)',
                  backgroundSize: '200% 100%',
                  width: '40%',
                  position: 'absolute',
                  animation: 'shimmer-slide 1.5s infinite linear'
                }} />
              </div>
              <p style={{ color: '#fbbf24', fontWeight: '600', fontSize: '0.9rem' }}>
                Attempting connection (Attempt #{retryCount})...
              </p>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <RefreshCw size={14} style={{ animation: 'spin 1.2s linear infinite' }} />
            Automatic retries active...
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={pingServer} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
              <RefreshCw size={14} style={{ marginRight: '0.4rem' }} /> Force Retry
            </button>
            <button onClick={() => setIsAuthenticated(false)} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
              <LogOut size={14} style={{ marginRight: '0.4rem' }} /> Cancel
            </button>
          </div>
        </div>
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes shimmer-slide { 
            0% { left: -40%; }
            100% { left: 100%; }
          }
        `}</style>
      </div>
    );
  }

  const TabBtn = ({ name, label }) => (
    <button onClick={() => setActiveTab(name)} className={`btn ${activeTab === name ? 'btn-primary' : 'btn-secondary'}`} style={{ whiteSpace: 'nowrap', borderRadius: '4px' }}>{label}</button>
  );

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: 'var(--text-main)' }}>

      {/* ── Save Status Toast ── */}
      {saveStatus && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
          background: saveStatus === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${saveStatus === 'success' ? '#22c55e' : '#ef4444'}`,
          borderRadius: '8px', padding: '0.75rem 1.5rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          color: saveStatus === 'success' ? '#22c55e' : '#ef4444',
          fontWeight: '600', boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}>
          {saveStatus === 'success'
            ? <><CheckCircle size={18} /> Saved successfully!</>
            : <><AlertCircle size={18} /> Failed to save. Check server.</>}
        </div>
      )}

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem' }}>Dashboard</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={fetchData}
            className="btn btn-secondary"
            disabled={dataLoading}
            title="Refresh data"
          >
            <RefreshCw size={18} style={{ marginRight: '0.5rem', animation: dataLoading ? 'spin 1s linear infinite' : 'none' }} />
            {dataLoading ? 'Loading...' : 'Refresh'}
          </button>
          <Link to="/" className="btn btn-secondary"><ArrowLeft size={18} style={{ marginRight: '0.5rem' }} /> Site</Link>
          <button onClick={() => setIsAuthenticated(false)} className="btn btn-secondary"><LogOut size={18} style={{ marginRight: '0.5rem' }} /> Logout</button>
        </div>
      </header>

      {/* ── Error Banner ── */}
      {dataError && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444',
          borderRadius: '8px', padding: '1rem 1.5rem', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'flex-start', gap: '0.75rem'
        }}>
          <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            {dataError.startsWith('DB_DISCONNECTED') ? (
              <>
                <strong style={{ color: '#ef4444', fontSize: '1rem' }}>⚠️ MongoDB Not Connected</strong>
                <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0', fontSize: '0.9rem', lineHeight: 1.7 }}>
                  Your computer's IP address is <strong>not whitelisted</strong> in MongoDB Atlas.<br/>
                  The database cannot be reached from your current network.
                </p>
                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '6px', padding: '0.75rem 1rem', marginBottom: '0.75rem', fontSize: '0.85rem', lineHeight: 1.8 }}>
                  <strong style={{ color: '#fbbf24' }}>🔧 How to fix:</strong><br/>
                  1. Go to <a href="https://cloud.mongodb.com" target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>cloud.mongodb.com</a><br/>
                  2. Click <strong>Network Access</strong> in the left menu<br/>
                  3. Click <strong>+ Add IP Address</strong><br/>
                  4. Click <strong>Allow Access from Anywhere</strong> (adds 0.0.0.0/0)<br/>
                  5. Click <strong>Confirm</strong> — then click Retry below
                </div>
                <button onClick={fetchData} className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>
                  <RefreshCw size={14} style={{ marginRight: '0.4rem' }} /> Retry Connection
                </button>
              </>
            ) : (
              <>
                <strong style={{ color: '#ef4444' }}>Connection Error</strong>
                <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0.75rem', fontSize: '0.9rem' }}>{dataError}</p>
                <button onClick={fetchData} className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>
                  <RefreshCw size={14} style={{ marginRight: '0.4rem' }} /> Retry Connection
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Loading Overlay (only shown for refresh, not initial load) ── */}
      {dataLoading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }} />
          <p>Refreshing data…</p>
        </div>
      )}

      {/* ── Tab Navigation ── */}
      {!dataLoading && (
        <>
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)' }}>
            <TabBtn name="profile" label="Profile Info" />
            <TabBtn name="skills" label="Skills" />
            <TabBtn name="projects" label="Projects" />
            <TabBtn name="experience" label="Experience" />
            <TabBtn name="certifications" label="Certifications" />
            <TabBtn name="education" label="Education" />
            <TabBtn name="achievements" label="Achievements" />
            <TabBtn name="messages" label={`Messages${messages.length > 0 ? ` (${messages.length})` : ''}`} />
          </div>

          {/* ── Profile Tab ── */}
          {activeTab === 'profile' && (
            <div className="glass-panel" style={{ borderTop: '4px solid var(--primary-color)' }}>
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>Edit Identity & About</h3>
              <form onSubmit={handleProfileSave}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group"><label className="form-label">Name</label><input type="text" className="input-field" value={profile.name || ''} onChange={e => setProfile({...profile, name: e.target.value})} /></div>
                  <div className="form-group"><label className="form-label">Field</label><input type="text" className="input-field" value={profile.field || ''} onChange={e => setProfile({...profile, field: e.target.value})} /></div>
                  <div className="form-group"><label className="form-label">University</label><input type="text" className="input-field" value={profile.university || ''} onChange={e => setProfile({...profile, university: e.target.value})} /></div>
                  <div className="form-group"><label className="form-label">Location</label><input type="text" className="input-field" value={profile.location || ''} onChange={e => setProfile({...profile, location: e.target.value})} /></div>
                  <div className="form-group"><label className="form-label">Career Goal</label><input type="text" className="input-field" value={profile.career_goal || ''} onChange={e => setProfile({...profile, career_goal: e.target.value})} /></div>
                  <div className="form-group"><label className="form-label">Tagline</label><input type="text" className="input-field" value={profile.tagline || ''} onChange={e => setProfile({...profile, tagline: e.target.value})} /></div>
                  <div className="form-group"><label className="form-label">GitHub URL</label><input type="text" className="input-field" value={profile.social_github || ''} onChange={e => setProfile({...profile, social_github: e.target.value})} /></div>
                  <div className="form-group"><label className="form-label">LinkedIn URL</label><input type="text" className="input-field" value={profile.social_linkedin || ''} onChange={e => setProfile({...profile, social_linkedin: e.target.value})} /></div>
                  <div className="form-group"><label className="form-label">Instagram URL</label><input type="text" className="input-field" value={profile.social_instagram || ''} onChange={e => setProfile({...profile, social_instagram: e.target.value})} /></div>
                  <div className="form-group"><label className="form-label">Email Address</label><input type="email" className="input-field" value={profile.social_email || ''} onChange={e => setProfile({...profile, social_email: e.target.value})} /></div>
                  <div className="form-group"><label className="form-label">Resume URL (PDF link)</label><input type="text" className="input-field" placeholder="https://drive.google.com/..." value={profile.resume_url || ''} onChange={e => setProfile({...profile, resume_url: e.target.value})} /></div>
                  <div className="form-group"><label className="form-label">Welcome Message</label><input type="text" className="input-field" placeholder="Welcome to my portfolio!" value={profile.welcome_message || ''} onChange={e => setProfile({...profile, welcome_message: e.target.value})} /></div>
                  
                  <div className="form-group">
                    <label className="form-label">Profile Photo</label>
                    {profile.profile_image && (
                      <img
                        src={resolveImg(profile.profile_image)}
                        alt="Profile Preview"
                        style={{width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', display: 'block', marginBottom: '0.5rem', border: '2px solid var(--primary-color)'}}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <input type="file" className="input-field" accept="image/*" onChange={e => setProfileImage(e.target.files[0])} />
                    {profile.profile_image && <div style={{marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--primary-color)'}}>Current image exists. Upload new to overwrite.</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">College/Hero Photo</label>
                    {profile.college_image && (
                      <img
                        src={resolveImg(profile.college_image)}
                        alt="College Preview"
                        style={{width: 80, height: 60, borderRadius: '8px', objectFit: 'cover', display: 'block', marginBottom: '0.5rem', border: '1px solid var(--border-color)'}}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <input type="file" className="input-field" accept="image/*" onChange={e => setCollegeImage(e.target.files[0])} />
                    {profile.college_image && <div style={{marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--primary-color)'}}>Current image exists. Upload new to overwrite.</div>}
                  </div>
                </div>
                <div className="form-group"><label className="form-label">About - Background</label><textarea className="input-field" rows="3" value={profile.about_background || ''} onChange={e => setProfile({...profile, about_background: e.target.value})}></textarea></div>
                <div className="form-group"><label className="form-label">About - Interests</label><input type="text" className="input-field" value={profile.about_interests || ''} onChange={e => setProfile({...profile, about_interests: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">My Journey (Extra Section)</label><textarea className="input-field" rows="4" value={profile.journey_text || ''} onChange={e => setProfile({...profile, journey_text: e.target.value})}></textarea></div>
                <button type="submit" className="btn btn-primary"><Save size={18} style={{ marginRight: '0.5rem' }} /> Save Changes</button>
              </form>
            </div>
          )}

          {/* ── Entity List Tabs (Skills, Experience, Certifications, Education) ── */}
          {['skills', 'experience', 'certifications', 'education'].includes(activeTab) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
              <div className="glass-panel" style={{ borderTop: '4px solid var(--secondary-color)' }}>
                <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>Add New</h3>
                
                {activeTab === 'skills' && (
                  <form onSubmit={e => submitEntity(e, 'skills', skillForm, setSkillForm, { category: 'Technical', name: '' })}>
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select className="input-field" value={skillForm.category} onChange={e => setSkillForm({...skillForm, category: e.target.value})}>
                        <option value="Technical">Technical</option>
                        <option value="Soft">Soft</option>
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">Skill Name(s) — comma separated</label><input type="text" className="input-field" required placeholder="e.g. React, Node.js, Python" value={skillForm.name} onChange={e => setSkillForm({...skillForm, name: e.target.value})} /></div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}><Plus size={18} style={{ marginRight: '0.5rem' }} /> Add</button>
                  </form>
                )}

                {activeTab === 'experience' && (
                  <form onSubmit={e => submitEntity(e, 'experience', expForm, setExpForm, { role: '', company: '', period: '', description: '' })}>
                    <div className="form-group"><label className="form-label">Role</label><input type="text" className="input-field" required value={expForm.role} onChange={e => setExpForm({...expForm, role: e.target.value})} /></div>
                    <div className="form-group"><label className="form-label">Company</label><input type="text" className="input-field" required value={expForm.company} onChange={e => setExpForm({...expForm, company: e.target.value})} /></div>
                    <div className="form-group"><label className="form-label">Period</label><input type="text" className="input-field" placeholder="Jun 2023 - Aug 2023" value={expForm.period} onChange={e => setExpForm({...expForm, period: e.target.value})} /></div>
                    <div className="form-group"><label className="form-label">Description</label><textarea className="input-field" rows="3" value={expForm.description} onChange={e => setExpForm({...expForm, description: e.target.value})}></textarea></div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}><Plus size={18} style={{ marginRight: '0.5rem' }} /> Add</button>
                  </form>
                )}

                {activeTab === 'certifications' && (
                  <form onSubmit={e => submitEntity(e, 'certifications', certForm, setCertForm, { title: '', issuer: '', year: '' })}>
                    <div className="form-group"><label className="form-label">Title</label><input type="text" className="input-field" required value={certForm.title} onChange={e => setCertForm({...certForm, title: e.target.value})} /></div>
                    <div className="form-group"><label className="form-label">Issuer</label><input type="text" className="input-field" value={certForm.issuer} onChange={e => setCertForm({...certForm, issuer: e.target.value})} /></div>
                    <div className="form-group"><label className="form-label">Year</label><input type="text" className="input-field" value={certForm.year} onChange={e => setCertForm({...certForm, year: e.target.value})} /></div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}><Plus size={18} style={{ marginRight: '0.5rem' }} /> Add</button>
                  </form>
                )}

                {activeTab === 'education' && (
                  <form onSubmit={e => submitEntity(e, 'education', eduForm, setEduForm, { degree: '', institution: '', year: '', description: '' })}>
                    <div className="form-group"><label className="form-label">Degree</label><input type="text" className="input-field" required value={eduForm.degree} onChange={e => setEduForm({...eduForm, degree: e.target.value})} /></div>
                    <div className="form-group"><label className="form-label">Institution</label><input type="text" className="input-field" required value={eduForm.institution} onChange={e => setEduForm({...eduForm, institution: e.target.value})} /></div>
                    <div className="form-group"><label className="form-label">Year</label><input type="text" className="input-field" value={eduForm.year} onChange={e => setEduForm({...eduForm, year: e.target.value})} /></div>
                    <div className="form-group"><label className="form-label">Description</label><textarea className="input-field" rows="2" value={eduForm.description} onChange={e => setEduForm({...eduForm, description: e.target.value})}></textarea></div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}><Plus size={18} style={{ marginRight: '0.5rem' }} /> Add</button>
                  </form>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {activeTab === 'skills' && skills.map((item, index) => (
                  <div key={item.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderLeft: '4px solid var(--primary-color)' }}>
                    <div><h4 style={{ color: 'var(--primary-color)' }}>{item.name}</h4><p style={{ color: 'var(--text-muted)' }}>{item.category}</p></div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => moveItem('skills', skills, setSkills, index, 'up')} className="btn btn-secondary" style={{ padding: '0.5rem' }} disabled={index===0}><ArrowUp size={18} /></button>
                      <button onClick={() => moveItem('skills', skills, setSkills, index, 'down')} className="btn btn-secondary" style={{ padding: '0.5rem' }} disabled={index===skills.length-1}><ArrowDown size={18} /></button>
                      <button onClick={() => deleteRecord('skills', item.id)} className="btn btn-secondary" style={{ padding: '0.5rem' }}><Trash2 size={18} color="var(--accent-color)" /></button>
                    </div>
                  </div>
                ))}
                {activeTab === 'experience' && experience.map((item, index) => (
                  <div key={item.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderLeft: '4px solid var(--primary-color)' }}>
                    <div><h4 style={{ color: 'var(--primary-color)' }}>{item.role}</h4><p style={{ color: 'var(--text-muted)' }}>{item.company} ({item.period})</p></div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => moveItem('experience', experience, setExperience, index, 'up')} className="btn btn-secondary" style={{ padding: '0.5rem' }} disabled={index===0}><ArrowUp size={18} /></button>
                      <button onClick={() => moveItem('experience', experience, setExperience, index, 'down')} className="btn btn-secondary" style={{ padding: '0.5rem' }} disabled={index===experience.length-1}><ArrowDown size={18} /></button>
                      <button onClick={() => deleteRecord('experience', item.id)} className="btn btn-secondary" style={{ padding: '0.5rem' }}><Trash2 size={18} color="var(--accent-color)" /></button>
                    </div>
                  </div>
                ))}
                {activeTab === 'certifications' && certifications.map((item, index) => (
                  <div key={item.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderLeft: '4px solid var(--primary-color)' }}>
                    <div><h4 style={{ color: 'var(--primary-color)' }}>{item.title}</h4><p style={{ color: 'var(--text-muted)' }}>{item.issuer} ({item.year})</p></div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => moveItem('certifications', certifications, setCertifications, index, 'up')} className="btn btn-secondary" style={{ padding: '0.5rem' }} disabled={index===0}><ArrowUp size={18} /></button>
                      <button onClick={() => moveItem('certifications', certifications, setCertifications, index, 'down')} className="btn btn-secondary" style={{ padding: '0.5rem' }} disabled={index===certifications.length-1}><ArrowDown size={18} /></button>
                      <button onClick={() => deleteRecord('certifications', item.id)} className="btn btn-secondary" style={{ padding: '0.5rem' }}><Trash2 size={18} color="var(--accent-color)" /></button>
                    </div>
                  </div>
                ))}
                {activeTab === 'education' && education.map((item, index) => (
                  <div key={item.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderLeft: '4px solid var(--primary-color)' }}>
                    <div><h4 style={{ color: 'var(--primary-color)' }}>{item.degree}</h4><p style={{ color: 'var(--text-muted)' }}>{item.institution}</p></div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => moveItem('education', education, setEducation, index, 'up')} className="btn btn-secondary" style={{ padding: '0.5rem' }} disabled={index===0}><ArrowUp size={18} /></button>
                      <button onClick={() => moveItem('education', education, setEducation, index, 'down')} className="btn btn-secondary" style={{ padding: '0.5rem' }} disabled={index===education.length-1}><ArrowDown size={18} /></button>
                      <button onClick={() => deleteRecord('education', item.id)} className="btn btn-secondary" style={{ padding: '0.5rem' }}><Trash2 size={18} color="var(--accent-color)" /></button>
                    </div>
                  </div>
                ))}

                {/* Empty state */}
                {activeTab === 'skills' && skills.length === 0 && !dataError && <p style={{ color: 'var(--text-muted)' }}>No skills added yet. Add one using the form.</p>}
                {activeTab === 'experience' && experience.length === 0 && !dataError && <p style={{ color: 'var(--text-muted)' }}>No experience added yet.</p>}
                {activeTab === 'certifications' && certifications.length === 0 && !dataError && <p style={{ color: 'var(--text-muted)' }}>No certifications added yet.</p>}
                {activeTab === 'education' && education.length === 0 && !dataError && <p style={{ color: 'var(--text-muted)' }}>No education records yet.</p>}
              </div>
            </div>
          )}

          {/* ── Projects & Achievements (Multipart) ── */}
          {['projects', 'achievements'].includes(activeTab) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
              <div className="glass-panel" style={{ borderTop: '4px solid var(--secondary-color)' }}>
                <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>Add New</h3>
                
                {activeTab === 'projects' && (
                  <form onSubmit={e => {
                    submitEntity(e, 'projects', projForm, setProjForm, { title: '', problem: '', solution: '', tools: '', role: '', outcome: '', github_url: '', live_url: '' }, true, projImage);
                    setProjImage(null);
                    e.target.reset();
                  }}>
                    <div className="form-group"><label className="form-label">Title *</label><input type="text" className="input-field" required value={projForm.title} onChange={e => setProjForm({...projForm, title: e.target.value})} /></div>
                    <div className="form-group"><label className="form-label">Problem</label><textarea className="input-field" rows="2" value={projForm.problem} onChange={e => setProjForm({...projForm, problem: e.target.value})}></textarea></div>
                    <div className="form-group"><label className="form-label">Solution</label><textarea className="input-field" rows="2" value={projForm.solution} onChange={e => setProjForm({...projForm, solution: e.target.value})}></textarea></div>
                    <div className="form-group"><label className="form-label">Tools (comma-separated)</label><input type="text" className="input-field" placeholder="React, Node.js, MongoDB" value={projForm.tools} onChange={e => setProjForm({...projForm, tools: e.target.value})} /></div>
                    <div className="form-group"><label className="form-label">Your Role</label><input type="text" className="input-field" value={projForm.role} onChange={e => setProjForm({...projForm, role: e.target.value})} /></div>
                    <div className="form-group"><label className="form-label">Outcome</label><input type="text" className="input-field" value={projForm.outcome} onChange={e => setProjForm({...projForm, outcome: e.target.value})} /></div>
                    <div className="form-group"><label className="form-label">GitHub URL</label><input type="text" className="input-field" placeholder="https://github.com/user/repo" value={projForm.github_url} onChange={e => setProjForm({...projForm, github_url: e.target.value})} /></div>
                    <div className="form-group"><label className="form-label">Live Demo URL</label><input type="text" className="input-field" placeholder="https://myapp.vercel.app" value={projForm.live_url} onChange={e => setProjForm({...projForm, live_url: e.target.value})} /></div>
                    <div className="form-group"><label className="form-label">Image</label><input type="file" className="input-field" accept="image/*" onChange={e => setProjImage(e.target.files[0])} /></div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}><Plus size={18} /> Add Project</button>
                  </form>
                )}

                {activeTab === 'achievements' && (
                  <form onSubmit={e => {
                    submitEntity(e, 'achievements', achForm, setAchForm, { title: '', date: '', description: '' }, true, achImage);
                    setAchImage(null);
                    e.target.reset();
                  }}>
                    <div className="form-group"><label className="form-label">Title *</label><input type="text" className="input-field" required value={achForm.title} onChange={e => setAchForm({...achForm, title: e.target.value})} /></div>
                    <div className="form-group"><label className="form-label">Date</label><input type="text" className="input-field" placeholder="March 2024" value={achForm.date} onChange={e => setAchForm({...achForm, date: e.target.value})} /></div>
                    <div className="form-group"><label className="form-label">Description</label><textarea className="input-field" rows="3" value={achForm.description} onChange={e => setAchForm({...achForm, description: e.target.value})}></textarea></div>
                    <div className="form-group"><label className="form-label">Image</label><input type="file" className="input-field" accept="image/*" onChange={e => setAchImage(e.target.files[0])} /></div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}><Plus size={18} /> Add Achievement</button>
                  </form>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {activeTab === 'projects' && projects.map((item, index) => (
                  <div key={item.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderLeft: '4px solid var(--primary-color)' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      {item.image_url && (
                        <img
                          src={resolveImg(item.image_url)}
                          style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                          alt=""
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      )}
                      <div><h4 style={{ color: 'var(--primary-color)' }}>{item.title}</h4><p style={{ color: 'var(--text-muted)' }}>{item.tools}</p></div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => moveItem('projects', projects, setProjects, index, 'up')} className="btn btn-secondary" style={{ padding: '0.5rem' }} disabled={index===0}><ArrowUp size={18} /></button>
                      <button onClick={() => moveItem('projects', projects, setProjects, index, 'down')} className="btn btn-secondary" style={{ padding: '0.5rem' }} disabled={index===projects.length-1}><ArrowDown size={18} /></button>
                      <button onClick={() => deleteRecord('projects', item.id)} className="btn btn-secondary" style={{ padding: '0.5rem' }}><Trash2 size={18} color="var(--accent-color)" /></button>
                    </div>
                  </div>
                ))}
                {activeTab === 'achievements' && achievements.map((item, index) => (
                  <div key={item.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderLeft: '4px solid var(--primary-color)' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      {item.image_url && (
                        <img
                          src={resolveImg(item.image_url)}
                          style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                          alt=""
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      )}
                      <div><h4 style={{ color: 'var(--primary-color)' }}>{item.title}</h4><p style={{ color: 'var(--text-muted)' }}>{item.date}</p></div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => moveItem('achievements', achievements, setAchievements, index, 'up')} className="btn btn-secondary" style={{ padding: '0.5rem' }} disabled={index===0}><ArrowUp size={18} /></button>
                      <button onClick={() => moveItem('achievements', achievements, setAchievements, index, 'down')} className="btn btn-secondary" style={{ padding: '0.5rem' }} disabled={index===achievements.length-1}><ArrowDown size={18} /></button>
                      <button onClick={() => deleteRecord('achievements', item.id)} className="btn btn-secondary" style={{ padding: '0.5rem' }}><Trash2 size={18} color="var(--accent-color)" /></button>
                    </div>
                  </div>
                ))}

                {activeTab === 'projects' && projects.length === 0 && !dataError && <p style={{ color: 'var(--text-muted)' }}>No projects yet. Add one!</p>}
                {activeTab === 'achievements' && achievements.length === 0 && !dataError && <p style={{ color: 'var(--text-muted)' }}>No achievements yet.</p>}
              </div>
            </div>
          )}

          {/* ── Messages Tab ── */}
          {activeTab === 'messages' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {messages.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No messages received yet.</p>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className="glass-panel" style={{ borderTop: '4px solid var(--primary-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <h4 style={{ color: 'var(--primary-color)' }}>{msg.name}</h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(msg.created_at).toLocaleDateString()}</span>
                    </div>
                    {msg.email && <div style={{ color: 'var(--secondary-color)', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: '500' }}>{msg.email}</div>}
                    <p style={{ color: 'var(--text-main)', fontStyle: 'italic', background: 'var(--bg-main)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>"{msg.message}"</p>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Spin animation style */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Admin;

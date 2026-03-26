import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { portfolioData } from '../portfolioData';
import { 
  Mail, GraduationCap, Award, Send, Download,
  User, Code, Briefcase, Terminal, BookOpen, Star, Github, Linkedin, Instagram,
  ExternalLink, MapPin, Zap, Globe, Sun, Moon, RefreshCw
} from 'lucide-react';

const API_URL = 'https://portfolio-backend-i9vy.onrender.com/api';
const BACKEND_BASE = 'https://portfolio-backend-i9vy.onrender.com';

// Helper: resolve image URL — Cloudinary images are already full URLs
const resolveImg = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BACKEND_BASE}${url}`;
};

// Skill Icon Component using devicons
const SkillBadge = ({ name }) => {
  const iconMap = {
    'html': { icon: '🌐', color: '#e34f26', bg: 'rgba(227,79,38,0.15)' },
    'css': { icon: '🎨', color: '#1572b6', bg: 'rgba(21,114,182,0.15)' },
    'javascript': { icon: 'JS', color: '#f7df1e', bg: 'rgba(247,223,30,0.15)', text: true },
    'typescript': { icon: 'TS', color: '#3178c6', bg: 'rgba(49,120,198,0.15)', text: true },
    'react': { icon: '⚛', color: '#61dafb', bg: 'rgba(97,218,251,0.15)' },
    'react.js': { icon: '⚛', color: '#61dafb', bg: 'rgba(97,218,251,0.15)' },
    'node.js': { icon: '🟢', color: '#339933', bg: 'rgba(51,153,51,0.15)' },
    'node': { icon: '🟢', color: '#339933', bg: 'rgba(51,153,51,0.15)' },
    'express': { icon: '⚡', color: '#ffffff', bg: 'rgba(255,255,255,0.1)' },
    'express.js': { icon: '⚡', color: '#ffffff', bg: 'rgba(255,255,255,0.1)' },
    'mongodb': { icon: '🍃', color: '#47a248', bg: 'rgba(71,162,72,0.15)' },
    'python': { icon: '🐍', color: '#3776ab', bg: 'rgba(55,118,171,0.15)' },
    'git': { icon: '🌿', color: '#f05032', bg: 'rgba(240,80,50,0.15)' },
    'github': { icon: '🐙', color: '#ffffff', bg: 'rgba(255,255,255,0.1)' },
    'tailwind': { icon: '💨', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
    'tailwind css': { icon: '💨', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
    'figma': { icon: '🎭', color: '#f24e1e', bg: 'rgba(242,78,30,0.15)' },
    'sql': { icon: '🗄️', color: '#336791', bg: 'rgba(51,103,145,0.15)' },
    'rest apis': { icon: '🔌', color: '#61dafb', bg: 'rgba(97,218,251,0.15)' },
    'jwt': { icon: '🔐', color: '#d63aff', bg: 'rgba(214,58,255,0.15)' },
    'tensorflow': { icon: '🧠', color: '#ff6f00', bg: 'rgba(255,111,0,0.15)' },
    'flask': { icon: '🧪', color: '#ffffff', bg: 'rgba(255,255,255,0.1)' },
    'vercel': { icon: '▲', color: '#ffffff', bg: 'rgba(255,255,255,0.1)' },
  };
  
  const key = name.toLowerCase().trim();
  const match = iconMap[key] || { icon: '⚙', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' };
  
  return (
    <div className="skill-badge" style={{ background: match.bg, borderColor: match.color + '40' }}>
      <span className="skill-icon" style={{ color: match.text ? match.color : 'inherit' }}>
        {match.icon}
      </span>
      <span className="skill-name" style={{ color: match.color }}>{name}</span>
    </div>
  );
};

// Typing animation hook
const useTypingEffect = (words, speed = 100, pause = 1800) => {
  const [displayed, setDisplayed] = useState('');
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!words || words.length === 0) return;
    const current = words[wordIdx];
    let timeout;
    if (!deleting && charIdx < current.length) {
      timeout = setTimeout(() => setCharIdx(i => i + 1), speed);
    } else if (!deleting && charIdx === current.length) {
      timeout = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIdx > 0) {
      timeout = setTimeout(() => setCharIdx(i => i - 1), speed / 2);
    } else if (deleting && charIdx === 0) {
      setDeleting(false);
      setWordIdx(i => (i + 1) % words.length);
    }
    setDisplayed(current.slice(0, charIdx));
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, wordIdx, words, speed, pause]);

  return displayed;
};

// GitHub Stats Widget
const GitHubStats = ({ username }) => {
  if (!username) return null;
  // Extract username from URL
  const ghUser = username.replace('https://github.com/', '').replace('http://github.com/', '').split('/')[0];
  if (!ghUser || ghUser === 'github.com') return null;

  return (
    <div className="github-stats-grid">
      <img
        src={`https://github-readme-stats.vercel.app/api?username=${ghUser}&show_icons=true&theme=midnight-purple&hide_border=true&bg_color=00000000&title_color=a78bfa&text_color=ededed&icon_color=60a5fa&count_private=true`}
        alt="GitHub Stats"
        className="gh-stat-img"
        loading="lazy"
      />
      <img
        src={`https://github-readme-streak-stats.herokuapp.com/?user=${ghUser}&theme=midnight-purple&hide_border=true&background=00000000&stroke=a78bfa&ring=60a5fa&fire=ec4899&currStreakLabel=ededed`}
        alt="GitHub Streak"
        className="gh-stat-img"
        loading="lazy"
      />
      <img
        src={`https://github-readme-stats.vercel.app/api/top-langs/?username=${ghUser}&layout=compact&theme=midnight-purple&hide_border=true&bg_color=00000000&title_color=a78bfa&text_color=ededed&langs_count=6`}
        alt="Top Languages"
        className="gh-stat-img"
        loading="lazy"
      />
    </div>
  );
};

const TechStackCard = ({ title, color, tags }) => (
  <div className="tech-card" style={{ borderColor: color + '30', background: color + '08' }}>
    <div className="tech-card-header" style={{ color }}>
      <span className="tech-dot" style={{ background: color }}></span>
      {title}
    </div>
    <div className="tech-tags">
      {tags.map(t => (
        <span key={t} className="tech-tag" style={{ borderColor: color + '50', color }}>{t}</span>
      ))}
    </div>
  </div>
);

const Home = () => {
  // ── Initialize with fallback data so page loads INSTANTLY ──
  const [profile, setProfile] = useState(portfolioData.profile || {});
  const [skills, setSkills] = useState(portfolioData.skills || []);
  const [projects, setProjects] = useState(portfolioData.projects || []);
  const [experience, setExperience] = useState(portfolioData.experience || []);
  const [certifications, setCertifications] = useState(portfolioData.certifications || []);
  const [education, setEducation] = useState(portfolioData.education || []);
  const [achievements, setAchievements] = useState(portfolioData.achievements || []);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactStatus, setContactStatus] = useState(null);
  // Start as false so the page renders immediately — no blank loading screen!
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(true); // subtle background sync indicator
  const [syncError, setSyncError] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const keepAliveRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const typingWords = ['MERN Developer', 'AI/ML Enthusiast', 'Full Stack Engineer', 'React Specialist', 'Problem Solver'];
  const typedText = useTypingEffect(typingWords);

  useEffect(() => {
    // Fetch latest data from backend in background (non-blocking)
    fetchData();

    // Keep-alive ping every 10 minutes to prevent Render cold starts
    keepAliveRef.current = setInterval(() => {
      fetch(`${BACKEND_BASE}/health`).catch(() => {});
    }, 10 * 60 * 1000);

    return () => {
      if (keepAliveRef.current) clearInterval(keepAliveRef.current);
    };
  }, []);

  // Scroll spy for nav highlight — runs on mount (not gated by loading)
  useEffect(() => {
    const sections = ['about', 'skills', 'projects', 'experience', 'contact'];
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); }),
      { threshold: 0.3 }
    );
    sections.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []); // Runs immediately, no dependency on loading

  // Scroll reveal animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('reveal-visible'); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []); // Runs immediately

  const fetchData = async () => {
    setSyncing(true);
    setSyncError(false);
    try {
      // 15 second timeout — Render cold start can take up to 60s but we won't block the UI
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const [profRes, skillRes, projRes, expRes, certRes, eduRes, achRes] = await Promise.all([
        axios.get(`${API_URL}/profile`, { signal: controller.signal }),
        axios.get(`${API_URL}/skills`, { signal: controller.signal }),
        axios.get(`${API_URL}/projects`, { signal: controller.signal }),
        axios.get(`${API_URL}/experience`, { signal: controller.signal }),
        axios.get(`${API_URL}/certifications`, { signal: controller.signal }),
        axios.get(`${API_URL}/education`, { signal: controller.signal }),
        axios.get(`${API_URL}/achievements`, { signal: controller.signal }),
      ]);
      clearTimeout(timeoutId);

      if (profRes.data) setProfile(profRes.data);
      if (skillRes.data) setSkills(skillRes.data);
      if (projRes.data) setProjects(projRes.data);
      if (expRes.data) setExperience(expRes.data);
      if (certRes.data) setCertifications(certRes.data);
      if (eduRes.data) setEducation(eduRes.data);
      if (achRes.data) setAchievements(achRes.data);
    } catch (error) {
      if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
        console.warn('Backend not reachable, showing fallback data:', error.message);
        setSyncError(true);
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/contact`, contactForm);
      setContactStatus('success');
      setContactForm({ name: '', email: '', message: '' });
      setTimeout(() => setContactStatus(null), 4000);
    } catch (error) {
      setContactStatus('error');
    }
  };

  const handleInputChange = (e) => {
    setContactForm({ ...contactForm, [e.target.name]: e.target.value });
  };

  const technicalSkills = skills.filter(s => s.category?.toLowerCase() === 'technical');
  const softSkills = skills.filter(s => s.category?.toLowerCase() === 'soft');

  // Parse comma-separated skill names into individual badges
  const allTechSkillNames = technicalSkills.flatMap(s => s.name.split(',').map(n => n.trim()).filter(Boolean));
  const allSoftSkillNames = softSkills.flatMap(s => s.name.split(',').map(n => n.trim()).filter(Boolean));

  return (
    <div className="portfolio-root">
      {/* Animated Background */}
      <div className="bg-grid"></div>
      <div className="bg-glow bg-glow-1"></div>
      <div className="bg-glow bg-glow-2"></div>
      <div className="bg-glow bg-glow-3"></div>

      {/* ── Subtle sync status bar ── */}
      {syncing && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: '3px', zIndex: 9999,
          background: 'linear-gradient(90deg, var(--primary-color), var(--secondary-color), var(--accent-color))',
          animation: 'shimmer 1.5s infinite',
        }} />
      )}
      {syncError && !syncing && (
        <div style={{
          position: 'fixed', bottom: '1rem', right: '1rem', zIndex: 9999,
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: '8px', padding: '0.75rem 1rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontSize: '0.85rem', color: 'var(--text-muted)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}>
          <span>⚠️ Showing cached data</span>
          <button onClick={fetchData} style={{
            background: 'var(--primary-color)', border: 'none', color: 'white',
            borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.8rem'
          }}>
            Retry
          </button>
        </div>
      )}

      {/* ── NAV ── */}
      <nav className="magic-nav animate-fade-in">
        <a href="#about" className={activeSection === 'about' ? 'nav-active' : ''}>About</a>
        <a href="#skills" className={activeSection === 'skills' ? 'nav-active' : ''}>Skills</a>
        <a href="#projects" className={activeSection === 'projects' ? 'nav-active' : ''}>Projects</a>
        <a href="#experience" className={activeSection === 'experience' ? 'nav-active' : ''}>Experience</a>
        <a href="#contact" className="magic-nav-btn">Let's Talk</a>
        <button onClick={toggleTheme} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Toggle Theme">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </nav>

      {/* ── HERO ── */}
      <header className="hero-section">
        <div className="hero-glow"></div>

        {/* Floating decorative emojis */}
        <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Gear.png" alt="" className="floating-3d" style={{ width: '110px', top: '22%', left: '7%', opacity: 0.8 }} />
        <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Rocket.png" alt="" className="floating-3d reverse" style={{ width: '130px', bottom: '12%', left: '18%', filter: 'drop-shadow(0 20px 30px rgba(236,72,153,0.5))' }} />
        <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Laptop.png" alt="" className="floating-3d" style={{ width: '100px', top: '18%', right: '8%', opacity: 0.9 }} />
        <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Sparkles.png" alt="" className="floating-3d reverse" style={{ width: '90px', bottom: '20%', right: '12%' }} />

        {profile.profile_image ? (
          <img
            src={resolveImg(profile.profile_image)}
            alt="Profile"
            className="hero-avatar animate-fade-in"
          />
        ) : (
          <div className="hero-avatar-placeholder animate-fade-in">
            <User size={64} color="white" />
          </div>
        )}

        <div className="hero-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {profile.welcome_message && (
            <div className="welcome-badge">
              {profile.welcome_message}
            </div>
          )}
          <div className="hero-badge">
            <Zap size={14} />
            <span>Available for Work</span>
          </div>

          <h1 className="hero-name text-gradient">{profile.name || 'Your Name'}</h1>

          <div className="hero-role-line">
            <span className="hero-role-static">I'm a </span>
            <span className="hero-role-typed">{typedText}<span className="typing-cursor">|</span></span>
          </div>

          {profile.location && (
            <div className="hero-location">
              <MapPin size={16} />
              <span>{profile.location}</span>
            </div>
          )}

          <p className="hero-tagline">{profile.tagline}</p>

          <div className="hero-cta-row">
            <a href="#projects" className="btn btn-primary">
              <Code size={18} /> View Projects
            </a>
            {profile.resume_url ? (
              <a href={profile.resume_url} download className="btn btn-secondary">
                <Download size={18} /> Resume
              </a>
            ) : (
              <a href="#contact" className="btn btn-secondary">
                <Mail size={18} /> Contact Me
              </a>
            )}
          </div>

          <div className="hero-socials">
            {profile.social_github && (
              <a href={profile.social_github} target="_blank" rel="noreferrer" className="social-icon-btn" title="GitHub">
                <Github size={20} />
              </a>
            )}
            {profile.social_linkedin && (
              <a href={profile.social_linkedin} target="_blank" rel="noreferrer" className="social-icon-btn" title="LinkedIn">
                <Linkedin size={20} />
              </a>
            )}
            {profile.social_instagram && (
              <a href={profile.social_instagram} target="_blank" rel="noreferrer" className="social-icon-btn" style={{ '--h': '#e1306c' }} title="Instagram">
                <Instagram size={20} />
              </a>
            )}
            {profile.social_email && (
              <a href={`mailto:${profile.social_email}`} className="social-icon-btn" style={{ '--h': '#ec4899' }} title="Email">
                <Mail size={20} />
              </a>
            )}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="scroll-hint">
          <div className="scroll-mouse"><div className="scroll-dot"></div></div>
          <span>Scroll down</span>
        </div>
      </header>

      {/* ── TECH STACK OVERVIEW ── */}
      <section className="section-container reveal">
        <div className="section-header">
          <Terminal size={28} color="var(--primary-color)" />
          <h2 className="section-title">Tech Stack</h2>
        </div>
        <div className="tech-stack-grid">
          <TechStackCard title="Frontend" color="#61dafb" tags={['React.js', 'HTML', 'CSS', 'JavaScript', 'Tailwind CSS']} />
          <TechStackCard title="Backend" color="#339933" tags={['Node.js', 'Express.js', 'REST APIs', 'JWT Auth']} />
          <TechStackCard title="Database" color="#47a248" tags={['MongoDB', 'Mongoose', 'SQLite', 'SQL']} />
          <TechStackCard title="Tools & AI" color="#8b5cf6" tags={['Git', 'GitHub', 'Figma', 'Python', 'TensorFlow', 'Vercel']} />
        </div>
      </section>

      <main className="main-container">

        {/* ── ABOUT ── */}
        <section id="about" className="bento-card reveal">
          <div className="section-header">
            <User size={28} color="var(--primary-color)" />
            <h2 className="section-title">About Me</h2>
          </div>
          <div className="about-grid">
            {profile.college_image && (
              <div className="about-image-wrap">
                <img src={resolveImg(profile.college_image)} alt="Campus" className="about-image" />
              </div>
            )}
            <div className="about-content">
              <div className="about-block">
                <h3 className="about-label" style={{ color: 'var(--primary-color)' }}>🧑‍💻 Background</h3>
                <p className="about-text">{profile.about_background}</p>
              </div>
              <div className="about-block">
                <h3 className="about-label" style={{ color: 'var(--secondary-color)' }}>🔥 Interests & Goals</h3>
                <p className="about-text"><strong>Interests:</strong> {profile.about_interests}</p>
                <p className="about-text" style={{ marginTop: '0.5rem' }}><strong>Goal:</strong> <span style={{ color: 'var(--text-main)' }}>{profile.career_goal}</span></p>
              </div>
              {profile.journey_text && (
                <div className="about-block">
                  <h3 className="about-label" style={{ color: 'var(--accent-color)' }}>🚀 My Journey</h3>
                  <p className="about-text">{profile.journey_text}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── SKILLS ── */}
        <section id="skills" className="bento-card reveal">
          <div className="section-header">
            <Code size={28} color="var(--primary-color)" />
            <h2 className="section-title">Skills</h2>
          </div>

          {allTechSkillNames.length > 0 && (
            <div className="skills-group">
              <h3 className="skills-group-label">⚙️ Technical Skills</h3>
              <div className="skills-badge-grid">
                {allTechSkillNames.map((name, i) => <SkillBadge key={i} name={name} />)}
              </div>
            </div>
          )}

          {allSoftSkillNames.length > 0 && (
            <div className="skills-group" style={{ marginTop: '2rem' }}>
              <h3 className="skills-group-label">🤝 Soft Skills</h3>
              <div className="skills-badge-grid">
                {allSoftSkillNames.map((name, i) => (
                  <div key={i} className="soft-badge">{name}</div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── PROJECTS ── */}
        <section id="projects" className="reveal">
          <div className="section-header">
            <Briefcase size={28} color="var(--primary-color)" />
            <h2 className="section-title">Featured Projects</h2>
          </div>
          <div className="projects-grid">
            {projects.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No projects added yet.</p>
            ) : (
              projects.map(proj => (
                <div key={proj.id} className="project-card bento-card">
                  {proj.image_url ? (
                    <div className="project-img-wrap">
                      <img src={resolveImg(proj.image_url)} alt={proj.title} className="project-img" />
                      <div className="project-img-overlay">
                        {proj.live_url && <a href={proj.live_url} target="_blank" rel="noreferrer" className="overlay-btn"><Globe size={16} /> Live Preview</a>}
                        {proj.github_url && <a href={proj.github_url} target="_blank" rel="noreferrer" className="overlay-btn"><Github size={16} /> Source</a>}
                      </div>
                    </div>
                  ) : (
                    <div className="project-img-placeholder">
                      <Code size={36} color="var(--primary-color)" />
                    </div>
                  )}

                  <div className="project-body">
                    <h3 className="project-title">{proj.title}</h3>

                    {/* Tech stack tags from tools field */}
                    {proj.tools && (
                      <div className="project-tags">
                        {proj.tools.split(',').map(t => (
                          <span key={t.trim()} className="project-tag">{t.trim()}</span>
                        ))}
                      </div>
                    )}

                    <div className="project-details">
                      <p><span className="detail-label">Problem:</span> {proj.problem}</p>
                      <p><span className="detail-label">Solution:</span> {proj.solution}</p>
                      {proj.outcome && <p><span className="outcome-label">✅ {proj.outcome}</span></p>}
                    </div>

                    <div className="project-actions">
                      {proj.live_url && (
                        <a href={proj.live_url} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                          <Globe size={15} /> Live Demo
                        </a>
                      )}
                      {proj.github_url && (
                        <a href={proj.github_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                          <Github size={15} /> GitHub
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── GITHUB STATS ── */}
        {profile.social_github && (
          <section className="bento-card reveal">
            <div className="section-header">
              <Github size={28} color="var(--primary-color)" />
              <h2 className="section-title">GitHub Activity</h2>
            </div>
            <GitHubStats username={profile.social_github} />
          </section>
        )}

        {/* ── EXPERIENCE & EDUCATION ── */}
        <section id="experience" className="bento-grid reveal">
          <div className="bento-card">
            <div className="section-header">
              <Briefcase size={28} color="var(--primary-color)" />
              <h2 className="section-title">Experience</h2>
            </div>
            <div className="timeline">
              {experience.length === 0 ? <p className="empty-msg">No experience added.</p> : (
                experience.map(exp => (
                  <div key={exp.id} className="timeline-item" style={{ '--accent': 'var(--primary-color)' }}>
                    <h3 className="timeline-role">{exp.role}</h3>
                    <p className="timeline-company">{exp.company} <span className="timeline-period">• {exp.period}</span></p>
                    <p className="timeline-desc">{exp.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bento-card">
            <div className="section-header">
              <GraduationCap size={28} color="var(--secondary-color)" />
              <h2 className="section-title">Education</h2>
            </div>
            <div className="timeline">
              {education.length === 0 ? <p className="empty-msg">No education records found.</p> : (
                education.map(edu => (
                  <div key={edu.id} className="timeline-item" style={{ '--accent': 'var(--secondary-color)' }}>
                    <h3 className="timeline-role">{edu.degree}</h3>
                    <p className="timeline-company">{edu.institution} <span className="timeline-period">• {edu.year}</span></p>
                    <p className="timeline-desc">{edu.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* ── CERTIFICATIONS & ACHIEVEMENTS ── */}
        <section className="bento-grid reveal">
          <div className="bento-card">
            <div className="section-header">
              <BookOpen size={28} color="var(--primary-color)" />
              <h2 className="section-title">Certifications</h2>
            </div>
            <div className="cert-list">
              {certifications.length === 0 ? <p className="empty-msg">No certifications added.</p> : (
                certifications.map(cert => (
                  <div key={cert.id} className="cert-item">
                    <div className="cert-icon">📜</div>
                    <div>
                      <h3 className="cert-title">{cert.title}</h3>
                      <p className="cert-meta">{cert.issuer} · {cert.year}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bento-card">
            <div className="section-header">
              <Award size={28} color="var(--accent-color)" />
              <h2 className="section-title">Achievements</h2>
            </div>
            <div className="cert-list">
              {achievements.length === 0 ? <p className="empty-msg">No achievements added.</p> : (
                achievements.map(ach => (
                  <div key={ach.id} className="cert-item">
                    {ach.image_url && <img src={resolveImg(ach.image_url)} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} alt="" />}
                    <div>
                      <h3 className="cert-title">{ach.title}</h3>
                      <p className="cert-meta" style={{ color: 'var(--secondary-color)' }}>{ach.date}</p>
                      <p className="cert-desc">{ach.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* ── CONTACT ── */}
        <section id="contact" className="bento-card reveal contact-section">
          <div className="section-header" style={{ justifyContent: 'center' }}>
            <Mail size={28} color="var(--primary-color)" />
            <h2 className="section-title">Let's Build Something Together</h2>
          </div>
          <p className="contact-subtitle">Have a project idea or want to collaborate? Drop a message!</p>

          {contactStatus === 'success' ? (
            <div className="contact-success">
              🎉 Message sent! I'll get back to you soon.
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="contact-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Your Name</label>
                  <input type="text" name="name" className="input-field" required value={contactForm.name} onChange={handleInputChange} placeholder="John Doe" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" name="email" className="input-field" value={contactForm.email} onChange={handleInputChange} placeholder="john@example.com" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea name="message" className="input-field" rows="5" required value={contactForm.message} onChange={handleInputChange} placeholder="What's on your mind?"></textarea>
              </div>
              {contactStatus === 'error' && (
                <p style={{ color: 'var(--accent-color)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  ⚠️ Failed to send. The server may be waking up — please try again in a moment.
                </p>
              )}
              <button type="submit" className="btn btn-primary contact-submit-btn">
                <Send size={18} /> Send Message
              </button>
            </form>
          )}

          <div className="contact-socials">
            {profile.social_github && <a href={profile.social_github} target="_blank" rel="noreferrer" className="contact-social-link"><Github size={22} /><span>GitHub</span></a>}
            {profile.social_linkedin && <a href={profile.social_linkedin} target="_blank" rel="noreferrer" className="contact-social-link"><Linkedin size={22} /><span>LinkedIn</span></a>}
            {profile.social_instagram && <a href={profile.social_instagram} target="_blank" rel="noreferrer" className="contact-social-link"><Instagram size={22} /><span>Instagram</span></a>}
            {profile.social_email && <a href={`mailto:${profile.social_email}`} className="contact-social-link"><Mail size={22} /><span>{profile.social_email}</span></a>}
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="portfolio-footer">
        <div className="footer-inner">
          <p className="footer-name text-gradient">{profile.name || 'Portfolio'}</p>
          <p className="footer-copy">© {new Date().getFullYear()} · Built with React & Node.js · Hosted on Render + Netlify</p>
          <div className="footer-links">
            {profile.social_github && <a href={profile.social_github} target="_blank" rel="noreferrer"><Github size={18} /></a>}
            {profile.social_linkedin && <a href={profile.social_linkedin} target="_blank" rel="noreferrer"><Linkedin size={18} /></a>}
            {profile.social_email && <a href={`mailto:${profile.social_email}`}><Mail size={18} /></a>}
          </div>
          <a href="/admin" className="footer-admin">Admin Dashboard →</a>
        </div>
      </footer>
    </div>
  );
};

export default Home;

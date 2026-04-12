// netlify/functions/api.js
// This wraps the entire Express backend as a single Netlify serverless function.
// All routes /api/* are redirected here via netlify.toml.

'use strict';

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');
const { v2: cloudinary } = require('cloudinary');
const streamifier = require('streamifier');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
require('dotenv').config();

// ─── MongoDB Models ───────────────────────────────────────────────────────────
// Global plugin to map _id to id in JSON responses
if (!mongoose.modelNames().includes('UserProfile')) {
  mongoose.plugin((schema) => {
    schema.set('toJSON', {
      virtuals: true,
      versionKey: false,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
      }
    });
  });
}

const getModel = (name, schema) => {
  try { return mongoose.model(name); } catch (e) { return mongoose.model(name, schema); }
};

const userProfileSchema = new mongoose.Schema({
  name: String, field: String, university: String, location: String,
  career_goal: String, tagline: String, about_background: String,
  about_interests: String, journey_text: String, resume_url: String,
  profile_image: String, college_image: String, social_github: String,
  social_linkedin: String, social_instagram: String, social_email: String,
  welcome_message: String
});
const skillSchema = new mongoose.Schema({
  category: String, name: String, order_index: { type: Number, default: 0 }
});
const projectSchema = new mongoose.Schema({
  title: String, problem: String, solution: String, tools: String, role: String,
  outcome: String, image_url: String, github_url: String, live_url: String,
  order_index: { type: Number, default: 0 }
});
const experienceSchema = new mongoose.Schema({
  role: String, company: String, period: String, description: String,
  order_index: { type: Number, default: 0 }
});
const certificationSchema = new mongoose.Schema({
  title: String, issuer: String, year: String, order_index: { type: Number, default: 0 }
});
const educationSchema = new mongoose.Schema({
  degree: String, institution: String, year: String, description: String,
  order_index: { type: Number, default: 0 }
});
const achievementSchema = new mongoose.Schema({
  title: String, date: String, description: String, image_url: String,
  order_index: { type: Number, default: 0 }
});
const messageSchema = new mongoose.Schema({
  name: String, email: String, message: String,
  created_at: { type: Date, default: Date.now }
});

const models = {
  UserProfile: getModel('UserProfile', userProfileSchema),
  Skill:       getModel('Skill', skillSchema),
  Project:     getModel('Project', projectSchema),
  Experience:  getModel('Experience', experienceSchema),
  Certification: getModel('Certification', certificationSchema),
  Education:   getModel('Education', educationSchema),
  Achievement:  getModel('Achievement', achievementSchema),
  Message:     getModel('Message', messageSchema),
};

// ─── MongoDB Connection (cached for warm Lambda invocations) ──────────────────
let isConnecting = false;
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return; // already connected
  if (isConnecting) {
    // Wait up to 8s for an in-progress connection
    for (let i = 0; i < 16; i++) {
      await new Promise(r => setTimeout(r, 500));
      if (mongoose.connection.readyState === 1) return;
    }
    return;
  }
  isConnecting = true;
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      socketTimeoutMS: 30000,
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
  } finally {
    isConnecting = false;
  }
};

// ─── Cloudinary ───────────────────────────────────────────────────────────────
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const uploadToCloudinary = (buffer, folder = 'portfolio') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif'] },
      (error, result) => { if (error) reject(error); else resolve(result.secure_url); }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// ─── Email ────────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// ─── Express App ──────────────────────────────────────────────────────────────
const app = express();

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());

// All uploads go through Cloudinary in serverless (no local filesystem)
const upload = multer({ storage: multer.memoryStorage() });

// DB-connect middleware — runs before every request
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// ─── DB ready guard ───
const requireDB = (req, res, next) => {
  const state = mongoose.connection.readyState;
  if (state === 1) return next();
  if (state === 2) return res.status(503).json({ error: 'DB_CONNECTING', message: 'Database is still connecting. Please retry.' });
  return res.status(503).json({
    error: 'DB_DISCONNECTED',
    message: 'Cannot reach MongoDB Atlas. Check IP whitelist (0.0.0.0/0) in Atlas Network Access.',
    fix: 'https://www.mongodb.com/docs/atlas/security/ip-access-list/'
  });
};

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  const s = mongoose.connection.readyState;
  res.json({ status: 'ok', db: ['disconnected','connected','connecting','disconnecting'][s] || 'unknown', dbReady: s === 1 });
});

app.get('/api/status', (req, res) => {
  const s = mongoose.connection.readyState;
  res.json({ server: 'running', db: ['disconnected','connected','connecting','disconnecting'][s] || 'unknown', dbReady: s === 1,
    message: s === 1 ? 'All systems operational' : 'MongoDB not connected — check Atlas Network Access'
  });
});

// ─── Unified fetch ───────────────────────────────────────────────────────────
app.get('/api/all', requireDB, async (req, res) => {
  try {
    const [profile, skills, projects, experience, certifications, education, achievements, messages] = await Promise.all([
      models.UserProfile.findOne(),
      models.Skill.find().sort({ order_index: 1, _id: -1 }),
      models.Project.find().sort({ order_index: 1, _id: -1 }),
      models.Experience.find().sort({ order_index: 1, _id: -1 }),
      models.Certification.find().sort({ order_index: 1, _id: -1 }),
      models.Education.find().sort({ order_index: 1, _id: -1 }),
      models.Achievement.find().sort({ order_index: 1, _id: -1 }),
      models.Message.find().sort({ created_at: -1 })
    ]);
    let profileData = profile;
    if (!profileData) profileData = await models.UserProfile.create({ name: 'Your Name', welcome_message: 'Welcome to my portfolio!' });
    res.json({ profile: profileData, skills, projects, experience, certifications, education, achievements, messages });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Profile ──────────────────────────────────────────────────────────────────
app.get('/api/profile', requireDB, async (req, res) => {
  try {
    let profile = await models.UserProfile.findOne();
    if (!profile) profile = await models.UserProfile.create({ name: 'Your Name', welcome_message: 'Welcome to my portfolio!' });
    res.json(profile);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/profile', requireDB, upload.fields([{ name: 'profile_image', maxCount: 1 }, { name: 'college_image', maxCount: 1 }]), async (req, res) => {
  try {
    let profile = await models.UserProfile.findOne();
    if (!profile) profile = new models.UserProfile();
    const fieldsToUpdate = ['name','field','university','location','career_goal','tagline','about_background','about_interests','journey_text','social_github','social_linkedin','social_instagram','social_email','resume_url','welcome_message'];
    fieldsToUpdate.forEach(f => { if (req.body[f] !== undefined) profile[f] = req.body[f]; });
    if (req.files) {
      if (req.files.profile_image) profile.profile_image = await uploadToCloudinary(req.files.profile_image[0].buffer);
      if (req.files.college_image)  profile.college_image  = await uploadToCloudinary(req.files.college_image[0].buffer);
    }
    await profile.save();
    res.json({ success: true, profile });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Generic CRUD helper ──────────────────────────────────────────────────────
function setupCrud(endpoint, Model, requiredFields) {
  app.get(`/api/${endpoint}`, requireDB, async (req, res) => {
    try { res.json(await Model.find().sort({ order_index: 1, _id: -1 })); }
    catch (err) { res.status(500).json({ error: err.message }); }
  });
  app.post(`/api/${endpoint}`, requireDB, async (req, res) => {
    try {
      for (let f of requiredFields) if (!req.body[f]) return res.status(400).json({ error: `Missing ${f}` });
      const doc = new Model(req.body);
      await doc.save();
      res.json(doc);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
  app.delete(`/api/${endpoint}/:id`, requireDB, async (req, res) => {
    try { await Model.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }
    catch (err) { res.status(500).json({ error: err.message }); }
  });
}

setupCrud('skills', models.Skill, ['name', 'category']);
setupCrud('experience', models.Experience, ['role', 'company']);
setupCrud('certifications', models.Certification, ['title']);
setupCrud('education', models.Education, ['degree', 'institution']);

// ─── Projects ────────────────────────────────────────────────────────────────
app.get('/api/projects', requireDB, async (req, res) => {
  try { res.json(await models.Project.find().sort({ order_index: 1, _id: -1 })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/projects', requireDB, upload.single('image'), async (req, res) => {
  try {
    const { title, problem, solution, tools, role, outcome, github_url, live_url } = req.body;
    if (!title) return res.status(400).json({ error: 'Missing title' });
    let image_url = null;
    if (req.file) image_url = await uploadToCloudinary(req.file.buffer);
    const project = new models.Project({ title, problem, solution, tools, role, outcome, image_url, github_url, live_url });
    await project.save();
    res.json(project);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/projects/:id', requireDB, async (req, res) => {
  try { await models.Project.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Achievements ─────────────────────────────────────────────────────────────
app.get('/api/achievements', requireDB, async (req, res) => {
  try { res.json(await models.Achievement.find().sort({ order_index: 1, _id: -1 })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/achievements', requireDB, upload.single('image'), async (req, res) => {
  try {
    const { title, date, description } = req.body;
    if (!title) return res.status(400).json({ error: 'Missing title' });
    let image_url = null;
    if (req.file) image_url = await uploadToCloudinary(req.file.buffer);
    const achievement = new models.Achievement({ title, date, description, image_url });
    await achievement.save();
    res.json(achievement);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.delete('/api/achievements/:id', requireDB, async (req, res) => {
  try { await models.Achievement.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Contact ──────────────────────────────────────────────────────────────────
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !message) return res.status(400).json({ error: 'Name and message are required' });
    const newMsg = new models.Message({ name, email, message });
    await newMsg.save();
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_TO || process.env.EMAIL_USER,
        subject: `New Portfolio Contact: ${name}`,
        text: `New message from ${name} (${email || 'No email'}):\n\n${message}`
      }, (err) => { if (err) console.error('Email error:', err); });
    }
    res.json({ success: true, id: newMsg._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/contact', requireDB, async (req, res) => {
  try { res.json(await models.Message.find().sort({ created_at: -1 })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Reorder ──────────────────────────────────────────────────────────────────
app.put('/api/:table/reorder', requireDB, async (req, res) => {
  try {
    const validTables = { skills: models.Skill, projects: models.Project, experience: models.Experience, certifications: models.Certification, education: models.Education, achievements: models.Achievement };
    const Model = validTables[req.params.table];
    if (!Model) return res.status(400).json({ error: 'Invalid table' });
    const { orderedIds } = req.body;
    if (!orderedIds || !Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds must be an array' });
    if (orderedIds.length === 0) return res.json({ success: true });
    await Model.bulkWrite(orderedIds.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { order_index: i } } })));
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Export for Netlify ───────────────────────────────────────────────────────
module.exports.handler = serverless(app);

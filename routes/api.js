/**
 * routes/api.js — Express API routes
 *
 * These are the endpoints the frontend calls to trigger agent actions
 * and retrieve data. Think of these as the "buttons" the dashboard presses.
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Import agents
const orchestrator = require('../agents/orchestrator');
const portfolio = require('../agents/portfolio');
const uxResearcher = require('../agents/uxResearcher');
const uxDesigner = require('../agents/uxDesigner');

// --- Health Check ---
// GET /api/health → confirms the server is running
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'X Investing Scraper is running' });
});

// --- Run Full Pipeline ---
// POST /api/run → triggers the orchestrator to run all agents
router.post('/run', async (req, res) => {
  try {
    const results = await orchestrator.run();
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Get Latest Posts ---
// GET /api/posts → returns the 50 most recently scraped investing posts
router.get('/posts', (req, res) => {
  try {
    const posts = db.get('posts').value().slice(-50).reverse();
    res.json({ success: true, data: posts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Portfolio Routes ---
// GET /api/portfolio → returns all portfolio positions
router.get('/portfolio', (req, res) => {
  try {
    const positions = portfolio.getAll();
    res.json({ success: true, data: positions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/portfolio → adds a new position manually
router.post('/portfolio', (req, res) => {
  try {
    const { ticker, company_name, shares, sector, region } = req.body;
    const result = portfolio.add({ ticker, company_name, shares, sector, region });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Tracked Accounts ---
// GET /api/accounts → returns all tracked X accounts
router.get('/accounts', (req, res) => {
  try {
    const accounts = db.get('tracked_accounts').value();
    res.json({ success: true, data: accounts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/accounts → adds a new X account to track
router.post('/accounts', (req, res) => {
  try {
    const { username } = req.body;

    // Don't add duplicates
    const exists = db.get('tracked_accounts').find({ username }).value();
    if (exists) {
      return res.json({ success: true, message: `Already tracking @${username}` });
    }

    db.get('tracked_accounts').push({
      id: Date.now(),
      username,
      added_at: new Date().toISOString(),
    }).write();

    res.json({ success: true, message: `Now tracking @${username}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- UX Agent Chain ---
// GET /api/ux-suggestions
// Runs the two-agent UX chain:
//   1. uxResearcher studies competitor investment UIs
//   2. uxDesigner takes those notes and outputs specific improvements for our dashboard
// This can take a few seconds if the API key is set (Claude calls happen sequentially)
router.get('/ux-suggestions', async (req, res) => {
  try {
    console.log('\n🎨 UX Agent Chain: Starting...');

    // Step 1: Research agent studies competitor UIs
    console.log('🔍 Step 1: UX Researcher analyzing investment dashboards...');
    const researchNotes = await uxResearcher.research();

    // Step 2: Designer agent takes those notes and generates specific suggestions
    console.log('✏️  Step 2: UX Designer generating improvement suggestions...');
    const suggestions = await uxDesigner.suggest(researchNotes);

    console.log('✅ UX Agent Chain complete!\n');

    res.json({
      success: true,
      data: {
        research: researchNotes,
        suggestions,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

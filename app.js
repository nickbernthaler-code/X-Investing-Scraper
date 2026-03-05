/**
 * app.js — Main entry point for the X Investing Scraper server
 *
 * This starts an Express web server that:
 * - Serves the frontend dashboard (public folder)
 * - Exposes API endpoints for the agents to communicate through
 */

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const path = require('path');

// Import our API routes
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
// Parse incoming JSON request bodies
app.use(express.json());

// Serve static files (index.html, style.css, etc.) from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// --- Routes ---
// All API calls go through /api
app.use('/api', apiRoutes);

// --- Seed sample portfolio data if empty (so recommendations work out of the box) ---
const portfolio = require('./agents/portfolio');
if (portfolio.getAll().length === 0) {
  portfolio.seedSampleData();
}

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`✅ StockHolmes running at http://localhost:${PORT}`);
});

/**
 * database/db.js — JSON file database using lowdb
 *
 * lowdb stores all data in a local JSON file (db.json).
 * It's simple, requires no setup, and works with any Node version.
 *
 * Data is organized into 4 collections:
 *   - posts: scraped X posts
 *   - analysis: AI analysis results
 *   - portfolio: user's stock positions
 *   - tracked_accounts: X accounts to monitor
 */

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

// Create or open the db.json file in the project root
const adapter = new FileSync(path.join(__dirname, '../db.json'));
const db = low(adapter);

// Set default empty collections if the file is new
db.defaults({
  posts: [],
  analysis: [],
  portfolio: [],
  tracked_accounts: [],
}).write();

console.log('📦 Database connected (db.json)');

module.exports = db;

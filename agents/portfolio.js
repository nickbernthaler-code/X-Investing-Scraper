/**
 * agents/portfolio.js — The Portfolio Agent
 *
 * Manages the user's stock portfolio. Supports:
 * - Manual entry of positions
 * - Reading all positions from the database
 * - (Future) Robinhood or Plaid integration
 */

const db = require('../database/db');

/**
 * getAll() — Returns all portfolio positions.
 */
function getAll() {
  return db.get('portfolio').value();
}

/**
 * add(position) — Adds a new stock position to the portfolio.
 *
 * @param {Object} position - { ticker, company_name, shares, sector, region }
 */
function add({ ticker, company_name, shares, sector, region }) {
  if (!ticker) throw new Error('Ticker is required');

  const position = {
    id: Date.now(), // simple unique ID using timestamp
    ticker: ticker.toUpperCase(),
    company_name: company_name || '',
    shares: shares || 0,
    sector: sector || 'Unknown',
    region: region || 'Unknown',
    added_at: new Date().toISOString(),
  };

  db.get('portfolio').push(position).write();
  return position;
}

/**
 * remove(ticker) — Removes a position from the portfolio by ticker symbol.
 */
function remove(ticker) {
  db.get('portfolio').remove({ ticker: ticker.toUpperCase() }).write();
}

/**
 * getSectors() — Returns which sectors the user is already in.
 * Useful for the Recommender Agent to spot gaps.
 */
function getSectors() {
  const positions = getAll();
  const sectorMap = {};

  positions.forEach(pos => {
    sectorMap[pos.sector] = (sectorMap[pos.sector] || 0) + 1;
  });

  return sectorMap;
}

/**
 * seedSampleData() — Adds sample positions for testing.
 * Only use this during development.
 */
function seedSampleData() {
  const samples = [
    { ticker: 'AAPL', company_name: 'Apple Inc', shares: 10, sector: 'Technology', region: 'US' },
    { ticker: 'MSFT', company_name: 'Microsoft Corp', shares: 5, sector: 'Technology', region: 'US' },
    { ticker: 'JPM', company_name: 'JPMorgan Chase', shares: 8, sector: 'Finance', region: 'US' },
  ];

  samples.forEach(pos => add(pos));
  console.log('📊 Portfolio: Sample data seeded.');
}

module.exports = { getAll, add, remove, getSectors, seedSampleData };

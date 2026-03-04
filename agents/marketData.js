/**
 * agents/marketData.js — The Market Data Agent
 *
 * Fetches real-time stock prices and basic fundamentals from Alpha Vantage.
 * Falls back to mock data if no API key is set (for development/testing).
 */

const axios = require('axios');

// List of tickers we always want data for
// This can be expanded as we detect tickers in scraped posts
const DEFAULT_TICKERS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN'];

/**
 * getQuote(ticker) — Fetches the current price for a single stock ticker.
 * Returns an object with price, change, and volume.
 */
async function getQuote(ticker) {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

  // If no API key, return mock data so we can still develop and test
  if (!apiKey || apiKey === 'your_alpha_vantage_key_here') {
    console.log(`  [marketData] No API key — using mock data for ${ticker}`);
    return getMockQuote(ticker);
  }

  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`;
    const response = await axios.get(url);
    const quote = response.data['Global Quote'];

    return {
      ticker,
      price: parseFloat(quote['05. price']),
      change_percent: quote['10. change percent'],
      volume: parseInt(quote['06. volume']),
    };
  } catch (err) {
    console.error(`  [marketData] Failed to fetch ${ticker}:`, err.message);
    return getMockQuote(ticker); // fallback to mock on error
  }
}

/**
 * getSnapshot() — Fetches quotes for all default tickers.
 * Returns an object keyed by ticker symbol.
 */
async function getSnapshot() {
  const results = {};

  // Fetch all tickers in parallel
  const quotes = await Promise.all(DEFAULT_TICKERS.map(ticker => getQuote(ticker)));

  quotes.forEach(quote => {
    results[quote.ticker] = quote;
  });

  return results;
}

/**
 * getMockQuote(ticker) — Returns fake data for testing without an API key.
 */
function getMockQuote(ticker) {
  const mockPrices = {
    AAPL: 182.50,
    TSLA: 248.42,
    NVDA: 875.39,
    MSFT: 415.22,
    AMZN: 198.11,
  };

  return {
    ticker,
    price: mockPrices[ticker] || 100.00,
    change_percent: '+1.25%',
    volume: 35000000,
    is_mock: true,
  };
}

module.exports = { getQuote, getSnapshot };

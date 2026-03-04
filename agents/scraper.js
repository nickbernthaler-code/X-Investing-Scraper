/**
 * agents/scraper.js — The Scraper Agent
 *
 * Fetches posts from tracked X accounts.
 * Currently uses mock data — will connect to X API when a key is provided.
 *
 * Posts are filtered for investing-related content before being saved.
 */

const db = require('../database/db');
const DEFAULT_ACCOUNTS = require('../data/accounts');

// Keywords we look for to identify investing-related posts
const INVESTING_KEYWORDS = [
  'stock', 'buy', 'sell', 'bullish', 'bearish', 'earnings',
  'dividend', 'portfolio', 'long', 'short', 'market', 'trade',
  'invest', 'rally', 'breakout', '$',
];

/**
 * isInvestingPost(text) — Returns true if the post contains investing keywords.
 */
function isInvestingPost(text) {
  const lower = text.toLowerCase();
  return INVESTING_KEYWORDS.some(keyword => lower.includes(keyword));
}

/**
 * fetchFromX(username) — Fetches real posts from X API.
 * Not yet implemented — returns null if no API key is set.
 */
async function fetchFromX(username) {
  const token = process.env.X_BEARER_TOKEN;
  if (!token || token === 'your_x_bearer_token_here') {
    return null; // No API key — fall through to mock data
  }

  // TODO: Implement real X API v2 call here when API key is available
  // Endpoint: GET https://api.twitter.com/2/users/:id/tweets
  return null;
}

/**
 * getMockPosts(username) — Returns fake posts for testing without an API key.
 */
function getMockPosts(username) {
  const mockData = {
    elonmusk: [
      { text: 'The stock market is looking very bullish right now. $TSLA to the moon! 🚀' },
      { text: 'Had a great weekend, nothing to report.' },
    ],
    chamath: [
      { text: 'Long $AAPL — earnings beat was incredible. Still my top holding.' },
      { text: 'New portfolio update: adding more tech exposure this quarter.' },
    ],
    michaeljburry: [
      { text: 'Bearish on $NVDA. P/E ratios are unsustainable at these levels.' },
      { text: 'Reading some good books lately.' },
    ],
    realwillmeade: [
      { text: 'Buy signal on $AMZN. AWS growth is accelerating. Strong hold.' },
      { text: 'Dividend plays are looking interesting in this market.' },
    ],
    stockmoe: [
      { text: 'Breakout pattern on $MSFT. Volume surge confirms the move.' },
      { text: 'Portfolio up 12% this month. Stay disciplined!' },
    ],
  };

  return mockData[username] || [
    { text: 'Bullish on the overall market. Long-term investor mindset. #investing' },
  ];
}

/**
 * fetchPosts() — Main function. Fetches and filters posts from all tracked accounts.
 * Saves investing-related posts to the database and returns them.
 */
async function fetchPosts() {
  // Get accounts from DB first, fall back to default list
  const dbAccounts = db.get('tracked_accounts').value();
  const accounts = dbAccounts.length > 0
    ? dbAccounts.map(a => a.username)
    : DEFAULT_ACCOUNTS;

  const investingPosts = [];

  for (const username of accounts) {
    // Try real API first, fall back to mock data
    const realPosts = await fetchFromX(username);
    const posts = realPosts || getMockPosts(username);

    for (const post of posts) {
      if (isInvestingPost(post.text)) {
        const record = {
          id: Date.now() + Math.random(), // unique ID
          username,
          content: post.text,
          scraped_at: new Date().toISOString(),
          is_mock: !realPosts,
        };

        // Save to database
        db.get('posts').push(record).write();
        investingPosts.push(record);
      }
    }
  }

  return investingPosts;
}

module.exports = { fetchPosts, isInvestingPost };

/**
 * agents/scraper.js — The Scraper Agent
 *
 * Fetches posts from tracked X accounts.
 * Currently uses mock data — will connect to X API when a key is provided.
 *
 * Posts are filtered for investing-related content before being saved.
 */

const axios = require('axios');
const db = require('../database/db');
const DEFAULT_ACCOUNTS = require('../data/accounts');
const { getQuote } = require('./marketData');

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
 * fetchFromX(username) — Fetches real posts from X API v2.
 * Uses Bearer Token authentication. Returns null if no API key is set,
 * which causes the caller to fall back to mock data.
 *
 * X API v2 flow:
 *   1. Look up the user ID by username
 *   2. Fetch their recent tweets using that user ID
 */
async function fetchFromX(username) {
  const token = process.env.X_BEARER_TOKEN;
  if (!token || token === 'your_x_bearer_token_here') {
    return null; // No API key — fall through to mock data
  }

  try {
    // Step 1: Look up the user's ID from their username
    const userRes = await axios.get(
      `https://api.x.com/2/users/by/username/${username}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const userId = userRes.data?.data?.id;
    if (!userId) {
      console.warn(`  [scraper] Could not find user ID for @${username}`);
      return null;
    }

    // Step 2: Fetch their recent tweets (max 10 per request)
    const tweetsRes = await axios.get(
      `https://api.x.com/2/users/${userId}/tweets`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          max_results: 10,                        // Fetch last 10 tweets
          'tweet.fields': 'created_at,public_metrics', // Include date + like/retweet counts
        },
      }
    );

    const tweets = tweetsRes.data?.data;
    if (!tweets || tweets.length === 0) {
      console.warn(`  [scraper] No tweets found for @${username}`);
      return null;
    }

    // Convert X API format to our internal format
    return tweets.map(tweet => ({
      text: tweet.text,
      created_at: tweet.created_at,
      likes: tweet.public_metrics?.like_count || 0,
      retweets: tweet.public_metrics?.retweet_count || 0,
    }));

  } catch (err) {
    console.warn(`  [scraper] X API failed for @${username}:`, err.message);
    return null; // Fall back to mock data
  }
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
 * extractTickers(text) — Pulls out $TICKER symbols from a post.
 * Returns an array of uppercase ticker strings, e.g. ['TSLA', 'AAPL']
 */
function extractTickers(text) {
  if (!text) return [];
  const matches = text.match(/\$([A-Z]{1,5})\b/g);
  return matches ? [...new Set(matches.map(m => m.replace('$', '')))] : [];
}

/**
 * saveTickerMentions(tickers, username, postId) — Saves each mentioned ticker
 * with its current price so we can track performance over time.
 * This is the core of the performance tracking feature.
 */
async function saveTickerMentions(tickers, username, postId) {
  for (const ticker of tickers) {
    try {
      // Fetch the current price at the moment this ticker was mentioned
      const quote = await getQuote(ticker);
      const mention = {
        id: Date.now() + Math.random(),
        ticker: ticker,
        username: username,
        post_id: postId,
        price_at_mention: quote.price,        // Price when the user mentioned it
        mentioned_at: new Date().toISOString(), // When we spotted the mention
        is_mock: quote.is_mock || false,
      };
      db.get('ticker_mentions').push(mention).write();
      console.log(`  [scraper] Saved ticker mention: $${ticker} by @${username} at $${quote.price}`);
    } catch (err) {
      console.warn(`  [scraper] Could not save price for $${ticker}:`, err.message);
    }
  }
}

/**
 * fetchPosts() — Main function. Fetches and filters posts from all tracked accounts.
 * Saves investing-related posts to the database and returns them.
 * Also extracts ticker symbols and saves them for performance tracking.
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

        // Save post to database
        db.get('posts').push(record).write();
        investingPosts.push(record);

        // Extract tickers from the post and save them for performance tracking
        const tickers = extractTickers(post.text);
        if (tickers.length > 0) {
          await saveTickerMentions(tickers, username, record.id);
        }
      }
    }
  }

  return investingPosts;
}

module.exports = { fetchPosts, isInvestingPost };

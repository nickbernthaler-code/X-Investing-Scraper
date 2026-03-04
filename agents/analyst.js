/**
 * agents/analyst.js — The Analyst Agent
 *
 * Uses Claude AI to critically re-evaluate each scraped post against
 * real-time market data. Returns a structured analysis for each post.
 *
 * Falls back to a simple keyword-based analysis if no API key is set.
 */

const Anthropic = require('@anthropic-ai/sdk');

// Initialize the Claude client (reads ANTHROPIC_API_KEY from .env)
const client = new Anthropic();

/**
 * analyzePost(post, marketSnapshot) — Sends a single post to Claude
 * for investment analysis. Returns sentiment, tickers, and a summary.
 */
async function analyzePost(post, marketSnapshot) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Fall back to simple analysis if no API key
  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    console.log(`  [analyst] No API key — using simple analysis for post by ${post.username}`);
    return simpleAnalysis(post);
  }

  // Format market data into a readable string for the prompt
  const marketContext = Object.values(marketSnapshot)
    .map(q => `${q.ticker}: $${q.price} (${q.change_percent})`)
    .join(', ');

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `You are a critical investment analyst. Analyze this X post for investment merit.

Post by @${post.username}: "${post.content}"

Current market data: ${marketContext}

Respond in JSON format only:
{
  "sentiment": "bullish" | "bearish" | "neutral",
  "tickers": ["list", "of", "mentioned", "tickers"],
  "summary": "1-2 sentence critical evaluation",
  "confidence": 1-10
}`,
        },
      ],
    });

    // Parse the JSON response from Claude
    const raw = message.content[0].text;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`  [analyst] Claude API error:`, err.message);
    return simpleAnalysis(post); // fallback on error
  }
}

/**
 * analyzePosts(posts, marketSnapshot) — Runs analyzePost on all posts.
 * Returns an array of posts with their analysis attached.
 */
async function analyzePosts(posts, marketSnapshot) {
  const results = [];

  for (const post of posts) {
    const analysis = await analyzePost(post, marketSnapshot);
    results.push({ ...post, analysis });
  }

  return results;
}

/**
 * simpleAnalysis(post) — Basic keyword-based analysis (no AI needed).
 * Used when no API key is available.
 */
function simpleAnalysis(post) {
  const text = post.content.toLowerCase();
  let sentiment = 'neutral';

  if (['buy', 'bullish', 'long', 'strong', 'breakout'].some(w => text.includes(w))) {
    sentiment = 'bullish';
  } else if (['sell', 'bearish', 'short', 'weak', 'crash'].some(w => text.includes(w))) {
    sentiment = 'bearish';
  }

  // Extract tickers (words that start with $)
  const tickers = (post.content.match(/\$[A-Z]{1,5}/g) || []).map(t => t.replace('$', ''));

  return {
    sentiment,
    tickers,
    summary: `Simple analysis: ${sentiment} signal detected based on keywords.`,
    confidence: 3,
    is_simple: true,
  };
}

module.exports = { analyzePost, analyzePosts };

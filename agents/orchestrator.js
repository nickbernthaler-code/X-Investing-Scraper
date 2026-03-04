/**
 * agents/orchestrator.js — The Orchestrator Agent
 *
 * This is the "team lead" agent. It runs all other agents in the correct
 * order and passes data between them.
 *
 * Flow:
 *   1. Scraper + Market Data run in PARALLEL (they're independent)
 *   2. Analyst takes both outputs and evaluates each post
 *   3. Recommender compares analyst results against the user's portfolio
 */

const scraper = require('./scraper');
const marketData = require('./marketData');
const analyst = require('./analyst');
const portfolioAgent = require('./portfolio');
const recommender = require('./recommender');

/**
 * run() — Executes the full pipeline from scraping to recommendations.
 * Returns a summary of results.
 */
async function run() {
  console.log('\n🚀 Orchestrator: Starting pipeline...\n');

  // --- Step 1: Run Scraper and Market Data in PARALLEL ---
  // These two don't depend on each other, so we run them at the same time
  console.log('⚙️  Running Scraper and Market Data agents in parallel...');
  const [posts, marketSnapshot] = await Promise.all([
    scraper.fetchPosts(),
    marketData.getSnapshot(),
  ]);
  console.log(`✅ Scraper found ${posts.length} investing posts`);
  console.log(`✅ Market data fetched for ${Object.keys(marketSnapshot).length} tickers\n`);

  // --- Step 2: Analyst evaluates each post using market data ---
  console.log('🧠 Analyst Agent: Evaluating posts with AI...');
  const analyses = await analyst.analyzePosts(posts, marketSnapshot);
  console.log(`✅ Analyst completed ${analyses.length} evaluations\n`);

  // --- Step 3: Get user's portfolio ---
  console.log('📊 Portfolio Agent: Loading user portfolio...');
  const portfolio = portfolioAgent.getAll();
  console.log(`✅ Portfolio has ${portfolio.length} positions\n`);

  // --- Step 4: Recommender matches analyses to portfolio gaps ---
  console.log('🎯 Recommender Agent: Generating personalized recommendations...');
  const recommendations = recommender.generate(analyses, portfolio);
  console.log(`✅ Generated ${recommendations.length} recommendations\n`);

  console.log('🏁 Orchestrator: Pipeline complete!\n');

  return {
    posts_found: posts.length,
    analyses_completed: analyses.length,
    recommendations,
  };
}

module.exports = { run };

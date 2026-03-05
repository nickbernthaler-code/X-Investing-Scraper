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
 *   4. Instagram Poster shares the top picks on Instagram (or mocks it)
 */

const scraper = require('./scraper');
const marketData = require('./marketData');
const analyst = require('./analyst');
const portfolioAgent = require('./portfolio');
const recommender = require('./recommender');
const instagramPoster = require('./instagramPoster');

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

  // --- Step 5: Instagram Poster shares the top picks ---
  // This runs after recommendations so it has the best picks to post about.
  // If no Instagram credentials are set, it runs in mock mode and just logs the caption.
  console.log('📸 Instagram Poster Agent: Creating and posting content...');
  const instagramResult = await instagramPoster.run(recommendations);
  if (instagramResult.mock) {
    console.log('⚠️  Instagram: Mock mode (add credentials to .env to post for real)\n');
  } else if (instagramResult.success) {
    console.log(`✅ Instagram: Posted successfully! Post ID: ${instagramResult.post_id}\n`);
  } else {
    console.log(`❌ Instagram: Post failed — ${instagramResult.error}\n`);
  }

  console.log('🏁 Orchestrator: Pipeline complete!\n');

  return {
    posts_found: posts.length,
    analyses_completed: analyses.length,
    recommendations,
    instagram: instagramResult,
  };
}

module.exports = { run };

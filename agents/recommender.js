/**
 * agents/recommender.js — The Recommendation Agent
 *
 * Compares AI-analyzed posts against the user's portfolio to:
 * - Identify stocks they DON'T own that look interesting
 * - Spot sector/region gaps in their portfolio
 * - Prioritize high-confidence bullish signals
 */

/**
 * generate(analyses, portfolio) — Main recommendation function.
 *
 * @param {Array} analyses - Posts with AI analysis attached (from Analyst Agent)
 * @param {Array} portfolio - User's current portfolio positions
 * @returns {Array} Sorted list of recommendations
 */
function generate(analyses, portfolio) {
  // Get the list of tickers the user already owns
  const ownedTickers = portfolio.map(p => p.ticker.toUpperCase());

  // Get the sectors the user is already in
  const ownedSectors = [...new Set(portfolio.map(p => p.sector))];

  const recommendations = [];

  for (const item of analyses) {
    const { analysis } = item;

    // Only consider bullish signals with reasonable confidence
    if (!analysis || analysis.sentiment !== 'bullish' || analysis.confidence < 5) {
      continue;
    }

    // For each ticker mentioned in the post
    for (const ticker of (analysis.tickers || [])) {
      const isOwned = ownedTickers.includes(ticker.toUpperCase());

      recommendations.push({
        ticker: ticker.toUpperCase(),
        post_author: item.username,
        post_content: item.content,
        analysis_summary: analysis.summary,
        confidence: analysis.confidence,
        already_owned: isOwned,
        // Flag as a "gap" if the user doesn't own it — this is an opportunity
        is_gap: !isOwned,
      });
    }
  }

  // Sort by confidence score (highest first)
  recommendations.sort((a, b) => b.confidence - a.confidence);

  return recommendations;
}

module.exports = { generate };

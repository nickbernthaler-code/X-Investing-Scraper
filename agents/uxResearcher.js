/**
 * agents/uxResearcher.js — The UX Research Agent
 *
 * This agent uses Claude AI to act as a UX researcher.
 * It "studies" the most well-known investment dashboard applications
 * (Robinhood, Koyfin, Bloomberg, Seeking Alpha, etc.) and returns
 * structured research notes about what makes them successful.
 *
 * These notes are then passed to the uxDesigner agent.
 *
 * Think of this agent as: "What are the best investment UIs doing right?"
 */

const Anthropic = require('@anthropic-ai/sdk');

// Initialize Claude client — reads ANTHROPIC_API_KEY from .env
const client = new Anthropic();

/**
 * research() — The main function.
 * Asks Claude to analyze investment dashboard best practices.
 * Returns a structured JSON object with research findings.
 */
async function research() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // If no API key is set, return hardcoded mock research so the chain still works
  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    console.log('  [uxResearcher] No API key — returning mock research notes');
    return getMockResearch();
  }

  console.log('  [uxResearcher] Asking Claude to research investment dashboard UIs...');

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',  // Sonnet is fast enough for research tasks
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `You are a senior UX researcher specializing in fintech applications.

Analyze the UX/UI patterns used by these top investment dashboard applications:
- Robinhood (simple, mobile-first, green accents, minimal text)
- Koyfin (data-dense, professional, dark mode, charting focus)
- Bloomberg Terminal (extremely data-dense, keyboard-driven, orange on black)
- Seeking Alpha (article + data hybrid, community-driven)
- TradingView (chart-centric, technical analysis, dark/light themes)
- Etoro (social trading, copy-trade, profile-heavy)

Based on your knowledge of these products, identify the BEST practices and patterns.

Respond in JSON format only — no markdown, just raw JSON:
{
  "top_layout_patterns": ["pattern1", "pattern2", "pattern3"],
  "color_insights": {
    "best_backgrounds": ["color or description"],
    "accent_colors": ["color or description"],
    "data_visualization": "brief note on how to show gains/losses"
  },
  "interaction_patterns": ["pattern1", "pattern2", "pattern3"],
  "must_have_components": ["component1", "component2", "component3"],
  "avoid_these_mistakes": ["mistake1", "mistake2", "mistake3"],
  "inspiration_summary": "2-3 sentence summary of what makes great investment UIs"
}`,
        },
      ],
    });

    // Parse the JSON response from Claude
    const raw = message.content[0].text.trim();
    const research = JSON.parse(raw);
    console.log('  [uxResearcher] Research complete.');
    return research;

  } catch (err) {
    console.error('  [uxResearcher] Error:', err.message);
    // Fall back to mock research on error so the chain doesn't break
    return getMockResearch();
  }
}

/**
 * getMockResearch() — Returns hardcoded research notes.
 * Used when no API key is available or if Claude errors out.
 */
function getMockResearch() {
  return {
    top_layout_patterns: [
      'Sticky header with portfolio summary always visible',
      'Left sidebar for navigation, main area for data, right panel for details',
      'Card-based feed for news and signals with infinite scroll',
    ],
    color_insights: {
      best_backgrounds: ['#0a0a0f near-black', '#111827 dark gray'],
      accent_colors: ['#22c55e green for gains', '#ef4444 red for losses', '#3b82f6 blue for neutral signals'],
      data_visualization: 'Always use green/red for positive/negative. Use opacity to reduce noise.',
    },
    interaction_patterns: [
      'Hover to expand — show more detail on card hover without navigation',
      'Click to drill down — click any asset to see a full analysis panel',
      'Swipe/scroll carousels for ranked lists (top assets, top influencers)',
    ],
    must_have_components: [
      'Persistent portfolio performance bar at the top',
      'Real-time signal feed with sentiment badges (bullish/bearish/neutral)',
      'Quick-add watchlist button on every asset card',
    ],
    avoid_these_mistakes: [
      'Too much text — use numbers and icons, not paragraphs',
      'No visual hierarchy — everything the same size = nothing stands out',
      'Missing loading states — users need feedback when data is fetching',
    ],
    inspiration_summary: 'The best investment dashboards combine Bloomberg\'s data density with Robinhood\'s simplicity. Dark mode with high-contrast numbers, clear gain/loss colors, and a feed that surfaces the most important signals first.',
    is_mock: true,
  };
}

module.exports = { research };

/**
 * agents/uxDesigner.js — The UX Designer Agent
 *
 * This agent takes the research notes from uxResearcher and uses Claude AI
 * to act as a senior UI/UX designer. It looks at our CURRENT dashboard
 * (described in the prompt) and produces specific, actionable suggestions
 * for improving it based on the research.
 *
 * Think of this agent as: "Given what great dashboards do, here's what WE should change."
 *
 * Flow: uxResearcher.research() → researchNotes → uxDesigner.suggest(researchNotes)
 */

const Anthropic = require('@anthropic-ai/sdk');

// Initialize Claude client — reads ANTHROPIC_API_KEY from .env
const client = new Anthropic();

/**
 * suggest(researchNotes) — The main function.
 * Takes research notes from the researcher agent and generates
 * specific improvement suggestions for our dashboard.
 *
 * @param {Object} researchNotes — Output from uxResearcher.research()
 * @returns {Object} — Structured list of design suggestions
 */
async function suggest(researchNotes) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // If no API key, return mock suggestions so the UI still works
  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    console.log('  [uxDesigner] No API key — returning mock suggestions');
    return getMockSuggestions();
  }

  console.log('  [uxDesigner] Asking Claude to generate design improvements...');

  // Convert the research notes object into a readable string for the prompt
  const researchContext = JSON.stringify(researchNotes, null, 2);

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      messages: [
        {
          role: 'user',
          content: `You are a senior UI/UX designer for a fintech startup.

Here is research on what makes great investment dashboards:
${researchContext}

Our current dashboard ("Pulse") has:
- A dark navbar with broker connect badges and a Login button
- A hero headline section
- A horizontal Swiper.js coverflow carousel showing Top 10 stocks
- A second coverflow carousel showing Top 5 influencers
- A "Latest Posts" feed connected to a live scraper
- Color scheme: #0a0a0f background, #22c55e green accent, #a78bfa purple for influencers

Based on the research above, suggest SPECIFIC improvements we should make to our dashboard.
Be concrete — don't say "improve typography", say "increase the stock ticker font to 40px bold".

Respond in JSON format only — no markdown, just raw JSON:
{
  "priority_improvements": [
    {
      "title": "Short name for this improvement",
      "area": "which part of the UI (navbar / hero / stock carousel / influencer carousel / feed)",
      "what_to_change": "Specific description of the change",
      "why": "One sentence explaining why this helps users"
    }
  ],
  "quick_wins": [
    "One-line quick change that would instantly improve the UX"
  ],
  "future_features": [
    "Bigger feature ideas to add later"
  ],
  "overall_score": {
    "current": "X/10",
    "potential": "X/10",
    "comment": "One sentence honest assessment"
  }
}`,
        },
      ],
    });

    // Parse Claude's JSON response
    const raw = message.content[0].text.trim();
    const suggestions = JSON.parse(raw);
    console.log('  [uxDesigner] Design suggestions ready.');
    return suggestions;

  } catch (err) {
    console.error('  [uxDesigner] Error:', err.message);
    return getMockSuggestions();
  }
}

/**
 * getMockSuggestions() — Returns hardcoded suggestions.
 * Used when no API key is set.
 */
function getMockSuggestions() {
  return {
    priority_improvements: [
      {
        title: 'Add Portfolio Summary Bar',
        area: 'navbar',
        what_to_change: 'Add a slim bar below the navbar showing total portfolio value, today\'s gain/loss in $ and %, and number of open positions.',
        why: 'Users need to see portfolio performance at a glance without leaving the main feed.',
      },
      {
        title: 'Add Sentiment Badge to Stock Cards',
        area: 'stock carousel',
        what_to_change: 'Add a small pill badge (BULLISH / BEARISH / NEUTRAL) to each stock card based on recent X post sentiment.',
        why: 'Connects the scraper output directly to the visual cards, showing why a stock is trending.',
      },
      {
        title: 'Add Loading Skeleton States',
        area: 'feed',
        what_to_change: 'Replace the plain "Fetching posts..." text with animated gray skeleton card placeholders.',
        why: 'Skeleton screens reduce perceived wait time and look far more professional.',
      },
      {
        title: 'Add Watchlist Button to Each Card',
        area: 'stock carousel',
        what_to_change: 'Add a small star/bookmark icon to each stock card that toggles a watchlist saved in localStorage.',
        why: 'The #1 action users want in an investment app is saving interesting stocks for later.',
      },
    ],
    quick_wins: [
      'Increase hero headline font weight to 900 (black) for stronger impact',
      'Add a subtle animated gradient glow behind the active coverflow card',
      'Show the scraper\'s last-run timestamp below the "Run Scraper" button',
      'Add a post count badge next to the "Latest Posts" section header',
    ],
    future_features: [
      'Price sparkline chart inside each stock card (7-day trend line)',
      'Notification bell that alerts when a tracked influencer posts about a watched stock',
      'Side-by-side comparison panel for two selected stocks',
      'AI-generated daily summary: "Top 3 most discussed stocks this morning"',
    ],
    overall_score: {
      current: '6/10',
      potential: '9/10',
      comment: 'Strong visual foundation with the dark theme and coverflow — adding data density (portfolio bar, sentiment badges) would make it genuinely useful.',
    },
    is_mock: true,
  };
}

module.exports = { suggest };

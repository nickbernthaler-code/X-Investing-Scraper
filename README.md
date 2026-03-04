# X Investing Scraper

An investment intelligence platform that scrapes X (Twitter) accounts for high-signal stock ideas, re-analyzes them with AI, and matches them to your personal portfolio.

## Architecture

```
[Scraper Agent] ──────┐
                      ├──→ [Analyst Agent (Claude AI)] ──→ [Recommender Agent]
[Market Data Agent] ──┘              ↑
                             [Portfolio Agent]
                                     ↑
                             [Orchestrator Agent]  ← controls everything
```

## Agents

| Agent | File | Role |
|---|---|---|
| Orchestrator | `agents/orchestrator.js` | Runs all agents in the right order |
| Scraper | `agents/scraper.js` | Fetches posts from tracked X accounts |
| Market Data | `agents/marketData.js` | Fetches real-time stock prices (Alpha Vantage) |
| Analyst | `agents/analyst.js` | Re-evaluates posts using Claude AI |
| Portfolio | `agents/portfolio.js` | Manages user's stock positions |
| Recommender | `agents/recommender.js` | Matches analysis to portfolio gaps |

## Project Structure

```
X-Investing-Scraper/
├── app.js                  # Express server entry point
├── agents/                 # All 6 agents
├── database/               # SQLite setup and schema
├── routes/                 # API endpoints
├── public/                 # Frontend (HTML, CSS, JS)
├── data/                   # Static data (default accounts list)
├── .env.example            # Template for API keys
└── README.md               # This file
```

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Copy `.env.example` to `.env` and add your API keys:
   ```
   cp .env.example .env
   ```

3. Start the server:
   ```
   npm start
   ```

4. Open your browser at `http://localhost:3000`

## API Keys Needed

| Service | Purpose | Cost |
|---|---|---|
| [Anthropic](https://console.anthropic.com) | AI analysis | Pay per use |
| [Alpha Vantage](https://www.alphavantage.co) | Market data | Free tier available |
| X API (optional) | Real post scraping | $100/month |

> The app works with mock data if no API keys are set — useful for development.

## Tech Stack

- **Backend:** Node.js + Express
- **Database:** SQLite (via better-sqlite3)
- **AI:** Claude API (Anthropic)
- **Market Data:** Alpha Vantage
- **Frontend:** HTML + CSS + Vanilla JavaScript

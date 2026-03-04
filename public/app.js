/**
 * public/app.js — Frontend JavaScript for the dashboard
 *
 * This file runs in the browser and connects the dashboard UI
 * to the backend API. It fetches posts and recommendations
 * and renders them as cards on the page.
 */

// --- Run when the page finishes loading ---
document.addEventListener('DOMContentLoaded', () => {
  loadPosts();
  loadPortfolio();
  loadAccounts();
});

/**
 * loadPosts() — Fetches scraped posts from the API and renders them.
 */
async function loadPosts() {
  const container = document.getElementById('posts-container');
  if (!container) return;

  try {
    const response = await fetch('/api/posts');
    const data = await response.json();

    if (!data.success || data.data.length === 0) {
      container.innerHTML = '<p class="empty-state">No posts yet. Click "Run Scraper" to fetch posts.</p>';
      return;
    }

    // Render each post as a card
    container.innerHTML = data.data.map(post => renderPostCard(post)).join('');
  } catch (err) {
    container.innerHTML = `<p class="empty-state">Error loading posts: ${err.message}</p>`;
  }
}

/**
 * renderPostCard(post) — Returns HTML string for a single post card.
 */
function renderPostCard(post) {
  return `
    <div class="post-card">
      <div class="username">@${post.username}</div>
      <div class="content">${post.content}</div>
      <div class="date">${post.scraped_at || ''}</div>
    </div>
  `;
}

/**
 * loadPortfolio() — Fetches portfolio positions and renders them.
 */
async function loadPortfolio() {
  const container = document.getElementById('portfolio-container');
  if (!container) return;

  try {
    const response = await fetch('/api/portfolio');
    const data = await response.json();

    if (!data.success || data.data.length === 0) {
      container.innerHTML = '<p class="empty-state">No positions yet. Add stocks to your portfolio below.</p>';
      return;
    }

    container.innerHTML = data.data.map(pos => `
      <div class="post-card">
        <div class="username">$${pos.ticker}</div>
        <div class="content">${pos.company_name} — ${pos.shares} shares</div>
        <div class="date">Sector: ${pos.sector} | Region: ${pos.region}</div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p class="empty-state">Error loading portfolio: ${err.message}</p>`;
  }
}

/**
 * loadAccounts() — Fetches tracked X accounts and renders them.
 */
async function loadAccounts() {
  const container = document.getElementById('accounts-container');
  if (!container) return;

  try {
    const response = await fetch('/api/accounts');
    const data = await response.json();

    if (!data.success || data.data.length === 0) {
      container.innerHTML = '<p class="empty-state">No accounts tracked yet.</p>';
      return;
    }

    container.innerHTML = data.data.map(acc => `
      <span class="username" style="display:inline-block; margin: 4px 8px;">@${acc.username}</span>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p class="empty-state">Error loading accounts: ${err.message}</p>`;
  }
}

/**
 * runScraper() — Triggers the full pipeline via the API.
 * Called when the user clicks the "Run Scraper" button.
 */
async function runScraper() {
  const btn = document.getElementById('run-btn');
  if (btn) {
    btn.textContent = 'Running...';
    btn.disabled = true;
  }

  try {
    const response = await fetch('/api/run', { method: 'POST' });
    const data = await response.json();

    if (data.success) {
      alert(`Done! Found ${data.data.posts_found} posts and generated ${data.data.recommendations.length} recommendations.`);
      loadPosts(); // refresh the feed
    } else {
      alert('Error: ' + data.error);
    }
  } catch (err) {
    alert('Failed to run scraper: ' + err.message);
  } finally {
    if (btn) {
      btn.textContent = 'Run Scraper';
      btn.disabled = false;
    }
  }
}

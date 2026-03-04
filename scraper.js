/**
 * scraper.js
 *
 * Scrapes X (formerly Twitter) for investing-related posts
 * from a curated list of accounts that share stock ideas.
 */

// List of X accounts to track for investing content
const accountsToTrack = [
  "@StockPickerJay",
  "@ValueInvestSam",
  "@DailyTradesLiz",
  "@BullRunMike",
  "@AlphaSeeker99",
];

// Simple keywords we look for to identify investing-related posts
const investingKeywords = [
  "stock",
  "buy",
  "sell",
  "bullish",
  "bearish",
  "earnings",
  "dividend",
  "portfolio",
  "ticker",
  "long",
  "short",
];

/**
 * Checks if a post contains any investing-related keywords.
 * Returns true if at least one keyword is found in the text.
 */
function isInvestingPost(text) {
  // Convert to lowercase so matching is case-insensitive
  const lowerText = text.toLowerCase();
  return investingKeywords.some((keyword) => lowerText.includes(keyword));
}

/**
 * fetchPosts - Main async function that fetches posts from tracked accounts.
 *
 * NOTE: This is a placeholder that uses mock data for now.
 * A real implementation would connect to the X API or use a scraping library.
 */
async function fetchPosts() {
  console.log("--- X Investing Scraper ---");
  console.log(`Tracking ${accountsToTrack.length} accounts...\n`);

  // Mock data simulating posts from our tracked accounts
  const mockPosts = [
    { user: "@StockPickerJay", text: "Bullish on $AAPL after earnings beat!" },
    { user: "@ValueInvestSam", text: "Just had a great coffee this morning." },
    { user: "@DailyTradesLiz", text: "Buy signal on $TSLA, strong volume today." },
    { user: "@BullRunMike", text: "Added $NVDA to my portfolio. Long-term hold." },
    { user: "@AlphaSeeker99", text: "Enjoying the weekend, no trades today." },
    { user: "@StockPickerJay", text: "Sell alert: taking profits on $MSFT." },
  ];

  // Filter posts to only show investing-related content
  const investingPosts = mockPosts.filter((post) => isInvestingPost(post.text));

  // Display the filtered results
  console.log(`Found ${investingPosts.length} investing-related posts:\n`);
  investingPosts.forEach((post, index) => {
    console.log(`${index + 1}. ${post.user}: "${post.text}"`);
  });

  console.log("\n--- Scraping complete ---");
}

// Run the scraper
fetchPosts();

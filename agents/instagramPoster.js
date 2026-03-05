/**
 * agents/instagramPoster.js — The Instagram Poster Agent
 *
 * Takes the top stock recommendations from the Recommender Agent and:
 *   1. Uses Claude AI to write an engaging Instagram caption
 *   2. Posts it to Instagram via the Meta Graph API
 *
 * Falls back to "mock mode" (just logs the post) if no Instagram
 * credentials are set — so you can test without an account set up.
 *
 * HOW TO SET UP INSTAGRAM POSTING:
 *   1. Create an Instagram Business or Creator account
 *   2. Connect it to a Facebook Page (required by Meta)
 *   3. Create a free Meta Developer app at https://developers.facebook.com
 *   4. Generate a long-lived access token
 *   5. Add INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_ACCOUNT_ID to your .env file
 *
 * NOTE: Instagram requires an image for every post.
 * For now, we use a placeholder finance image URL. Later you can
 * swap this with a real chart or AI-generated image.
 */

const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');

// Initialize Claude client
const client = new Anthropic();

// A placeholder stock market image (publicly accessible, required by Instagram API)
// You can replace this with a dynamic chart image later
const PLACEHOLDER_IMAGE_URL = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1080&q=80';

/**
 * generateCaption(recommendations) — Uses Claude AI to write an Instagram caption
 * based on the top stock recommendations from the pipeline.
 *
 * @param {Array} recommendations - Array of recommendation objects from recommender.js
 * @returns {string} A ready-to-post Instagram caption with hashtags
 */
async function generateCaption(recommendations) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // If no Claude API key, use a simple fallback caption
  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    console.log('  [instagramPoster] No Claude API key — using fallback caption');
    return generateFallbackCaption(recommendations);
  }

  // Take the top 3 recommendations to feature in the post
  const top3 = recommendations.slice(0, 3);

  // Format recommendations into a readable list for the prompt
  const recSummary = top3
    .map(r => `$${r.ticker}: "${r.analysis_summary}" (confidence: ${r.confidence}/10)`)
    .join('\n');

  try {
    console.log('  [instagramPoster] Asking Claude to write Instagram caption...');

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6', // Using Sonnet for fast, cost-effective caption writing
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: `You are a financial content creator on Instagram. Write an engaging Instagram caption
based on these stock insights discovered today. Keep it educational, exciting, and accessible
for beginner investors. End with 10-15 relevant hashtags.

Today's top picks:
${recSummary}

Rules:
- Keep the caption under 200 words
- Use emojis to make it visually appealing
- Don't give direct buy/sell advice — frame as "interesting insights"
- End with a call to action like "Follow for daily picks 📲"
- Then add hashtags on a new line`,
        },
      ],
    });

    return message.content[0].text;

  } catch (err) {
    console.error('  [instagramPoster] Claude API error:', err.message);
    return generateFallbackCaption(recommendations); // fallback on error
  }
}

/**
 * generateFallbackCaption(recommendations) — Simple caption without AI.
 * Used when no API key is available.
 *
 * @param {Array} recommendations - Array of recommendation objects
 * @returns {string} A basic caption
 */
function generateFallbackCaption(recommendations) {
  // Get up to 3 tickers to feature
  const tickers = recommendations.slice(0, 3).map(r => `$${r.ticker}`).join(', ');

  return `📈 Today's top investing insights: ${tickers}

These stocks are generating buzz among top investors on X. Always do your own research before investing!

Follow for daily stock insights 📲

#investing #stocks #stockmarket #finance #wallstreet #investing101 #stockpicks #trader #financialfreedom #money`;
}

/**
 * postToInstagram(caption) — Sends a post to Instagram via the Meta Graph API.
 *
 * Instagram posting requires two steps:
 *   Step 1: Create a "media container" (upload the image + caption)
 *   Step 2: Publish the container (makes it live)
 *
 * @param {string} caption - The caption text to post
 * @returns {Object} Result object with success status and post details
 */
async function postToInstagram(caption) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID;

  // If no Instagram credentials, run in mock mode
  if (!accessToken || accessToken === 'your_instagram_access_token_here') {
    console.log('\n  [instagramPoster] ⚠️  No Instagram credentials — running in MOCK MODE');
    console.log('  [instagramPoster] Would have posted:\n');
    console.log('  ------- CAPTION PREVIEW -------');
    console.log(caption);
    console.log('  --------------------------------\n');

    return {
      success: true,
      mock: true,
      message: 'Mock post — add INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_ACCOUNT_ID to .env to go live',
      caption,
    };
  }

  try {
    // --- Step 1: Create media container ---
    console.log('  [instagramPoster] Step 1: Creating Instagram media container...');

    const containerRes = await axios.post(
      `https://graph.facebook.com/v19.0/${accountId}/media`,
      {
        image_url: PLACEHOLDER_IMAGE_URL, // The image to use for the post
        caption: caption,                 // The caption text
        access_token: accessToken,
      }
    );

    const creationId = containerRes.data.id;
    console.log(`  [instagramPoster] ✅ Container created: ${creationId}`);

    // --- Step 2: Publish the container ---
    console.log('  [instagramPoster] Step 2: Publishing to Instagram...');

    const publishRes = await axios.post(
      `https://graph.facebook.com/v19.0/${accountId}/media_publish`,
      {
        creation_id: creationId,
        access_token: accessToken,
      }
    );

    const postId = publishRes.data.id;
    console.log(`  [instagramPoster] ✅ Published! Post ID: ${postId}`);

    return {
      success: true,
      mock: false,
      post_id: postId,
      caption,
      message: 'Successfully posted to Instagram!',
    };

  } catch (err) {
    // Log the full error for debugging
    const errorMsg = err.response?.data?.error?.message || err.message;
    console.error('  [instagramPoster] ❌ Instagram API error:', errorMsg);

    return {
      success: false,
      error: errorMsg,
      caption, // Return the caption even on failure so it's not lost
    };
  }
}

/**
 * run(recommendations) — Main function. Ties caption generation + posting together.
 *
 * @param {Array} recommendations - Top recommendations from the Recommender Agent
 * @returns {Object} Result of the Instagram post attempt
 */
async function run(recommendations) {
  // Don't post if there are no recommendations to share
  if (!recommendations || recommendations.length === 0) {
    console.log('  [instagramPoster] No recommendations to post — skipping');
    return { success: false, message: 'No recommendations available to post' };
  }

  // Step 1: Generate a caption using Claude
  const caption = await generateCaption(recommendations);

  // Step 2: Post to Instagram (or mock it)
  const result = await postToInstagram(caption);

  return result;
}

module.exports = { run, generateCaption, postToInstagram };

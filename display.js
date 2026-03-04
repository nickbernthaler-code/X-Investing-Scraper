/**
 * display.js
 *
 * Functions for formatting and displaying scraped X (Twitter) posts
 * about stock investing ideas in a readable format.
 */

/**
 * renderPost - Takes a single post object and formats it into
 * a readable string for display in the console.
 *
 * @param {Object} post - A post object with author, date, and content
 * @returns {string} A formatted string representing the post
 */
function renderPost(post) {
  // Build a divider line to separate posts visually
  const divider = '─'.repeat(50);

  // Format the post into a readable block with author, date, and content
  const formatted = [
    divider,
    `@${post.author}  |  ${post.date}`,
    '',
    post.content,
    divider
  ].join('\n');

  return formatted;
}

/**
 * displayAll - Takes an array of post objects and prints each one
 * to the console using renderPost(). Also shows a summary count.
 *
 * @param {Array} posts - An array of post objects to display
 */
function displayAll(posts) {
  // Handle the case where there are no posts to show
  if (!posts || posts.length === 0) {
    console.log('No posts to display.');
    return;
  }

  // Print a header showing how many posts were found
  console.log(`\nFound ${posts.length} investing post(s):\n`);

  // Loop through each post and print its formatted version
  for (const post of posts) {
    console.log(renderPost(post));
  }
}

// Export both functions so other files can use them
module.exports = { renderPost, displayAll };

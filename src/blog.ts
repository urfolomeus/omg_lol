import fetch from 'node-fetch';
import { outputDecorator } from './utils/outputDecorator.js';

interface Author {
  name: string;
}

interface BlogPost {
  id: string;
  title: string;
  content_text: string;
  date_published: string;
  author: Author;
}

interface BlogFeed {
  version: string;
  title: string;
  items: BlogPost[];
}


// Helper functions for date handling
function getPostDate(post: BlogPost): Date {
  return new Date(post.date_published);
}

function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDaysBetween(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

// Helper function to sort posts by date
function sortPostsByDate(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort((a, b) => getPostDate(a).getTime() - getPostDate(b).getTime());
}

async function fetchJSON(url: string): Promise<BlogFeed> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json() as BlogFeed;
    if (!data.items) {
      throw new Error('Invalid response format');
    }

    return data;
  } catch (error) {
    // Wrap all errors in a consistent format
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch blog posts: ${message}`);
  }
}

// Command handlers
function handleTimeline(feed: BlogFeed): void {
  const posts = sortPostsByDate(feed.items);

  if (posts.length === 0) {
    return;
  }

  // Get first and last dates
  const firstDate = getPostDate(posts[0]);
  const lastDate = getPostDate(posts[posts.length - 1]);

  // Create a map of dates to post counts
  const postCounts = new Map<string, number>();
  posts.forEach(post => {
    const date = getDateString(getPostDate(post));
    postCounts.set(date, (postCounts.get(date) || 0) + 1);
  });

  // Generate timeline
  const currentDate = new Date(firstDate);
  while (currentDate <= lastDate) {
    const dateStr = getDateString(currentDate);
    const count = postCounts.get(dateStr) || 0;
    const line = `${dateStr}  ${count}`;
    console.log(outputDecorator(line, count === 0 ? 'error' : 'normal'));
    currentDate.setDate(currentDate.getDate() + 1);
  }
}

function handleStatus(feed: BlogFeed): void {
  const posts = sortPostsByDate(feed.items);

  if (posts.length === 0) {
    console.log(outputDecorator('Total: 0, Days: 0, Delta: 0'));
    return;
  }

  const total = posts.length;
  const firstDate = getPostDate(posts[0]);
  const today = new Date();
  const dayCount = getDaysBetween(firstDate, today);
  const delta = total - dayCount;

  console.log(outputDecorator(`Total: ${total}, Days: ${dayCount}, Delta: ${delta}`));
}

// Main function that runs the program
export async function main(url?: string, command?: string): Promise<void> {
  try {
    const feedUrl = url || process.env.BLOG_FEED_URL;
    if (!feedUrl) {
      throw new Error('Blog feed URL not provided');
    }

    const knownCommands = ['timeline', 'status'] as const;
    if (!command || !knownCommands.includes(command as typeof knownCommands[number])) {
      throw new Error('Unknown blog command: ' + command);
    }

    const feed = await fetchJSON(feedUrl);
    switch (command) {
      case 'timeline':
        handleTimeline(feed);
        break;
      case 'status':
        handleStatus(feed);
        break;
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error:', outputDecorator(error.message, 'error'));
    } else {
      console.error('Error:', outputDecorator(String(error), 'error'));
    }
    process.exit(1);
  }
}

// Only run if this file is being executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  main(undefined, command);
}

export { outputDecorator };

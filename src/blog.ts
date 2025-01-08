import fetch, { FetchError } from 'node-fetch';

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

function countPosts(feed: BlogFeed): number {
  return feed.items.length;
}

function generateTimeline(feed: BlogFeed): string[] {
  // Sort posts by date
  const posts = [...feed.items].sort((a, b) =>
    new Date(a.date_published).getTime() - new Date(b.date_published).getTime()
  );

  if (posts.length === 0) {
    return [];
  }

  // Get first and last dates
  const firstDate = new Date(posts[0].date_published);
  const lastDate = new Date(posts[posts.length - 1].date_published);

  // Create a map of dates to post counts
  const postCounts = new Map<string, number>();
  posts.forEach(post => {
    const date = post.date_published.split('T')[0];
    postCounts.set(date, (postCounts.get(date) || 0) + 1);
  });

  // Generate timeline
  const timeline: string[] = [];
  const currentDate = new Date(firstDate);
  while (currentDate <= lastDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const count = postCounts.get(dateStr) || 0;
    timeline.push(`${dateStr}  ${count}`);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return timeline;
}

interface TrackStats {
  total: number;
  dayCount: number;
  delta: number;
}

function calculateTrackStats(feed: BlogFeed): TrackStats {
  const posts = [...feed.items].sort((a, b) =>
    new Date(a.date_published).getTime() - new Date(b.date_published).getTime()
  );

  if (posts.length === 0) {
    return { total: 0, dayCount: 0, delta: 0 };
  }

  const total = posts.length;
  const firstDate = new Date(posts[0].date_published);
  const today = new Date();

  // Calculate days between first post and today (inclusive)
  const dayCount = Math.floor((today.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const delta = total - dayCount;

  return { total, dayCount, delta };
}

// Main function that runs the program
export async function main(url?: string, command?: string): Promise<void> {
  try {
    const feedUrl = url || process.env.BLOG_FEED_URL;
    if (!feedUrl) {
      throw new Error('Blog feed URL not provided');
    }

    switch (command) {
      case 'count':
        const countFeed = await fetchJSON(feedUrl);
        const count = countPosts(countFeed);
        console.log(count);
        break;
      case 'timeline':
        const timelineFeed = await fetchJSON(feedUrl);
        const timeline = generateTimeline(timelineFeed);
        timeline.forEach(line => console.log(line));
        break;
      case 'track':
        const trackFeed = await fetchJSON(feedUrl);
        const stats = calculateTrackStats(trackFeed);
        console.log(`Total: ${stats.total}, Days: ${stats.dayCount}, Delta: ${stats.delta}`);
        break;
      default:
        throw new Error('Unknown blog command: ' + command);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error:', error.message);
    } else {
      console.error('Error:', String(error));
    }
    process.exit(1);
  }
}

// Only run if this file is being executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  main(undefined, command);
}

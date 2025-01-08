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

// Main function that runs the program
export async function main(url?: string): Promise<void> {
  try {
    const feedUrl = url || process.env.BLOG_FEED_URL;
    if (!feedUrl) {
      throw new Error('Blog feed URL not provided');
    }

    const feed = await fetchJSON(feedUrl);
    const count = countPosts(feed);
    console.log(count);
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
  main();
}

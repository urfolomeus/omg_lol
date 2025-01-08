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

export async function countPosts(url?: string): Promise<number> {
  const feedUrl = url || process.env.BLOG_FEED_URL;
  if (!feedUrl) {
    throw new Error('Blog feed URL not provided');
  }

  try {
    const response = await fetch(feedUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch blog posts: Server returned ' + response.status);
    }
    const data = await response.json() as BlogFeed;
    if (!data.items) {
      throw new Error('Failed to fetch blog posts: Invalid response format');
    }
    return data.items.length;
  } catch (error) {
    if (error instanceof FetchError) {
      throw new Error('Failed to fetch blog posts: Network error');
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to fetch blog posts: ${String(error)}`);
  }
}

// Main function that runs the program
export async function main(url?: string): Promise<void> {
  try {
    const count = await countPosts(url);
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

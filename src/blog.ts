import fetch from 'node-fetch';
import { outputDecorator } from './utils/outputDecorator.js';

interface WeblogEntry {
  entry: string;
  location: string;
  title: string;
  date: string;
  type: string;
  status: string;
  metadata: string;
}

interface WeblogEntries {
  entries: WeblogEntry[];
}
interface WeblogResponse {
  response: WeblogEntries;
}

// Helper functions for date handling
function getPostDate(post: WeblogEntry): Date {
  return new Date(parseInt(post.date) * 1000);
}

function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDaysBetween(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

// Helper function to sort posts by date
function sortPostsByDate(posts: WeblogEntry[]): WeblogEntry[] {
  return [...posts]
    .sort((a, b) => getPostDate(a).getTime() - getPostDate(b).getTime());
}

async function fetchWeblogEntries(baseUrl: string): Promise<WeblogEntry[]> {
  const url = `${baseUrl}/weblog/entries`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.API_TOKEN}`,
      }
    });
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json() as WeblogResponse;
    const entries = data.response.entries;
    if (!entries) {
      throw new Error('Invalid response format');
    }

    return entries;
  } catch (error) {
    // Wrap all errors in a consistent format
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch blog posts: ${message}`);
  }
}

// Command handlers
function handleTimeline(entries: WeblogEntry[]): void {
  const posts = sortPostsByDate(entries);

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

function handleStatus(entries: WeblogEntry[]): void {
  const posts = sortPostsByDate(entries);

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
    const baseUrl = url || process.env.API_URL;
    if (!baseUrl) {
      throw new Error('Blog feed URL not provided');
    }

    const knownCommands = ['timeline', 'status'] as const;
    if (!command || !knownCommands.includes(command as typeof knownCommands[number])) {
      throw new Error('Unknown blog command: ' + command);
    }

    const entries = await fetchWeblogEntries(baseUrl);

    switch (command) {
      case 'timeline':
        handleTimeline(entries);
        break;
      case 'status':
        handleStatus(entries);
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

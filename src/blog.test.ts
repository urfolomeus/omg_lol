import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { main } from './blog';

const TEST_BLOG_URL = 'https://test.weblog.lol/feed.json';

// Capture console output
const mockConsoleError = vi.spyOn(console, 'error');
const mockConsoleLog = vi.spyOn(console, 'log');

// Mock process.exit
const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

// Setup MSW server for mocking HTTP requests
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  server.resetHandlers();
  mockConsoleError.mockReset();
  mockConsoleLog.mockReset();
  mockExit.mockReset();
});

afterAll(() => server.close());

// Test helper functions
function testInvalidJsonStructure(command: string) {
  it('should handle invalid JSON structure', async () => {
    server.use(
      http.get(TEST_BLOG_URL, () => {
        return HttpResponse.json({
          version: "https://jsonfeed.org/version/1.1",
          title: "Test Blog"
          // Missing 'items' array
        });
      })
    );

    await main(TEST_BLOG_URL, command);

    expect(mockConsoleLog).not.toHaveBeenCalled();
    expect(mockConsoleError).toHaveBeenCalledWith(
      'Error:',
      'Failed to fetch blog posts: Invalid response format'
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
}

function testNetworkError(command: string) {
  it('should handle network errors', async () => {
    server.use(
      http.get(TEST_BLOG_URL, () => {
        return new HttpResponse(
          JSON.stringify({ error: 'Internal Server Error' }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      })
    );

    await main(TEST_BLOG_URL, command);

    expect(mockConsoleLog).not.toHaveBeenCalled();
    expect(mockConsoleError).toHaveBeenCalledWith(
      'Error:',
      'Failed to fetch blog posts: Server returned 500'
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
}

function testEmptyBlogFeed(command: string, expectedOutput: string | null) {
  it('should handle empty blog feed', async () => {
    server.use(
      http.get(TEST_BLOG_URL, () => {
        return HttpResponse.json({
          version: "https://jsonfeed.org/version/1.1",
          title: "Test Blog",
          items: []
        });
      })
    );

    await main(TEST_BLOG_URL, command);

    if (expectedOutput) {
      expect(mockConsoleLog).toHaveBeenCalledWith(expectedOutput);
    } else {
      expect(mockConsoleLog).not.toHaveBeenCalled();
    }
    expect(mockConsoleError).not.toHaveBeenCalled();
    expect(mockExit).not.toHaveBeenCalled();
  });
}

function testUrlHandling(command: string, mockResponse: object, expectedOutput: string[] | string) {
  it('should use BLOG_FEED_URL environment variable when no URL provided', async () => {
    process.env.BLOG_FEED_URL = TEST_BLOG_URL;

    server.use(
      http.get(TEST_BLOG_URL, () => {
        return HttpResponse.json(mockResponse);
      })
    );

    await main(undefined, command);

    if (Array.isArray(expectedOutput)) {
      expect(mockConsoleLog).toHaveBeenCalledTimes(expectedOutput.length);
      expectedOutput.forEach((output, index) => {
        expect(mockConsoleLog).toHaveBeenNthCalledWith(index + 1, output);
      });
    } else {
      expect(mockConsoleLog).toHaveBeenCalledWith(expectedOutput);
    }
    expect(mockConsoleError).not.toHaveBeenCalled();
    expect(mockExit).not.toHaveBeenCalled();

    delete process.env.BLOG_FEED_URL;
  });

  it('should error when no URL is provided and BLOG_FEED_URL is not set', async () => {
    delete process.env.BLOG_FEED_URL;

    await main(undefined, command);

    expect(mockConsoleLog).not.toHaveBeenCalled();
    expect(mockConsoleError).toHaveBeenCalledWith(
      'Error:',
      'Blog feed URL not provided'
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
}

describe('timeline', () => {
  it('should display timeline of posts with correct counts', async () => {
    server.use(
      http.get(TEST_BLOG_URL, () => {
        return HttpResponse.json({
          version: "https://jsonfeed.org/version/1.1",
          title: "Test Blog",
          items: [
            { id: "1", title: "Post 1", date_published: "2024-12-12T10:00:00Z" },
            { id: "2", title: "Post 2", date_published: "2024-12-12T11:00:00Z" },
            { id: "3", title: "Post 3", date_published: "2024-12-12T12:00:00Z" },
            { id: "4", title: "Post 4", date_published: "2024-12-13T10:00:00Z" },
            { id: "5", title: "Post 5", date_published: "2024-12-15T10:00:00Z" }
          ]
        });
      })
    );

    await main(TEST_BLOG_URL, 'timeline');

    expect(mockConsoleLog).toHaveBeenCalledTimes(4);
    expect(mockConsoleLog).toHaveBeenNthCalledWith(1, '2024-12-12  3');
    expect(mockConsoleLog).toHaveBeenNthCalledWith(2, '2024-12-13  1');
    expect(mockConsoleLog).toHaveBeenNthCalledWith(3, '2024-12-14  0');
    expect(mockConsoleLog).toHaveBeenNthCalledWith(4, '2024-12-15  1');
    expect(mockConsoleError).not.toHaveBeenCalled();
    expect(mockExit).not.toHaveBeenCalled();
  });

  testEmptyBlogFeed('timeline', null);
  testInvalidJsonStructure('timeline');
  testNetworkError('timeline');
  testUrlHandling(
    'timeline',
    {
      version: "https://jsonfeed.org/version/1.1",
      title: "Test Blog",
      items: [
        { id: "1", title: "Post 1", date_published: "2024-12-12T10:00:00Z" },
        { id: "2", title: "Post 2", date_published: "2024-12-13T10:00:00Z" }
      ]
    },
    ['2024-12-12  1', '2024-12-13  1']
  );
});

describe('status', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-12-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should display correct status stats', async () => {
    server.use(
      http.get(TEST_BLOG_URL, () => {
        return HttpResponse.json({
          version: "https://jsonfeed.org/version/1.1",
          title: "Test Blog",
          items: [
            { id: "1", title: "Post 1", date_published: "2024-12-12T10:00:00Z" },
            { id: "2", title: "Post 2", date_published: "2024-12-12T11:00:00Z" },
            { id: "3", title: "Post 3", date_published: "2024-12-13T12:00:00Z" }
          ]
        });
      })
    );

    await main(TEST_BLOG_URL, 'status');

    expect(mockConsoleLog).toHaveBeenCalledWith('Total: 3, Days: 4, Delta: -1');
    expect(mockConsoleError).not.toHaveBeenCalled();
    expect(mockExit).not.toHaveBeenCalled();
  });

  testEmptyBlogFeed('status', 'Total: 0, Days: 0, Delta: 0');
  testInvalidJsonStructure('status');
  testNetworkError('status');
  testUrlHandling(
    'status',
    {
      version: "https://jsonfeed.org/version/1.1",
      title: "Test Blog",
      items: [
        { id: "1", title: "Post 1", date_published: "2024-12-12T10:00:00Z" }
      ]
    },
    'Total: 1, Days: 4, Delta: -3'
  );
});

describe('command validation', () => {
  it('should handle unknown commands', async () => {
    await main(TEST_BLOG_URL, 'invalid-command');

    expect(mockConsoleLog).not.toHaveBeenCalled();
    expect(mockConsoleError).toHaveBeenCalledWith(
      'Error:',
      'Unknown blog command: invalid-command'
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should error when no command is provided', async () => {
    await main(TEST_BLOG_URL, undefined);

    expect(mockConsoleLog).not.toHaveBeenCalled();
    expect(mockConsoleError).toHaveBeenCalledWith(
      'Error:',
      'Unknown blog command: undefined'
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});

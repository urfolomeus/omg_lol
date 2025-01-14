import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { main } from './blog.js';
import { outputDecorator } from './utils/outputDecorator.js';

const TEST_API_URL = 'https://api.omg.lol/address/test';
const TEST_API_TOKEN = 'test-token';
const TEST_BLOG_URL = `${TEST_API_URL}/weblog/entries`;

// Capture console output
const mockConsoleError = vi.spyOn(console, 'error');
const mockConsoleLog = vi.spyOn(console, 'log');

// Mock process.exit
const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

// Setup MSW server for mocking HTTP requests
const server = setupServer();

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  process.env.API_TOKEN = TEST_API_TOKEN;
});

afterEach(() => {
  server.resetHandlers();
  mockConsoleError.mockReset();
  mockConsoleLog.mockReset();
  mockExit.mockReset();
});

afterAll(() => {
  server.close();
  delete process.env.API_TOKEN;
});

// Test helper functions
function testInvalidJsonStructure(command: string) {
  it('should handle invalid JSON structure', async () => {
    server.use(
      http.get(TEST_BLOG_URL, ({ request }) => {
        // Verify the Authorization header
        const authHeader = request.headers.get('Authorization');
        if (authHeader !== `Bearer ${TEST_API_TOKEN}`) {
          return new HttpResponse(null, { status: 401 });
        }

        return HttpResponse.json({
          response: {
            // Missing 'entries' array
          }
        });
      })
    );

    await main(TEST_API_URL, command);

    expect(mockConsoleLog).not.toHaveBeenCalled();
    expect(mockConsoleError).toHaveBeenCalledWith(
      'Error:',
      outputDecorator('Failed to fetch blog posts: Invalid response format', 'error')
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
}

function testNetworkError(command: string) {
  it('should handle network errors', async () => {
    server.use(
      http.get(TEST_BLOG_URL, () => {
        return new HttpResponse(
          JSON.stringify({ response: { error: 'Internal Server Error' } }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      })
    );

    await main(TEST_API_URL, command);

    expect(mockConsoleLog).not.toHaveBeenCalled();
    expect(mockConsoleError).toHaveBeenCalledWith(
      'Error:',
      outputDecorator('Failed to fetch blog posts: Server returned 500', 'error')
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
}

function testEmptyBlogFeed(command: string, expectedOutput: string | null) {
  it('should handle empty blog feed', async () => {
    server.use(
      http.get(TEST_BLOG_URL, () => {
        return HttpResponse.json({
          response: { entries: [] }
        });
      })
    );

    await main(TEST_API_URL, command);

    if (expectedOutput) {
      expect(mockConsoleLog).toHaveBeenCalledWith(outputDecorator(expectedOutput));
    } else {
      expect(mockConsoleLog).not.toHaveBeenCalled();
    }
    expect(mockConsoleError).not.toHaveBeenCalled();
    expect(mockExit).not.toHaveBeenCalled();
  });
}

function testUrlHandling(command: string, mockResponse: object, expectedOutput: string[] | string) {
  it('should use API_URL environment variable when no URL provided', async () => {
    process.env.API_URL = TEST_API_URL;

    server.use(
      http.get(TEST_BLOG_URL, () => {
        return HttpResponse.json({ response: mockResponse });
      })
    );

    await main(undefined, command);

    if (Array.isArray(expectedOutput)) {
      expect(mockConsoleLog).toHaveBeenCalledTimes(expectedOutput.length);
      expectedOutput.forEach((output, index) => {
        expect(mockConsoleLog).toHaveBeenNthCalledWith(index + 1, outputDecorator(output));
      });
    } else {
      expect(mockConsoleLog).toHaveBeenCalledWith(outputDecorator(expectedOutput));
    }
    expect(mockConsoleError).not.toHaveBeenCalled();
    expect(mockExit).not.toHaveBeenCalled();

    delete process.env.API_URL;
  });

  it('should error when no URL is provided and API_URL is not set', async () => {
    delete process.env.API_URL;

    await main(undefined, command);

    expect(mockConsoleLog).not.toHaveBeenCalled();
    expect(mockConsoleError).toHaveBeenCalledWith(
      'Error:',
      outputDecorator('Blog feed URL not provided', 'error')
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
}

describe('timeline', () => {
  it('should display timeline of posts with correct counts', async () => {
    server.use(
      http.get(TEST_BLOG_URL, ({ request }) => {
        // Verify the Authorization header
        const authHeader = request.headers.get('Authorization');
        if (authHeader !== `Bearer ${TEST_API_TOKEN}`) {
          return new HttpResponse(null, { status: 401 });
        }

        return HttpResponse.json({
          response: {
            entries: [
              { entry: "1", title: "Post 1", date: "1734001200", type: "post" },
              { entry: "2", title: "Post 2", date: "1734001200", type: "post" },
              { entry: "3", title: "Post 3", date: "1734001200", type: "post" },
              { entry: "4", title: "Post 4", date: "1734174000", type: "post" },
              { entry: "5", title: "Post 5", date: "1734260400", type: "post" }
            ]
          }
        });
      })
    );

    await main(TEST_API_URL, 'timeline');

    expect(mockConsoleLog).toHaveBeenCalledTimes(4);
    expect(mockConsoleLog).toHaveBeenNthCalledWith(1, outputDecorator('2024-12-12  3'));
    expect(mockConsoleLog).toHaveBeenNthCalledWith(2, outputDecorator('2024-12-13  0', 'error'));
    expect(mockConsoleLog).toHaveBeenNthCalledWith(3, outputDecorator('2024-12-14  1'));
    expect(mockConsoleLog).toHaveBeenNthCalledWith(4, outputDecorator('2024-12-15  1'));
    expect(mockConsoleError).not.toHaveBeenCalled();
    expect(mockExit).not.toHaveBeenCalled();
  });

  testEmptyBlogFeed('timeline', null);
  testInvalidJsonStructure('timeline');
  testNetworkError('timeline');
  testUrlHandling(
    'timeline',
    {
      entries: [
        { entry: "1", title: "Post 1", date: "1734001200", type: "post" },
        { entry: "2", title: "Post 2", date: "1734087600", type: "post" }
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
      http.get(TEST_BLOG_URL, ({ request }) => {
        // Verify the Authorization header
        const authHeader = request.headers.get('Authorization');
        if (authHeader !== `Bearer ${TEST_API_TOKEN}`) {
          return new HttpResponse(null, { status: 401 });
        }

        return HttpResponse.json({
          response: {
            entries: [
              { entry: "1", title: "Post 1", date: "1734001200", type: "post" },
              { entry: "2", title: "Post 2", date: "1734001200", type: "post" },
              { entry: "3", title: "Post 3", date: "1734001200", type: "post" }
            ]
          }
        });
      })
    );

    await main(TEST_API_URL, 'status');

    expect(mockConsoleLog).toHaveBeenCalledWith(outputDecorator('Total: 3, Days: 4, Delta: -1'));
    expect(mockConsoleError).not.toHaveBeenCalled();
    expect(mockExit).not.toHaveBeenCalled();
  });

  testEmptyBlogFeed('status', 'Total: 0, Days: 0, Delta: 0');
  testInvalidJsonStructure('status');
  testNetworkError('status');
  testUrlHandling(
    'status',
    {
      entries: [
        { entry: "1", title: "Post 1", date: "1734001200", type: "post" }
      ]
    },
    'Total: 1, Days: 4, Delta: -3'
  );
});

describe('command validation', () => {
  it('should handle unknown commands', async () => {
    await main(TEST_API_URL, 'invalid-command');

    expect(mockConsoleLog).not.toHaveBeenCalled();
    expect(mockConsoleError).toHaveBeenCalledWith(
      'Error:',
      outputDecorator('Unknown blog command: invalid-command', 'error')
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should error when no command is provided', async () => {
    await main(TEST_API_URL, undefined);

    expect(mockConsoleLog).not.toHaveBeenCalled();
    expect(mockConsoleError).toHaveBeenCalledWith(
      'Error:',
      outputDecorator('Unknown blog command: undefined', 'error')
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});

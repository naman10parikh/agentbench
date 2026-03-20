interface User {
  id: number;
  name: string;
  email: string;
}

const BASE_URL = "https://api.example.com/v1";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const TIMEOUT_MS = 5000;

export class NetworkError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "NetworkError";
  }
}

export class TimeoutError extends Error {
  constructor(url: string) {
    super(`Request to ${url} timed out after ${TIMEOUT_MS}ms`);
    this.name = "TimeoutError";
  }
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly url: string,
  ) {
    super(`HTTP ${status} ${statusText} from ${url}`);
    this.name = "HttpError";
  }
}

async function fetchWithTimeout(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new TimeoutError(url);
    }
    throw new NetworkError(`Failed to fetch ${url}`, err);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (err instanceof HttpError && err.status >= 400 && err.status < 500) {
        throw err; // Don't retry client errors
      }
      if (attempt < MAX_RETRIES - 1) {
        const delay = BASE_DELAY_MS * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

async function handleResponse<T>(response: Response, url: string): Promise<T> {
  if (!response.ok) {
    throw new HttpError(response.status, response.statusText, url);
  }
  return (await response.json()) as T;
}

export async function fetchUsers(): Promise<User[]> {
  return withRetry(async () => {
    const url = `${BASE_URL}/users`;
    const response = await fetchWithTimeout(url);
    return handleResponse<User[]>(response, url);
  });
}

export async function fetchUserById(id: number): Promise<User> {
  return withRetry(async () => {
    const url = `${BASE_URL}/users/${id}`;
    const response = await fetchWithTimeout(url);
    return handleResponse<User>(response, url);
  });
}

export async function createUser(name: string, email: string): Promise<User> {
  return withRetry(async () => {
    const url = `${BASE_URL}/users`;
    const response = await fetchWithTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
    return handleResponse<User>(response, url);
  });
}

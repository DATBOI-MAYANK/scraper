import axios from 'axios';

type RetryOptions = {
  attempts: number;
  baseDelayMs: number;
  operationName: string;
};

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/** Retries only failures that are normally recoverable without changing input. */
export function isTransientError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    if (error instanceof Error && (error.name === 'ValidationError' || error.name === 'CastError')) return false;
    // MongoDB duplicate-key conflicts cannot recover by retrying the same write.
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) return false;
    return true;
  }

  const status = error.response?.status;
  return status === undefined || status === 408 || status === 429 || status >= 500;
}

export async function withRetry<T>(operation: () => Promise<T>, options: RetryOptions): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === options.attempts || !isTransientError(error)) throw error;

      const delayMs = options.baseDelayMs * 2 ** (attempt - 1);
      console.warn(`${options.operationName} failed (attempt ${attempt}/${options.attempts}); retrying in ${delayMs}ms`, error);
      await wait(delayMs);
    }
  }

  throw lastError;
}

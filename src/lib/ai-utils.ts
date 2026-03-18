/**
 * @fileOverview Utilities for resilient AI operations.
 */

/**
 * Executes an async AI function with retry logic for rate limits.
 * @param fn The async function to execute.
 * @param retries Number of retries remaining.
 * @param delay Initial delay in ms between retries.
 */
export async function callAiWithRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 2000
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    // Check if it's a rate limit error (429) or resource exhausted
    const isRateLimit = 
      error.status === 429 || 
      error.message?.includes('429') || 
      error.message?.includes('Resource exhausted');

    if (isRateLimit && retries > 0) {
      console.warn(`AI Rate limited. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      // Recursive call with reduced retry count and increased delay (exponential backoff)
      return callAiWithRetry(fn, retries - 1, delay * 1.5);
    }
    throw error;
  }
}

// Simple session-based cache for AI results
const aiCache: Record<string, any> = {};

/**
 * Gets a cached AI result or executes and caches if missing.
 * @param key Unique key for the operation.
 * @param fn The async function to execute if not in cache.
 */
export async function withAiCache<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (aiCache[key]) {
    console.log(`[AI Cache] Hit for key: ${key}`);
    return aiCache[key];
  }
  const result = await fn();
  aiCache[key] = result;
  return result;
}

/**
 * Shared fetch helper with AbortController timeout.
 * Defaults to 45,000ms (45 seconds).
 * Invokes optional onSlow callback after 3,000ms (3 seconds) if request is still pending.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs: number = 45000,
  onSlow?: () => void
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  let slowTimer: any = null;
  if (onSlow) {
    slowTimer = setTimeout(() => {
      onSlow();
    }, 3000);
  }

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } catch (error: any) {
    if (error?.name === "AbortError" || error?.message?.includes("aborted")) {
      throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
    if (slowTimer) {
      clearTimeout(slowTimer);
    }
  }
}

/**
 * シャドウバン検出の共通ユーティリティ関数
 */

import { SHADOWBAN_CONFIG } from "./shadowban-config";

/**
 * スリープ関数
 */
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * リトライとバックオフ付きfetch関数
 */
export async function fetchWithBackoff(
  url: string,
  init: RequestInit = {},
  {
    retries = SHADOWBAN_CONFIG.FETCH_DEFAULTS.retries,
    baseMs = SHADOWBAN_CONFIG.FETCH_DEFAULTS.baseMs,
    maxMs = SHADOWBAN_CONFIG.FETCH_DEFAULTS.maxMs,
    perTryTimeoutMs = SHADOWBAN_CONFIG.FETCH_DEFAULTS.perTryTimeoutMs,
    totalDeadlineMs = SHADOWBAN_CONFIG.FETCH_DEFAULTS.totalDeadlineMs,
  } = {}
): Promise<Response> {
  const started = Date.now();
  for (let i = 0; i <= retries; i++) {
    const remaining = totalDeadlineMs - (Date.now() - started);
    if (remaining <= 0)
      throw new Error(`Deadline exceeded (${totalDeadlineMs}ms)`);

    const ac = new AbortController();
    const timer = setTimeout(
      () => ac.abort(),
      Math.min(perTryTimeoutMs, remaining)
    );
    try {
      const res = await fetch(url, { ...init, signal: ac.signal });
      clearTimeout(timer);
      if (res.ok) return res;
      if (res.status === 429 || res.status === 503) {
        const ra = res.headers.get("Retry-After");
        const wait = ra
          ? Math.min(+ra * 1000, maxMs)
          : Math.min(baseMs * 2 ** i, maxMs) * (0.5 + Math.random());
        if (i === retries)
          throw new Error(`HTTP ${res.status} after ${retries} retries`);
        await sleep(wait);
        continue;
      }
      if (res.status >= 500) {
        if (i === retries)
          throw new Error(`HTTP ${res.status} after ${retries} retries`);
        await sleep(Math.min(baseMs * 2 ** i, maxMs) * (0.5 + Math.random()));
        continue;
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      clearTimeout(timer);
      if (i === retries) throw err;
      await sleep(Math.min(baseMs * 2 ** i, maxMs) * (0.5 + Math.random()));
    }
  }
  throw new Error("unreachable");
}

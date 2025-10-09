/**
 * シャドウバン検出の共通設定
 */

export const SHADOWBAN_CONFIG = {
  // バッチ処理のサイズ
  BATCH_SIZE: 30,

  // リクエスト間隔（ミリ秒）
  REQUEST_INTERVAL_MS: 1200,

  // 最大試行回数
  MAX_ATTEMPTS: 6,

  // fetchWithBackoffのデフォルト設定
  FETCH_DEFAULTS: {
    retries: 3,
    baseMs: 300,
    maxMs: 10_000,
    perTryTimeoutMs: 10_000,
    totalDeadlineMs: 25_000,
  },
} as const;

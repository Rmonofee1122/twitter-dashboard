/**
 * シャドウバン検出の共通設定
 */

export const SHADOWBAN_CONFIG = {
  // バッチ処理のサイズ
  // SearchTimeline APIの制限: 50リクエスト/15分
  // 3分間のcronで安全に処理できる最大数: 180秒 / 20秒間隔 = 9件
  BATCH_SIZE: 15,

  // リクエスト間隔（ミリ秒）
  // SearchTimeline APIの制限を考慮: 15分(900秒) / 50リクエスト = 18秒
  // 安全マージンを含めて20秒に設定
  REQUEST_INTERVAL_MS: 10000,

  // 最大試行回数
  MAX_ATTEMPTS: 6,

  // fetchWithBackoffのデフォルト設定
  FETCH_DEFAULTS: {
    retries: 3,
    baseMs: 1000,
    maxMs: 10_000,
    perTryTimeoutMs: 10_000,
    totalDeadlineMs: 25_000,
  },
} as const;

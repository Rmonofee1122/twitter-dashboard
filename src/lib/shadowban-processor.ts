/**
 * シャドウバン検出ジョブの処理ロジック
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@trigger.dev/sdk";
import { SHADOWBAN_CONFIG } from "./shadowban-config";
import { fetchWithBackoff, sleep } from "./shadowban-utils";
import {
  upsertTwitterAccount,
  updateJobSuccess,
  updateJobFailed,
  updateJobOnError,
  upsertSuspendedTwitterAccount,
} from "./shadowban-db";

export interface ShadowbanJob {
  id: number;
  screen_name: string;
  attempt_count: number;
}

export interface ProcessJobsOptions {
  supabase: SupabaseClient;
  jobs: ShadowbanJob[];
  apiUrl: string;
  batchSize?: number;
  requestIntervalMs?: number;
}

/**
 * シャドウバンジョブを一括処理
 */
export async function processShadowbanJobs({
  supabase,
  jobs,
  apiUrl,
  requestIntervalMs = SHADOWBAN_CONFIG.REQUEST_INTERVAL_MS,
}: ProcessJobsOptions) {
  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];

    try {
      // シャドウバンAPIを呼び出し
      logger.log(
        `Processing job ${job.id} for screen_name: ${job.screen_name}`
      );
      const data = await fetchWithBackoff(
        `${apiUrl}?screen_name=${encodeURIComponent(job.screen_name)}`,
        { headers: { accept: "application/json" } },
        { totalDeadlineMs: 25_000 }
      ).then((r) => r.json());

      logger.log(`API response for job ${job.id}:`, { data });

      // エラーレスポンスの場合
      if (data.error) {
        logger.error(`Job ${job.id} has error in response:`, data.error);
        await updateJobOnError(
          supabase,
          job.id,
          job.attempt_count,
          String(data.error)
        );
        failed++;
        continue;
      }

      // 成功 → ジョブ状態＋結果保存
      await updateJobSuccess(supabase, job.id, data);

      // Twitter アカウント情報をupsert（suspend=trueの場合はsuspendedに更新）
      if (data.suspend === true) {
        await upsertSuspendedTwitterAccount(supabase, job.screen_name, data);
      } else {
        await upsertTwitterAccount(supabase, job.screen_name, data);
      }

      succeeded++;
      logger.log(`Job ${job.id} succeeded`);
    } catch (e: any) {
      // エラー時の処理（リトライまたは失敗）
      logger.error(`Job ${job.id} threw exception:`, {
        error: e?.message ?? e,
        stack: e?.stack,
      });
      const { newAttemptCount, status } = await updateJobOnError(
        supabase,
        job.id,
        job.attempt_count,
        String(e?.message ?? e)
      );
      failed++;
      logger.log(
        `Job ${job.id} failed (attempt ${newAttemptCount}), status set to: ${status}`
      );
    }

    // 最後のジョブ以外は待機時間を挿入
    if (i < jobs.length - 1) {
      await sleep(requestIntervalMs);
      logger.log(`Waiting ${requestIntervalMs}ms before next request...`, {
        currentJob: i + 1,
        totalJobs: jobs.length,
      });
    }
  }

  logger.log("batch done", { processed: jobs.length, succeeded, failed });

  return { succeeded, failed };
}

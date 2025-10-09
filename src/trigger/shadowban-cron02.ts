// /trigger/shadowban-cron.ts
import { schedules, logger } from "@trigger.dev/sdk";
import { createClient } from "@supabase/supabase-js";
import { SHADOWBAN_CONFIG } from "@/lib/shadowban-config";
import { processShadowbanJobs } from "@/lib/shadowban-processor";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 3分おき（東京タイムゾーン）で起動する「宣言的スケジュール」
// v3の scheduled task / timezone 指定の書式に準拠
export const shadowbanCron = schedules.task({
  id: "shadowban-every-3m-port-3001",
  cron: { pattern: "*/3 * * * *", timezone: "Asia/Tokyo" }, // ← JSTで3分おき
  // 同時二重起動を避けたいなら queue を1に
  queue: { concurrencyLimit: 1 },
  run: async (_payload) => {
    // 1) queued からジョブをロックして running に遷移
    const { data: jobs, error: lockErr } = await supabase.rpc(
      "lock_and_take_jobs",
      { p_limit: SHADOWBAN_CONFIG.BATCH_SIZE }
    );

    if (lockErr) {
      logger.error("lock_and_take_jobs error", { lockErr });
      return;
    }
    if (!jobs?.length) {
      logger.log("no jobs to process");
      return;
    }

    // 2) ジョブを処理
    await processShadowbanJobs({
      supabase,
      jobs,
      apiUrl: "http://localhost:3001/api/test",
      requestIntervalMs: SHADOWBAN_CONFIG.REQUEST_INTERVAL_MS,
    });
  },
});

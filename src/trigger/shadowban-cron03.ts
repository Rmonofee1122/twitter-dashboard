// /trigger/shadowban-cron.ts
import { schedules, logger } from "@trigger.dev/sdk";
import { createClient } from "@supabase/supabase-js";

// Trigger.dev 上のタスク実行環境に渡す環境変数（ダッシュボードの Env Vars に設定）
const SHADOWBAN_API_BASE = process.env.SHADOWBAN_API_BASE!; // 例: https://your-worker.example.com

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 5分おき（東京タイムゾーン）で起動する「宣言的スケジュール」
// v3の scheduled task / timezone 指定の書式に準拠
export const shadowbanCron = schedules.task({
  id: "shadowban-every-3m-v2",
  cron: { pattern: "*/3 * * * *", timezone: "Asia/Tokyo" }, // ← JSTで3分おき
  // 同時二重起動を避けたいなら queue を1に
  queue: { concurrencyLimit: 1 },
  run: async (_payload) => {
    const BATCH_SIZE = 30;

    // 1) queued から5件ロックして running に遷移（RPCは前回案のSQL）
    const { data: jobs, error: lockErr } = await supabase.rpc(
      "lock_and_take_jobs",
      { p_limit: BATCH_SIZE }
    );

    if (lockErr) {
      logger.error("lock_and_take_jobs error", { lockErr });
      return;
    }
    if (!jobs?.length) {
      logger.log("no jobs to process");
      return;
    }

    let succeeded = 0,
      failed = 0;

    // 2) 小並列で順次処理（外部APIはバックオフ付きで）
    for (const job of jobs) {
      try {
        const data = await fetchWithBackoff(
          `https://twitter-shadowban-v2.vercel.app/api/test?screen_name=${encodeURIComponent(
            job.screen_name
          )}`,
          { headers: { accept: "application/json" } },
          { totalDeadlineMs: 25_000 }
        ).then((r) => r.json());

        // 成功 → ジョブ状態＋結果保存
        await supabase
          .from("shadowban_jobs")
          .update({ status: "succeeded", result: data, error: null })
          .eq("id", job.id);

        // ついでに twitter_account_v1 へ upsert
        await upsertTwitterAccount(supabase, job.screen_name, data);

        succeeded++;
      } catch (e: any) {
        const max = 5;
        const next = (job.attempt_count ?? 0) + 1 >= max ? "failed" : "queued";
        await supabase
          .from("shadowban_jobs")
          .update({
            status: next,
            attempt_count: (job.attempt_count ?? 0) + 1,
            error: String(e?.message ?? e),
          })
          .eq("id", job.id);
        failed++;
      }
    }

    logger.log("batch done", { processed: jobs.length, succeeded, failed });
  },
});

// ---- ユーティリティ ----
async function fetchWithBackoff(
  url: string,
  init: RequestInit = {},
  {
    retries = 5,
    baseMs = 300,
    maxMs = 10_000,
    perTryTimeoutMs = 10_000,
    totalDeadlineMs = 25_000,
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
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function upsertTwitterAccount(
  supabase: any,
  screen_name: string,
  data: any
) {
  const d = {
    twitter_id: "@" + (screen_name ?? ""),
    name: data?.user?.legacy?.name ?? "",
    screen_name: data?.user?.legacy?.screen_name ?? screen_name,
    status: String(data?.user?.reason ?? "active").toLowerCase(),
    description_text: data?.user?.legacy?.description ?? null,
    profile_image_url_https:
      data?.user?.legacy?.profile_image_url_https ?? null,
    profile_banner_url: data?.user?.legacy?.profile_banner_url ?? null,
    follower_count: data?.user?.legacy?.followers_count ?? 0,
    following_count: data?.user?.legacy?.friends_count ?? 0,
    posts_count: data?.user.legacy?.statuses_count ?? 0,
    media_count: data?.user?.legacy?.media_count ?? 0,
    favourites_count: data?.user?.legacy?.favourites_count ?? 0,
    not_found: !!data?.not_found,
    suspend: !!data?.suspend,
    protect: !!data?.protected,
    no_tweet: !!data?.no_tweet,
    search_ban: !!data?.search_ban,
    search_suggestion_ban: !!data?.search_suggestion_ban,
    no_reply: !!data?.no_reply,
    ghost_ban: !!data?.ghost_ban,
    reply_deboosting: !!data?.reply_deboosting,
  };
  if (d.not_found === true) {
    d.status = "not_found";
  }
  await supabase
    .from("twitter_account_v1")
    .upsert(d, { onConflict: "twitter_id" });
}

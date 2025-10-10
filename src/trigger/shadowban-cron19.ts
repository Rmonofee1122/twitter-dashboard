// /trigger/shadowban-cron.ts
import { schedules, logger } from "@trigger.dev/sdk";
import { createClient } from "@supabase/supabase-js";

// Trigger.dev 上のタスク実行環境に渡す環境変数（ダッシュボードの Env Vars に設定）
const API_BASE_URL =
  process.env.API_BASE_URL ||
  process.env.SHADOWBAN_API_BASE ||
  "https://your-app.vercel.app"; // 本番環境のURL

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 3分おき（東京タイムゾーン）で起動する「宣言的スケジュール」
// v3の scheduled task / timezone 指定の書式に準拠
export const shadowbanCron = schedules.task({
  id: "other-shadowban-every-3m-port-3020",
  cron: { pattern: "*/3 * * * *", timezone: "Asia/Tokyo" }, // ← JSTで3分おき
  // 同時二重起動を避けたいなら queue を1に
  queue: { concurrencyLimit: 1 },
  run: async (_payload) => {
    const BATCH_SIZE = 30;

    // 1) queued から30件ロックして running に遷移（RPCは前回案のSQL）
    const { data: jobs, error: lockErr } = await supabase.rpc(
      "lock_and_take_other_jobs",
      { p_limit: BATCH_SIZE }
    );

    if (lockErr) {
      logger.error("lock_and_take_other_jobs error", { lockErr });
      return;
    }
    if (!jobs?.length) {
      logger.log("no jobs to process");
      return;
    }

    let succeeded = 0,
      failed = 0;

    // 2) 小並列で順次処理（外部APIはバックオフ付きで）
    // バーストエラーを防ぐため、リクエスト間に待機時間を設定
    const REQUEST_INTERVAL_MS = 600; // 600ms間隔（安全マージン付き）

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      try {
        // 直接外部shadowban APIを呼び出し（自分のAPIを経由しない）
        const data = await fetchWithBackoff(
          `http://localhost:3020/api/test?screen_name=${encodeURIComponent(
            job.screen_name
          )}`,
          { headers: { accept: "application/json" } },
          { totalDeadlineMs: 25_000 }
        ).then((r) => r.json());

        // 成功 → ジョブ状態＋結果保存
        await supabase
          .from("other_shadowban_jobs")
          .update({ status: "succeeded", result: data, error: null })
          .eq("id", job.id);

        // 失敗 → ジョブ状態＋結果保存
        if (data.error) {
          await supabase
            .from("other_shadowban_jobs")
            .update({ status: "failed", error: String(data.error) })
            .eq("id", job.id);
          return;
        }

        // ついでに other_twitter_account へ upsert
        await upsertTwitterAccount(supabase, job.screen_name, data);

        succeeded++;
      } catch (e: any) {
        const max = 5;
        const next = (job.attempt_count ?? 0) + 1 >= max ? "failed" : "queued";
        await supabase
          .from("other_shadowban_jobs")
          .update({
            status: next,
            attempt_count: (job.attempt_count ?? 0) + 1,
            error: String(e?.message ?? e),
          })
          .eq("id", job.id);
        failed++;
      }

      // 最後のジョブ以外は待機時間を挿入
      if (i < jobs.length - 1) {
        await sleep(REQUEST_INTERVAL_MS);
        logger.log(`Waiting ${REQUEST_INTERVAL_MS}ms before next request...`, {
          currentJob: i + 1,
          totalJobs: jobs.length,
        });
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
    // リトライ回数
    retries = 3,
    // 初期遅延
    baseMs = 300,
    // 最大遅延
    maxMs = 10_000,
    // 1回あたりのタイムアウト
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
    rest_id: data?.user?.rest_id ?? null,
    name: data?.user?.legacy?.name ?? "",
    screen_name: data?.user?.legacy?.screen_name ?? screen_name,
    status: String(data?.user?.reason ?? "active").toLowerCase(),
    description_text: data?.user?.legacy?.description ?? null,
    profile_image_url_https:
      data?.user?.legacy?.profile_image_url_https ?? null,
    profile_banner_url: data?.user?.legacy?.profile_banner_url ?? null,
    follower_count: data?.user?.legacy?.followers_count ?? 0,
    following_count: data?.user?.legacy?.friends_count ?? 0,
    posts_count: data?.user?.legacy?.statuses_count ?? 0,
    media_count: data?.user?.legacy?.media_count ?? 0,
    favourites_count: data?.user?.legacy?.favourites_count ?? 0,
    not_found: !!data?.not_found,
    suspend: !!data?.suspend,
    protect: !!data?.protect,
    no_tweet: !!data?.no_tweet,
    search_ban: !!data?.search_ban,
    search_suggestion_ban: !!data?.search_suggestion_ban,
    no_reply: !!data?.no_reply,
    ghost_ban: !!data?.ghost_ban,
    reply_deboosting: !!data?.reply_deboosting,
    account_created_at: data?.user?.legacy?.created_at ?? null,
    updated_at: new Date().toISOString(),
  };
  if (d.not_found === true) {
    d.status = "not_found";
  }
  if (d.search_ban === true) {
    d.status = "search_ban";
  }
  if (d.search_suggestion_ban === true) {
    d.status = "search_suggestion_ban";
  }
  if (d.ghost_ban === true) {
    d.status = "ghost_ban";
  }
  if (data.user?.legacy?.profile_interstitial_type == "fake_account") {
    d.status = "temp_locked";
  }
  if (data.user == null) {
    return;
  }

  // other_twitter_accountのstatusをsuspendedに更新, suspendをtrueに更新, ほかはそのまま
  if (d.suspend === true) {
    d.status = "suspended";
    d.suspend = true;

    // 既存レコードを取得してログに必要なフィールドを取得
    const { data: existingAccount } = await supabase
      .from("other_twitter_account")
      .select("*")
      .eq("twitter_id", d.twitter_id)
      .single();

    const { error: suspendError } = await supabase
      .from("other_twitter_account")
      .update({ status: "suspended", suspend: true })
      .eq("twitter_id", d.twitter_id); // ← 一発
    if (suspendError) {
      console.error("suspend error:", suspendError);
      console.error(
        "accountData that caused error:",
        JSON.stringify(d, null, 2)
      );
    }

    // shadowban_other_account_logテーブルへ履歴を保存
    // 既存アカウントデータがあればそこから、なければデフォルト値を使用
    const logData = {
      twitter_id: d.twitter_id,
      name: existingAccount?.name || "",
      screen_name: existingAccount?.screen_name || d.screen_name,
      status: d.status,
      description_text: existingAccount?.description_text || null,
      profile_image_url_https: existingAccount?.profile_image_url_https || null,
      profile_banner_url: existingAccount?.profile_banner_url || null,
      follower_count: existingAccount?.follower_count || 0,
      following_count: existingAccount?.following_count || 0,
      media_count: existingAccount?.media_count || 0,
      not_found: false,
      suspend: d.suspend,
      protect: existingAccount?.protect || false,
      no_tweet: existingAccount?.no_tweet || false,
      search_ban: existingAccount?.search_ban || false,
      search_suggestion_ban: existingAccount?.search_suggestion_ban || false,
      no_reply: existingAccount?.no_reply || false,
      ghost_ban: existingAccount?.ghost_ban || false,
      reply_deboosting: existingAccount?.reply_deboosting || false,
      created_at: d.updated_at,
      updated_at: d.updated_at,
      favourites_count: existingAccount?.favourites_count || 0,
      posts_count: existingAccount?.posts_count || 0,
    };

    const { error: logError } = await supabase
      .from("shadowban_other_account_log")
      .insert(logData);
    if (logError) {
      console.error("log insert error:", logError);
      console.error(
        "logData that caused error:",
        JSON.stringify(logData, null, 2)
      );
    }
    return;
  } else {
    // other_twitter_accountテーブルへupsert
    const { data: upsertedAccount, error: upsertError } = await supabase
      .from("other_twitter_account")
      .upsert(d, { onConflict: "twitter_id" })
      .select("id")
      .single();

    if (upsertError) {
      console.error("upsert error:", upsertError);
      console.error(
        "accountData that caused error:",
        JSON.stringify(d, null, 2)
      );
      throw new Error(`Database upsert failed: ${upsertError.message}`);
    }

    // shadowban_other_account_logテーブルへ履歴を保存
    const logData = {
      twitter_id: d.twitter_id,
      name: d.name,
      screen_name: d.screen_name,
      status: d.status,
      description_text: d.description_text,
      profile_image_url_https: d.profile_image_url_https,
      profile_banner_url: d.profile_banner_url,
      follower_count: d.follower_count,
      following_count: d.following_count,
      media_count: d.media_count,
      not_found: d.not_found,
      suspend: d.suspend,
      protect: d.protect,
      no_tweet: d.no_tweet,
      search_ban: d.search_ban,
      search_suggestion_ban: d.search_suggestion_ban,
      no_reply: d.no_reply,
      ghost_ban: d.ghost_ban,
      reply_deboosting: d.reply_deboosting,
      created_at: d.updated_at,
      updated_at: d.updated_at,
      favourites_count: d.favourites_count,
      posts_count: d.posts_count,
    };

    const { error: logError } = await supabase
      .from("shadowban_other_account_log")
      .insert(logData);

    if (logError) {
      console.error("log insert error:", logError);
      console.error(
        "logData that caused error:",
        JSON.stringify(logData, null, 2)
      );
      // ログ保存エラーは致命的ではないため、エラーをスローしない
    }
  }
}

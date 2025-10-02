// // /trigger/shadowban-cron.ts
// import { schedules, logger } from "@trigger.dev/sdk";
// import { createClient } from "@supabase/supabase-js";

// // Trigger.dev 上のタスク実行環境に渡す環境変数（ダッシュボードの Env Vars に設定）
// const API_BASE_URL =
//   process.env.API_BASE_URL ||
//   process.env.SHADOWBAN_API_BASE ||
//   "https://your-app.vercel.app"; // 本番環境のURL

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!
// );

// // 3分おき（東京タイムゾーン）で起動する「宣言的スケジュール」
// // v3の scheduled task / timezone 指定の書式に準拠
// export const shadowbanCron = schedules.task({
//   id: "get-top-tweets-every-3m-port-3016",
//   cron: { pattern: "*/3 * * * *", timezone: "Asia/Tokyo" }, // ← JSTで3分おき
//   // 同時二重起動を避けたいなら queue を1に
//   queue: { concurrencyLimit: 1 },
//   run: async (_payload) => {
//     const BATCH_SIZE = 10;

//     // 1) queued から10件ロックして running に遷移（RPCは前回案のSQL）
//     const { data: jobs, error: lockErr } = await supabase.rpc(
//       "lock_and_take_tweet_get_jobs",
//       { p_limit: BATCH_SIZE }
//     );

//     if (lockErr) {
//       logger.error("lock_and_take_tweet_get_jobs error", { lockErr });
//       return;
//     }
//     if (!jobs?.length) {
//       logger.log("no jobs to process");
//       return;
//     }

//     let succeeded = 0,
//       failed = 0;

//     // 2) 小並列で順次処理（外部APIはバックオフ付きで）
//     for (const job of jobs) {
//       // twitter_idの値から@を削除してscreen_nameを取得
//       let screen_name = job.twitter_id.replace("@", "");
//       try {
//         // 直接外部shadowban APIを呼び出し（自分のAPIを経由しない）
//         const data = await fetchWithBackoff(
//           `http://localhost:3016/api/top-tweets?screen_name=${encodeURIComponent(
//             screen_name
//           )}&count=20`,
//           { headers: { accept: "application/json" } },
//           { totalDeadlineMs: 25_000 }
//         ).then((r) => r.json());

//         // 成功 → ジョブ状態＋結果保存
//         await supabase
//           .from("tweet_get_jobs")
//           .update({ status: "succeeded", result: data, error: null })
//           .eq("id", job.id);

//         // ついでに twitter_account_v1 へ upsert
//         await upsertTweetInfo(supabase, screen_name, data);

//         succeeded++;
//       } catch (e: any) {
//         const max = 5;
//         const next = (job.attempt_count ?? 0) + 1 >= max ? "failed" : "queued";
//         await supabase
//           .from("tweet_get_jobs")
//           .update({
//             status: next,
//             attempt_count: (job.attempt_count ?? 0) + 1,
//             error: String(e?.message ?? e),
//           })
//           .eq("id", job.id);
//         failed++;
//       }
//     }

//     logger.log("batch done", { processed: jobs.length, succeeded, failed });
//   },
// });

// // ---- ユーティリティ ----
// async function fetchWithBackoff(
//   url: string,
//   init: RequestInit = {},
//   {
//     // リトライ回数
//     retries = 3,
//     // 初期遅延
//     baseMs = 300,
//     // 最大遅延
//     maxMs = 10_000,
//     // 1回あたりのタイムアウト
//     perTryTimeoutMs = 10_000,
//     totalDeadlineMs = 25_000,
//   } = {}
// ): Promise<Response> {
//   const started = Date.now();
//   for (let i = 0; i <= retries; i++) {
//     const remaining = totalDeadlineMs - (Date.now() - started);
//     if (remaining <= 0)
//       throw new Error(`Deadline exceeded (${totalDeadlineMs}ms)`);

//     const ac = new AbortController();
//     const timer = setTimeout(
//       () => ac.abort(),
//       Math.min(perTryTimeoutMs, remaining)
//     );
//     try {
//       const res = await fetch(url, { ...init, signal: ac.signal });
//       clearTimeout(timer);
//       if (res.ok) return res;
//       if (res.status === 429 || res.status === 503) {
//         const ra = res.headers.get("Retry-After");
//         const wait = ra
//           ? Math.min(+ra * 1000, maxMs)
//           : Math.min(baseMs * 2 ** i, maxMs) * (0.5 + Math.random());
//         if (i === retries)
//           throw new Error(`HTTP ${res.status} after ${retries} retries`);
//         await sleep(wait);
//         continue;
//       }
//       if (res.status >= 500) {
//         if (i === retries)
//           throw new Error(`HTTP ${res.status} after ${retries} retries`);
//         await sleep(Math.min(baseMs * 2 ** i, maxMs) * (0.5 + Math.random()));
//         continue;
//       }
//       throw new Error(`HTTP ${res.status}`);
//     } catch (err) {
//       clearTimeout(timer);
//       if (i === retries) throw err;
//       await sleep(Math.min(baseMs * 2 ** i, maxMs) * (0.5 + Math.random()));
//     }
//   }
//   throw new Error("unreachable");
// }
// const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// async function upsertTweetInfo(supabase: any, screen_name: string, data: any) {
//   // data内のtweetsの数だけ繰り返し
//   for (const tweet of data?.tweets) {
//     const d = {
//       twitter_id: "@" + data?.user?.screen_name,
//       name: data?.user?.name ?? "",
//       screen_name: data?.user?.screen_name ?? screen_name,
//       tweet_id: tweet?.id ?? null,
//       tweet_text: tweet?.text ?? null,
//       tweet_created_at: tweet?.created_at ?? null,
//       favorite_count: tweet?.favorite_count ?? 0,
//       retweet_count: tweet?.retweet_count ?? 0,
//       reply_count: tweet?.reply_count ?? 0,
//       quote_count: tweet?.quote_count ?? 0,
//       view_count: tweet?.views ?? 0,
//       is_retweet: tweet?.is_retweet ?? false,
//       is_quote: tweet?.is_quote ?? false,
//       media_type: tweet?.media_type ?? null,
//       media_url: tweet?.media_url ?? null,
//       tweet_link: `https://x.com/${data?.user?.screen_name}/status/${tweet?.id}`,
//       created_at:
//         data?.user?.legacy?.created_at ??
//         new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString(),
//       updated_at: new Date(
//         new Date().getTime() + 9 * 60 * 60 * 1000
//       ).toISOString(),
//     };

//     if (d.tweet_id === null) {
//       return;
//     }

//     const { error } = await supabase
//       .from("twitter_tweet_log")
//       .upsert(d, { onConflict: "tweet_id" }); // ← 一発

//     if (error) {
//       console.error("upsert error:", error);
//       console.error(
//         "accountData that caused error:",
//         JSON.stringify(d, null, 2)
//       );
//       throw new Error(`Database upsert failed: ${error.message}`);
//     }
//   }
// }

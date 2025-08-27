export const runtime = "nodejs"; // ← Edge ではなく Node。DB接続やfetch安定用
export const dynamic = "force-dynamic"; // キャッシュ防止（保険）

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// server-only な鍵を使うこと（公開キーはNG）
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 取り出しと状態遷移を原子的に行うRPC（下のSQL参照）
async function takeJobs(limit = 5) {
  const { data, error } = await supabase.rpc("lock_and_take_jobs", {
    p_limit: limit,
  });
  if (error) throw error;
  return data as Array<{
    id: string;
    screen_name: string;
    attempt_count: number;
  }>;
}

// 必要ならここを先にあなたの fetchWithBackoff 実装で置き換え
async function fetchWithBackoff(url: string, init: RequestInit = {}) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 25_000);
  try {
    const res = await fetch(url, { ...init, signal: ac.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(t);
  }
}

// 結果の twitter_account_v1 への upsert
async function upsertTwitterAccount(screen_name: string, data: any) {
  const accountData = {
    twitter_id: "@" + (screen_name ?? ""),
    name: data.user?.legacy?.name ?? "",
    screen_name: data.user?.legacy?.screen_name ?? screen_name,
    status: data.user?.reason ?? "active",
    description_text: data.user?.legacy?.description ?? null,
    profile_image_url_https: data.user?.legacy?.profile_image_url_https ?? null,
    profile_banner_url: data.user?.legacy?.profile_banner_url ?? null,
    follower_count: data.user?.legacy?.followers_count ?? 0,
    following_count: data.user?.legacy?.friends_count ?? 0,
    media_count: data.user?.legacy?.media_count ?? 0,
    favourites_count: data.user?.legacy?.favourites_count ?? 0,
    not_found: !!data.no_profile,
    suspend: !!data.suspend,
    protect: !!data.protected,
    no_tweet: !!data.no_tweet,
    search_ban: !!data.search_ban,
    search_suggestion_ban: !!data.search_suggestion_ban,
    no_reply: !!data.no_reply,
    ghost_ban: !!data.ghost_ban,
    reply_deboosting: !!data.reply_deboosting,
  };
  await supabase
    .from("twitter_account_v1")
    .upsert(accountData, { onConflict: "screen_name" });
}

export async function GET(req: Request) {
  // Vercel Cron からの呼び出しか簡易チェック（任意）
  const fromCron = (req.headers.get("x-vercel-cron") ?? "") !== "";
  if (!fromCron && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const BASE = process.env.SHADOWBAN_API_BASE ?? "http://localhost:3001";
  const started = Date.now();
  let processed = 0,
    succeeded = 0,
    failed = 0;

  try {
    // 1回の起動でバッチを何回か回してもOK（時間制限に注意）
    for (let round = 0; round < 3; round++) {
      // 1回で最大5件だけロック取得（同時実行はVercel側でスケールするため控えめに）
      const jobs = await takeJobs(5);
      if (!jobs?.length) break;

      // 並列を抑えて順次 or 小並列で実行（3並列などにしたければ Promise.allSettled + セマフォ）
      for (const job of jobs) {
        processed++;
        try {
          const data = await fetchWithBackoff(
            `${BASE}/api/test?screen_name=${encodeURIComponent(
              job.screen_name
            )}`,
            { headers: { accept: "application/json" } }
          );

          await supabase
            .from("shadowban_jobs")
            .update({ status: "succeeded", result: data, error: null })
            .eq("id", job.id);

          await upsertTwitterAccount(job.screen_name, data);
          succeeded++;
        } catch (e: any) {
          const max = 5;
          const nextStatus = job.attempt_count + 1 >= max ? "failed" : "queued";
          await supabase
            .from("shadowban_jobs")
            .update({
              status: nextStatus,
              attempt_count: job.attempt_count + 1,
              error: String(e?.message ?? e),
            })
            .eq("id", job.id);
          failed++;
        }
      }

      // 安全のため、関数全体の実行時間を制限（Vercelの実行上限に合わせる）
      if (Date.now() - started > 45_000) break; // 例：45秒で打ち切り
    }

    return NextResponse.json({ ok: true, processed, succeeded, failed });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}

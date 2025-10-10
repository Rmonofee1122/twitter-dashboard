import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type BackoffOpts = {
  retries?: number;
  baseMs?: number;
  maxMs?: number;
  perTryTimeoutMs?: number; // 1回あたりの上限
  totalDeadlineMs?: number; // 全体の上限
  tag?: string; // ログ識別子
};

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseRetryAfter(ra: string | null, fallbackMs: number, maxMs: number) {
  if (!ra) return Math.min(fallbackMs, maxMs);
  const s = Number(ra);
  if (!Number.isNaN(s)) return Math.min(s * 1000, maxMs);
  const t = Date.parse(ra);
  if (!Number.isNaN(t)) {
    const diff = t - Date.now();
    return Math.min(Math.max(diff, 0), maxMs);
  }
  return Math.min(fallbackMs, maxMs);
}

async function saveShadowbanDataToSupabase(
  screenName: string,
  shadowbanData: any
) {
  try {
    if (!shadowbanData) {
      console.log("No shadowbanData data found in shadowban response");
      return;
    }

    // データを整形
    const accountData = {
      twitter_id: "@" + screenName || "",
      name: shadowbanData.user?.legacy?.name || "",
      screen_name: shadowbanData.user?.legacy?.screen_name || "",
      status: String(shadowbanData.user?.reason ?? "active").toLowerCase(),
      description_text: shadowbanData.user?.legacy?.description || null,
      profile_image_url_https:
        shadowbanData.user?.legacy?.profile_image_url_https || null,
      profile_banner_url:
        shadowbanData.user?.legacy?.profile_banner_url || null,
      follower_count: shadowbanData.user?.legacy?.followers_count || 0,
      following_count: shadowbanData.user?.legacy?.friends_count || 0,
      posts_count: shadowbanData.user?.legacy?.statuses_count || 0,
      media_count: shadowbanData.user?.legacy?.media_count || 0,
      favourites_count: shadowbanData.user?.legacy?.favourites_count || 0,
      not_found: shadowbanData.not_found === true || false,
      suspend: shadowbanData.suspend === true || false,
      protect: shadowbanData.protected === true || false,
      no_tweet: shadowbanData.no_tweet === true || false,
      search_ban: shadowbanData.search_ban === true || false,
      search_suggestion_ban:
        shadowbanData.search_suggestion_ban === true || false,
      no_reply: shadowbanData.no_reply === true || false,
      ghost_ban: shadowbanData.ghost_ban === true || false,
      reply_deboosting: shadowbanData.reply_deboosting === true || false,
      created_at:
        shadowbanData.user?.legacy?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (accountData.not_found === true) {
      accountData.status = "not_found";
    }
    if (accountData.search_ban === true) {
      accountData.status = "search_ban";
    }
    if (accountData.search_suggestion_ban === true) {
      accountData.status = "search_suggestion_ban";
    }
    if (accountData.ghost_ban === true) {
      accountData.status = "ghost_ban";
    }
    if (
      shadowbanData.user?.legacy?.profile_interstitial_type == "fake_account"
    ) {
      accountData.status = "temp_locked";
    }

    // screen_nameで既存レコードを検索・追加または更新
    const { error } = await supabase
      .from("twitter_account_v1")
      .upsert(accountData, { onConflict: "twitter_id" }); // ← 一発

    if (error) {
      console.error("upsert error:", error);
      console.error(
        "accountData that caused error:",
        JSON.stringify(accountData, null, 2)
      );
      throw new Error(`Database upsert failed: ${error.message}`);
    }
  } catch (error) {
    console.error("Error saving shadowban data to Supabase:", error);
  }
}

// 使い回せる fetchWithBackoff
export async function fetchWithBackoff(
  url: string,
  init: RequestInit = {},
  {
    retries = 5,
    baseMs = 300,
    maxMs = 10_000,
    perTryTimeoutMs = 20_000,
    totalDeadlineMs = 30_000,
    tag = "fetch",
  }: BackoffOpts = {}
): Promise<Response> {
  const started = Date.now();
  let lastStatus: number | undefined;
  let lastBodyPreview: string | undefined;
  let lastHeaders: Record<string, string | null> = {};
  let lastError: unknown;

  for (let i = 0; i <= retries; i++) {
    const elapsed = Date.now() - started;
    const remaining = Math.max(totalDeadlineMs - elapsed, 0);
    if (remaining <= 0) {
      const msg = `Deadline exceeded ${totalDeadlineMs}ms after ${i} attempts (lastStatus=${lastStatus})`;
      console.error(`${tag}: ${msg}`, { url, lastBodyPreview, lastHeaders });
      throw new Error(msg);
    }
    const thisTryTimeout = Math.min(perTryTimeoutMs, remaining);

    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), thisTryTimeout);

    try {
      const attemptLabel = `${i + 1}/${retries + 1}`;
      const res = await fetch(url, { ...init, signal: ac.signal });

      if (res.ok) {
        if (i > 0) {
          console.warn(`${tag}: succeeded after retries`, {
            url,
            attempt: attemptLabel,
          });
        }
        return res;
      }

      lastStatus = res.status;
      const clone = res.clone();
      const ct = res.headers.get("content-type") || "";
      lastHeaders = {
        "content-type": ct,
        "retry-after": res.headers.get("retry-after"),
        "x-request-id": res.headers.get("x-request-id"),
        "cf-ray": res.headers.get("cf-ray"),
      };
      // 本文プレビュー（最大800文字）
      lastBodyPreview = (await clone.text()).slice(0, 800);

      // ログ出力
      console.error(
        `${tag}: attempt ${attemptLabel} HTTP ${res.status} ${res.statusText}`,
        { url, headers: lastHeaders, bodyPreview: lastBodyPreview }
      );

      // 4xx（429以外）は再試行しない
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      // リトライ判定 & 待機
      if (i === retries) {
        throw new Error(`HTTP ${res.status} after ${retries} retries`);
      }
      const baseWait = Math.min(baseMs * 2 ** i, maxMs);
      const wait =
        res.status === 429 || res.status === 503
          ? parseRetryAfter(res.headers.get("retry-after"), baseWait, maxMs)
          : baseWait;
      // ジッタ
      const jittered = Math.min(wait * (0.5 + Math.random()), maxMs);
      await sleep(jittered);
      continue;
    } catch (err: any) {
      lastError = err;
      const isAbort = err?.name === "AbortError";
      const attemptLabel = `${i + 1}/${retries + 1}`;
      console.error(`${tag}: attempt ${attemptLabel} threw`, {
        url,
        isAbort,
        message: String(err?.message ?? err),
        stack: err?.stack,
      });

      if (i === retries) {
        throw new Error(
          `${
            isAbort ? "Abort" : "Error"
          } after ${retries} retries (lastStatus=${lastStatus}): ${String(
            err?.message ?? err
          )}`
        );
      }

      const wait = Math.min(baseMs * 2 ** i, maxMs) * (0.5 + Math.random());
      await sleep(wait);
      continue;
    } finally {
      clearTimeout(t);
    }
  }

  // 到達不可
  const msg = `Unreachable after ${retries + 1} attempts`;
  console.error(`${tag}: ${msg}`, {
    url,
    lastStatus,
    lastBodyPreview,
    lastError,
  });
  throw new Error(msg);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const screenName = searchParams.get("screen_name");

  if (!screenName) {
    return NextResponse.json(
      { error: "screen_name parameter is required" },
      { status: 400 }
    );
  }

  const urls = [
    `https://x-eight-phi.vercel.app/api/test?screen_name=${encodeURIComponent(
      screenName
    )}`,
    `https://shadowban.lami.zip/api/test?screen_name=${encodeURIComponent(
      screenName
    )}`,
  ];

  try {
    let response;
    let lastError;

    // 最初のURLを試行
    try {
      response = await fetchWithBackoff(
        urls[0],
        { headers: { accept: "application/json" } },
        {
          retries: 5,
          baseMs: 300,
          maxMs: 10_000,
          perTryTimeoutMs: 10_000,
          totalDeadlineMs: 20_000,
        }
      );
    } catch (error: any) {
      lastError = error;
      console.log(`Primary URL failed: ${error.message}, trying fallback...`);

      // エラーメッセージから503や429をチェック
      if (error.message.includes("503") || error.message.includes("429")) {
        try {
          response = await fetchWithBackoff(
            urls[1],
            { headers: { accept: "application/json" } },
            {
              retries: 3,
              baseMs: 300,
              maxMs: 5_000,
              perTryTimeoutMs: 8_000,
              totalDeadlineMs: 15_000,
            }
          );
        } catch (fallbackError) {
          console.error("Fallback URL also failed:", fallbackError);
          throw lastError; // 元のエラーを投げる
        }
      } else {
        throw error;
      }
    }

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    // デバッグ: APIレスポンスの構造を確認
    console.log(
      "Shadowban API response structure:",
      JSON.stringify(data, null, 2)
    );

    // Supabaseにデータを保存
    try {
      await saveShadowbanDataToSupabase(screenName, data);
    } catch (saveError) {
      console.error("Failed to save shadowban data to database:", saveError);
      // データベース保存エラーがあってもAPIレスポンスは返す
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Shadowban API error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch shadowban data: ${errorMessage}` },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
    };

    if (accountData.not_found === true) {
      accountData.status = "not_found";
      accountData.name = "test_not_found";
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
async function fetchWithBackoff(
  url: string,
  init: RequestInit = {},
  {
    retries = 5,
    baseMs = 300,
    maxMs = 10_000,
    perTryTimeoutMs = 20_000, // 1回あたりの上限
    totalDeadlineMs = 30_000, // 全体の上限（超重要）
  } = {}
) {
  const started = Date.now();

  for (let i = 0; i <= retries; i++) {
    // 残り時間で per-try のタイムアウトを決定
    const elapsed = Date.now() - started;
    const remaining = Math.max(totalDeadlineMs - elapsed, 0);
    if (remaining <= 0)
      throw new Error(`Deadline exceeded (${totalDeadlineMs}ms)`);

    const thisTryTimeout = Math.min(perTryTimeoutMs, remaining);

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), thisTryTimeout);

    try {
      const res = await fetch(url, { ...init, signal: ac.signal });

      if (res.ok) return res;

      // 429/503 は待って再試行
      if (res.status === 429 || res.status === 503) {
        const ra = res.headers.get("Retry-After");
        const wait = ra
          ? Math.min(+ra * 1000, maxMs)
          : Math.min(baseMs * 2 ** i, maxMs) * (0.5 + Math.random());
        if (i === retries)
          throw new Error(`HTTP ${res.status} after ${retries} retries`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }

      // 4xx（429以外）は再試行せず失敗
      if (res.status >= 400 && res.status < 500) {
        throw new Error(`HTTP ${res.status}`);
      }

      // 5xx（503以外）は指数バックオフでリトライ
      if (res.status >= 500) {
        if (i === retries)
          throw new Error(`HTTP ${res.status} after ${retries} retries`);
        const wait = Math.min(baseMs * 2 ** i, maxMs) * (0.5 + Math.random());
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }

      // 想定外は即エラー
      throw new Error(`HTTP ${res.status}`);
    } catch (err: any) {
      // タイムアウト/Abort はネットワーク相当としてリトライ対象
      const isAbort = err?.name === "AbortError";
      if (i === retries) {
        throw new Error(
          isAbort ? `Abort after ${retries} retries` : String(err)
        );
      }
      const wait = Math.min(baseMs * 2 ** i, maxMs) * (0.5 + Math.random());
      await new Promise((r) => setTimeout(r, wait));
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error("Unreachable");
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
    `https://twitter-shadowban.vercel.app/api/test?screen_name=${encodeURIComponent(
      screenName
    )}`,
    `https://twitter-shadowban-v2.vercel.app/api/test?screen_name=${encodeURIComponent(
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

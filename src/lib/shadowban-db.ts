/**
 * シャドウバン検出のデータベース処理
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { SHADOWBAN_CONFIG } from "./shadowban-config";

/**
 * Twitterアカウント情報をupsert
 */
export async function upsertTwitterAccount(
  supabase: SupabaseClient,
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
    rest_id: data?.user?.rest_id ?? "",
    created_at: data?.user?.legacy?.created_at ?? new Date().toISOString(),
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

  const { error } = await supabase
    .from("twitter_account_v1")
    .upsert(d, { onConflict: "twitter_id" });

  if (error) {
    console.error("upsert error:", error);
    console.error("accountData that caused error:", JSON.stringify(d, null, 2));
    throw new Error(`Database upsert failed: ${error.message}`);
  }
}

/**
 * ジョブステータスを成功に更新
 */
export async function updateJobSuccess(
  supabase: SupabaseClient,
  jobId: number,
  result: any
) {
  await supabase
    .from("shadowban_jobs")
    .update({ status: "succeeded", result, error: null })
    .eq("id", jobId);
}

/**
 * ジョブステータスを失敗に更新
 */
export async function updateJobFailed(
  supabase: SupabaseClient,
  jobId: number,
  error: string
) {
  await supabase
    .from("shadowban_jobs")
    .update({ status: "failed", error })
    .eq("id", jobId);
}

/**
 * ジョブステータスをエラー時に更新（リトライまたは失敗）
 */
export async function updateJobOnError(
  supabase: SupabaseClient,
  jobId: number,
  currentAttemptCount: number,
  error: string
) {
  const newAttemptCount = (currentAttemptCount ?? 0) + 1;
  const next =
    newAttemptCount >= SHADOWBAN_CONFIG.MAX_ATTEMPTS ? "failed" : "queued";

  await supabase
    .from("shadowban_jobs")
    .update({
      status: next,
      attempt_count: newAttemptCount,
      error,
    })
    .eq("id", jobId);

  return { newAttemptCount, status: next };
}

/**
 * シャドバン結果のsuspend=trueのTwitterアカウント情報をupsert
 */
export async function upsertSuspendedTwitterAccount(
  supabase: SupabaseClient,
  screen_name: string,
  data: any
) {
  /**
   * data.suspend=trueの場合のみ
   * data.status=suspended
   * data.suspend=true
   * data.updated_at=new Date().toISOString()
   * ほかはそのまま
   */
  const d = {
    twitter_id: "@" + (screen_name ?? ""),
    name: data?.user?.legacy?.name ?? "",
    screen_name: data?.user?.legacy?.screen_name ?? screen_name,
    status: "suspended",
    suspend: true,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("twitter_account_v1")
    .upsert(d, { onConflict: "twitter_id" });

  if (error) {
    console.error("upsert error:", error);
    console.error("accountData that caused error:", JSON.stringify(d, null, 2));
    throw new Error(`Database upsert failed: ${error.message}`);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
      name: shadowbanData.user.legacy?.name || "",
      screen_name: shadowbanData.user.legacy?.screen_name || "",
      status: shadowbanData.user.reason || "active",
      description_text: shadowbanData.user.legacy?.description || null,
      profile_image_url_https:
        shadowbanData.user.legacy?.profile_image_url_https || null,
      profile_banner_url: shadowbanData.user.legacy?.profile_banner_url || null,
      follower_count: shadowbanData.user.legacy?.followers_count || 0,
      following_count: shadowbanData.user.legacy?.friends_count || 0,
      media_count: shadowbanData.user.legacy?.media_count || 0,
      favourites_count: shadowbanData.user.legacy?.favourites_count || 0,
      not_found: shadowbanData.no_profile === true || false,
      suspend: shadowbanData.suspend === true || false,
      protect: shadowbanData.protected === true || false,
      no_tweet: shadowbanData.no_tweet === true || false,
      search_ban: shadowbanData.search_ban === true || false,
      search_suggestion_ban:
        shadowbanData.search_suggestion_ban === true || false,
      no_reply: shadowbanData.no_reply === true || false,
      ghost_ban: shadowbanData.ghost_ban === true || false,
      reply_deboosting: shadowbanData.reply_deboosting === true || false,
    };

    // screen_nameで既存レコードを検索
    const { data: existing, error: searchError } = await supabase
      .from("twitter_account_v1")
      .select("id")
      .eq("screen_name", accountData.screen_name)
      .single();

    if (searchError && searchError.code !== "PGRST116") {
      console.error("Error searching for existing record:", searchError);
      return;
    }

    if (existing) {
      // 既存レコードを更新
      const { error: updateError } = await supabase
        .from("twitter_account_v1")
        .update({
          ...accountData,
          updated_at:
            new Date()
              .toLocaleString("sv-SE", { timeZone: "Asia/Tokyo" })
              .replace(" ", "T") + "+09:00",
        })
        .eq("id", existing.id);

      if (updateError) {
        console.error("Error updating twitter_account_v1:", updateError);
      } else {
        console.log(
          "Updated existing twitter_account_v1 record for:",
          accountData.screen_name
        );
      }
    } else {
      // 新規レコードを挿入
      const { error: insertError } = await supabase
        .from("twitter_account_v1")
        .insert([accountData]);

      if (insertError) {
        console.error("Error inserting to twitter_account_v1:", insertError);
      } else {
        console.log(
          "Inserted new twitter_account_v1 record for:",
          accountData.screen_name
        );
      }
    }
  } catch (error) {
    console.error("Error saving shadowban data to Supabase:", error);
  }
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

  try {
    const response = await fetch(
      `https://shadowban.lami.zip/api/test?screen_name=${encodeURIComponent(
        screenName
      )}`,
      {
        method: "GET",
        headers: {
          "User-Agent": "TwitterDashboard/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    // Supabaseにデータを保存
    await saveShadowbanDataToSupabase(screenName, data);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Shadowban API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shadowban data" },
      { status: 500 }
    );
  }
}

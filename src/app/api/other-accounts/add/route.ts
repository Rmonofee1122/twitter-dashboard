import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { screen_name } = await request.json();

    if (!screen_name) {
      return NextResponse.json(
        { error: "スクリーン名が指定されていません" },
        { status: 400 }
      );
    }

    // 外部APIからアカウント情報を取得
    const externalApiUrl = `https://x-eight-phi.vercel.app/api/test?screen_name=${encodeURIComponent(
      screen_name
    )}`;
    console.log("外部API呼び出し:", externalApiUrl);

    const externalResponse = await fetch(externalApiUrl);

    if (!externalResponse.ok) {
      console.error(
        "外部APIエラー:",
        externalResponse.status,
        externalResponse.statusText
      );
      return NextResponse.json(
        { error: "アカウント情報の取得に失敗しました" },
        { status: externalResponse.status }
      );
    }

    const accountData = await externalResponse.json();
    console.log("取得したアカウントデータ:", accountData);

    // データベースに挿入するデータを準備
    const insertData = {
      twitter_id: "@" + screen_name,
      rest_id: accountData.user?.rest_id || null,
      name: accountData.user?.legacy?.name || "",
      screen_name: accountData.user?.legacy?.screen_name || screen_name,
      status: String(accountData.user?.reason ?? "active").toLowerCase(),
      description_text: accountData.user?.legacy?.description || null,
      profile_image_url_https:
        accountData.user?.legacy?.profile_image_url_https || null,
      profile_banner_url: accountData.user?.legacy?.profile_banner_url || null,
      follower_count: accountData.user?.legacy?.followers_count || 0,
      following_count: accountData.user?.legacy?.friends_count || 0,
      media_count: accountData.user?.legacy?.media_count || 0,
      favourites_count: accountData.user?.legacy?.favourites_count || 0,
      posts_count: accountData.user?.legacy?.statuses_count || 0,
      not_found: accountData.not_found || false,
      suspend: accountData.suspended || false,
      protect: accountData.protected || false,
      no_tweet: accountData.no_tweet || false,
      search_ban: accountData.search_ban || false,
      search_suggestion_ban: accountData.search_suggestion_ban || false,
      no_reply: accountData.no_reply || false,
      ghost_ban: accountData.ghost_ban || false,
      reply_deboosting: accountData.reply_deboosting || false,
      account_created_at: accountData.user?.legacy?.created_at || null,
    };

    console.log("挿入データ:", insertData);

    // データベースに挿入
    const { data, error } = await supabase
      .from("other_twitter_account")
      .insert([insertData])
      .select();

    if (error) {
      console.error("データベース挿入エラー:", error);

      // 重複エラーの場合
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "このアカウントは既に登録されています" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "データベースへの保存に失敗しました", details: error },
        { status: 500 }
      );
    }

    console.log("挿入成功:", data);

    return NextResponse.json({
      success: true,
      account: data?.[0],
      message: "アカウントを追加しました",
    });
  } catch (error) {
    console.error("API エラー:", error);
    return NextResponse.json(
      {
        error: "サーバーエラーが発生しました",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

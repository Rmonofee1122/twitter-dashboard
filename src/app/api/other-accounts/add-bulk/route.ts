import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { screen_names } = await request.json();

    if (!screen_names || !Array.isArray(screen_names)) {
      return NextResponse.json(
        { error: "スクリーン名の配列が指定されていません" },
        { status: 400 }
      );
    }

    if (screen_names.length === 0) {
      return NextResponse.json(
        { error: "少なくとも1つのスクリーン名を指定してください" },
        { status: 400 }
      );
    }

    // 重複チェック：既存のアカウントを取得
    const twitterIds = screen_names.map((name) => `@${name}`);
    const { data: existingAccounts, error: checkError } = await supabase
      .from("other_twitter_account")
      .select("twitter_id")
      .in("twitter_id", twitterIds);

    if (checkError) {
      console.error("重複チェックエラー:", checkError);
    }

    const existingTwitterIds = new Set(
      existingAccounts?.map((acc) => acc.twitter_id) || []
    );

    // 重複していないアカウントのみをフィルタリング
    const newScreenNames = screen_names.filter(
      (name) => !existingTwitterIds.has(`@${name}`)
    );

    const duplicateScreenNames = screen_names.filter((name) =>
      existingTwitterIds.has(`@${name}`)
    );

    console.log("新規アカウント:", newScreenNames);
    console.log("重複アカウント:", duplicateScreenNames);

    const results = {
      success: [] as string[],
      failed: [] as { screen_name: string; error: string }[],
      duplicate: duplicateScreenNames,
      total: screen_names.length,
    };

    // 各アカウントを順番に処理
    for (const screen_name of newScreenNames) {
      try {
        // 外部APIからアカウント情報を取得
        const externalApiUrl = `https://x-eight-phi.vercel.app/api/test?screen_name=${encodeURIComponent(
          screen_name
        )}`;
        console.log(`外部API呼び出し [${screen_name}]:`, externalApiUrl);

        const externalResponse = await fetch(externalApiUrl);

        if (!externalResponse.ok) {
          console.error(
            `外部APIエラー [${screen_name}]:`,
            externalResponse.status,
            externalResponse.statusText
          );
          results.failed.push({
            screen_name,
            error: `アカウント情報の取得に失敗しました (HTTP ${externalResponse.status})`,
          });
          continue;
        }

        const accountData = await externalResponse.json();
        console.log(`取得したアカウントデータ [${screen_name}]:`, accountData);

        // データベースに挿入するデータを準備
        const insertData = {
          twitter_id: `@${screen_name}`,
          rest_id: accountData.user?.rest_id || null,
          name: accountData.user?.legacy?.name || "",
          screen_name: accountData.user?.legacy?.screen_name || screen_name,
          status: String(accountData.user?.reason ?? "active").toLowerCase(),
          description_text: accountData.user?.legacy?.description || null,
          profile_image_url_https:
            accountData.user?.legacy?.profile_image_url_https || null,
          profile_banner_url:
            accountData.user?.legacy?.profile_banner_url || null,
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

        console.log(`挿入データ [${screen_name}]:`, insertData);

        // データベース「other_twitter_account」に挿入
        const { data, error } = await supabase
          .from("other_twitter_account")
          .insert([insertData])
          .select();

        if (error) {
          console.error(`データベース挿入エラー [${screen_name}]:`, error);
          results.failed.push({
            screen_name,
            error:
              error.message ||
              "データベース「other_twitter_account」への保存に失敗しました",
          });
          continue;
        }

        // データベース「other_tweet_get_jobs」に挿入
        const { data: tweetGetJobsData, error: tweetGetJobsError } =
          await supabase
            .from("other_tweet_get_jobs")
            .insert([
              {
                twitter_id: `@${screen_name}`,
                rest_id: accountData.user?.rest_id || null,
              },
            ])
            .select();
        if (tweetGetJobsError) {
          console.error(
            `データベース「other_tweet_get_jobs」挿入エラー [${screen_name}]:`,
            tweetGetJobsError
          );
        }

        // データベース「other_shadowban_jobs」に挿入
        const { data: shadowbanJobsData, error: shadowbanJobsError } =
          await supabase
            .from("other_shadowban_jobs")
            .insert([{ screen_name: `${screen_name}` }])
            .select();
        if (shadowbanJobsError) {
          console.error(
            `データベース「other_shadowban_jobs」挿入エラー [${screen_name}]:`,
            shadowbanJobsError
          );
        }

        console.log(`挿入成功 [${screen_name}]:`, data);
        results.success.push(screen_name);

        // API制限を考慮して少し待機（最後のアカウント以外）
        if (newScreenNames.indexOf(screen_name) < newScreenNames.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`処理エラー [${screen_name}]:`, error);
        results.failed.push({
          screen_name,
          error:
            error instanceof Error
              ? error.message
              : "予期しないエラーが発生しました",
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `${results.success.length}件のアカウントを追加しました`,
    });
  } catch (error) {
    console.error("バルク追加APIエラー:", error);
    return NextResponse.json(
      {
        error: "サーバーエラーが発生しました",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

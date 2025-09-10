import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const statusFilter = searchParams.get("status") || "all";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const sortField = searchParams.get("sortField") || "";
    const sortDirection = searchParams.get("sortDirection") || "";

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 必要な列のみを取得してパフォーマンス向上
    let query = supabase.from("twitter_account_v3").select(
      `
        id,
        twitter_id,
        email,
        status,
        log_created_at,
        created_at,
        updated_at,
        posts_count,
        following_count,
        follower_count,
        profile_image_url_https,
        search_ban,
        search_suggestion_ban,
        no_reply,
        ghost_ban,
        shadowban_check_at
      `,
      { count: "exact" }
    );

    // 検索フィルター
    if (search) {
      query = query.or(
        `twitter_id.ilike.%${search}%,email.ilike.%${search}%,create_ip.ilike.%${search}%`
      );
    }

    // ステータスフィルター
    if (statusFilter !== "all") {
      switch (statusFilter) {
        case "active":
          query = query.eq("status", "active");
          break;
        case "shadowban":
          query = query.or(
            "status.eq.search_ban,status.eq.search_suggestion_ban,status.eq.ghost_ban"
          );
          break;
        case "stopped":
          query = query.eq("status", "stop");
          break;
        case "examination":
          query = query.eq("status", "examination");
          break;
        case "suspended":
          query = query.or("status.eq.suspend,status.eq.suspended");
          break;
      }
    }

    // 日付フィルター
    if (startDate) {
      query = query.gte("log_created_at", startDate);
    }
    if (endDate) {
      // 終了日は23:59:59まで含める
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      query = query.lte("log_created_at", endDateTime.toISOString());
    }

    // ソート処理（インデックス効率を考慮）
    if (
      sortField &&
      sortDirection &&
      (sortDirection === "asc" || sortDirection === "desc")
    ) {
      const ascending = sortDirection === "asc";

      // よく使われるフィールドを優先してインデックス効果を期待
      switch (sortField) {
        case "created_at":
          query = query.order("log_created_at", { ascending });
          break;
        case "id":
          query = query.order("id", { ascending });
          break;
        case "status":
          query = query.order("status", { ascending });
          break;
        case "updated_at":
          query = query.order("updated_at", { ascending });
          break;
        case "twitter_id":
          query = query.order("twitter_id", { ascending });
          break;
        case "follower_count":
          query = query.order("follower_count", {
            ascending,
            nullsFirst: false,
          });
          break;
        case "following_count":
          query = query.order("following_count", {
            ascending,
            nullsFirst: false,
          });
          break;
        case "posts_count":
          query = query.order("posts_count", { ascending, nullsFirst: false });
          break;
        default:
          // デフォルトソート（最も効率的）
          query = query.order("created_at", { ascending: false });
          break;
      }
    } else {
      // ソートが指定されていない場合のデフォルト（最も効率的）
      query = query.order("log_created_at", { ascending: false });
    }

    // ページネーション
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("アカウントデータの取得エラー:", error);
      return NextResponse.json(
        { error: "アカウントデータの取得に失敗しました" },
        { status: 500 }
      );
    }

    // ステータス別の件数も取得（直接集計版）
    let statusCounts = null;
    if (page === 1) {
      try {
        console.log("📊 ステータス別件数を取得中...");
        
        // 基本クエリを構築（フィルター条件を含む）
        let baseQuery = supabase.from("twitter_account_v3").select("status", { count: "exact", head: true });

        // 検索フィルター適用
        if (search) {
          baseQuery = baseQuery.or(
            `twitter_id.ilike.%${search}%,email.ilike.%${search}%,create_ip.ilike.%${search}%`
          );
        }

        // 日付フィルター適用
        if (startDate) {
          baseQuery = baseQuery.gte("log_created_at", startDate);
        }
        if (endDate) {
          const endDateTime = new Date(endDate);
          endDateTime.setHours(23, 59, 59, 999);
          baseQuery = baseQuery.lte("log_created_at", endDateTime.toISOString());
        }

        // 各ステータス別に並列でカウント取得
        const [
          { count: activeCount },
          { count: shadowbanCount },
          { count: stoppedCount },
          { count: examinationCount },
          { count: suspendedCount },
        ] = await Promise.all([
          // アクティブ
          supabase.from("twitter_account_v3")
            .select("*", { count: "exact", head: true })
            .eq("status", "active")
            .then(result => ({ count: result.count || 0 })),
          
          // シャドバン系
          supabase.from("twitter_account_v3")
            .select("*", { count: "exact", head: true })
            .or("status.eq.search_ban,status.eq.search_suggestion_ban,status.eq.ghost_ban")
            .then(result => ({ count: result.count || 0 })),
          
          // 一時制限
          supabase.from("twitter_account_v3")
            .select("*", { count: "exact", head: true })
            .or("status.eq.stop,status.eq.temp_locked")
            .then(result => ({ count: result.count || 0 })),
          
          // 審査中
          supabase.from("twitter_account_v3")
            .select("*", { count: "exact", head: true })
            .eq("status", "examination")
            .then(result => ({ count: result.count || 0 })),
          
          // 凍結
          supabase.from("twitter_account_v3")
            .select("*", { count: "exact", head: true })
            .or("status.eq.suspend,status.eq.suspended")
            .then(result => ({ count: result.count || 0 })),
        ]);

        statusCounts = {
          active: activeCount,
          shadowban: shadowbanCount,
          stopped: stoppedCount,
          examination: examinationCount,
          suspended: suspendedCount,
        };

        console.log("✅ ステータス別件数取得成功:", statusCounts);
      } catch (statusError) {
        console.error("❌ ステータス別統計の取得エラー:", statusError);
      }
    }

    return NextResponse.json({
      accounts: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      ...(statusCounts && { statusCounts }),
    });
  } catch (error) {
    console.error("API エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "IDが指定されていません" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("twitter_account_v2")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("アカウント削除エラー:", error);
      return NextResponse.json(
        { error: "アカウントの削除に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("削除API エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

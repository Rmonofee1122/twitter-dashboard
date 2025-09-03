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
    let query = supabase
      .from("twitter_account_v2")
      .select(`
        id,
        twitter_id,
        email,
        status,
        created_at,
        updated_at,
        posts_count,
        following_count,
        follower_count,
        profile_image_url_https,
        search_ban,
        search_suggestion_ban,
        no_reply,
        ghost_ban
      `, { count: "exact" });

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
      query = query.gte("created_at", startDate);
    }
    if (endDate) {
      // 終了日は23:59:59まで含める
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      query = query.lte("created_at", endDateTime.toISOString());
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
          query = query.order("created_at", { ascending });
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
          query = query.order("follower_count", { ascending, nullsFirst: false });
          break;
        case "following_count":
          query = query.order("following_count", { ascending, nullsFirst: false });
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
      query = query.order("created_at", { ascending: false });
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

    // ステータス別の件数も取得（最適化版）
    let statusCounts = null;
    if (page === 1) {
      try {
        // 効率的な統計取得：1回のクエリで全ステータスをカウント
        let statsQuery = supabase
          .from("twitter_account_v2")
          .select("status", { count: "exact" });

        // 検索フィルター適用
        if (search) {
          statsQuery = statsQuery.or(
            `twitter_id.ilike.%${search}%,email.ilike.%${search}%,create_ip.ilike.%${search}%`
          );
        }

        // 日付フィルター適用
        if (startDate) {
          statsQuery = statsQuery.gte("created_at", startDate);
        }
        if (endDate) {
          const endDateTime = new Date(endDate);
          endDateTime.setHours(23, 59, 59, 999);
          statsQuery = statsQuery.lte("created_at", endDateTime.toISOString());
        }

        // ステータスデータを取得
        const { data: statusData, error: statusError } = await statsQuery;

        if (!statusError && statusData) {
          // JavaScript側で効率的にカウント
          const counts = {
            active: 0,
            shadowban: 0,
            stopped: 0,
            examination: 0,
            suspended: 0,
          };

          statusData.forEach(record => {
            const status = record.status?.toLowerCase();
            
            if (status === "active") {
              counts.active++;
            } else if (status === "search_ban" || status === "search_suggestion_ban" || status === "ghost_ban") {
              counts.shadowban++;
            } else if (status === "stop") {
              counts.stopped++;
            } else if (status === "examination") {
              counts.examination++;
            } else if (status === "suspend" || status === "suspended") {
              counts.suspended++;
            }
          });

          statusCounts = counts;
        }
      } catch (statusError) {
        console.error("ステータス別統計の取得エラー:", statusError);
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

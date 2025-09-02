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

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("twitter_create_logs")
      .select("*", { count: "exact" });

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
          query = query.or("status.eq.search_ban,status.eq.search_suggestion_ban,status.eq.ghost_ban");
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

    // ページネーション
    query = query.range(from, to).order("created_at", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error("アカウントデータの取得エラー:", error);
      return NextResponse.json(
        { error: "アカウントデータの取得に失敗しました" },
        { status: 500 }
      );
    }

    // ステータス別の件数も取得（フィルター適用）
    let statusCounts = null;
    if (page === 1) {
      // 最初のページのみで統計を取得
      try {
        // 基本クエリ（検索・日付フィルターを適用）
        const createBaseQuery = () => {
          let baseQuery = supabase
            .from("twitter_create_logs")
            .select("*", { count: "exact", head: true });

          // 検索フィルター適用
          if (search) {
            baseQuery = baseQuery.or(
              `twitter_id.ilike.%${search}%,email.ilike.%${search}%,create_ip.ilike.%${search}%`
            );
          }

          // 日付フィルター適用
          if (startDate) {
            baseQuery = baseQuery.gte("created_at", startDate);
          }
          if (endDate) {
            const endDateTime = new Date(endDate);
            endDateTime.setHours(23, 59, 59, 999);
            baseQuery = baseQuery.lte("created_at", endDateTime.toISOString());
          }

          return baseQuery;
        };

        // アクティブ
        const { count: activeCount } = await createBaseQuery().eq("status", "active");

        // シャドBAN
        const { count: shadowbanCount } = await createBaseQuery().or(
          "status.eq.search_ban,status.eq.search_suggestion_ban,status.eq.ghost_ban"
        );

        // 一時停止
        const { count: stoppedCount } = await createBaseQuery().eq("status", "stop");

        // 審査中
        const { count: examinationCount } = await createBaseQuery().eq("status", "examination");

        // 凍結
        const { count: suspendedCount } = await createBaseQuery().or(
          "status.eq.suspend,status.eq.suspended"
        );

        statusCounts = {
          active: activeCount || 0,
          shadowban: shadowbanCount || 0,
          stopped: stoppedCount || 0,
          examination: examinationCount || 0,
          suspended: suspendedCount || 0,
        };
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
      .from("twitter_create_logs")
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

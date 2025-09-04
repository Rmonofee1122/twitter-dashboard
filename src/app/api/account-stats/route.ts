import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // 1回のクエリで全ステータスデータを取得して効率化
    const { data: statusData, error } = await supabase
      .from("status_count_per_day02")
      .select("*");

    if (error) {
      console.error("ステータスデータの取得エラー:", error);
      return NextResponse.json(
        { error: "データの取得に失敗しました" },
        { status: 500 }
      );
    }

    // JavaScript側で効率的にカウント
    const stats = {
      active: 0,
      shadowban: 0,
      stopped: 0,
      examination: 0,
      suspended: 0,
    };

    // 1度のループで全ステータスをカウント
    statusData?.forEach((record) => {
      const status = record.status?.toLowerCase();
      const count = record.count;

      if (status === "active") {
        stats.active += count;
      } else if (
        status === "search_ban" ||
        status === "search_suggestion_ban" ||
        status === "ghost_ban"
      ) {
        stats.shadowban += count;
      } else if (status === "stop" || status === "stopped") {
        stats.stopped += count;
      } else if (status === "examination") {
        stats.examination += count;
      } else if (
        status === "suspend" ||
        status === "suspended" ||
        status === "not_found"
      ) {
        stats.suspended += count;
      }
    });

    // レスポンスにキャッシュヘッダーを追加
    const response = NextResponse.json(stats);
    response.headers.set("Cache-Control", "public, max-age=300, s-maxage=300"); // 5分間キャッシュ
    response.headers.set("Vary", "Accept-Encoding");

    return response;
  } catch (error) {
    console.error("アカウント統計の取得に失敗しました:", error);
    return NextResponse.json(
      { error: "アカウント統計の取得に失敗しました" },
      { status: 500 }
    );
  }
}

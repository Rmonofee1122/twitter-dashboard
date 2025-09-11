import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    console.log("📊 アカウントステータス統計を取得中...");

    // status_count_per_day03
    const { data: statusCountPerDay03 } = await supabase
      .from("status_count_per_day03")
      .select("*");

    // 総アカウント数(statusCountPerDay03.total_countの合計を取得)
    const totalAccounts = statusCountPerDay03?.reduce(
      (acc, item) => acc + item.total_count,
      0
    );

    // アクティブアカウント数（status = active）
    const activeAccounts = statusCountPerDay03?.reduce(
      (acc, item) => acc + item.active_count,
      0
    );

    // 凍結アカウント数（status = suspended）
    const suspendedAccounts = statusCountPerDay03?.reduce(
      (acc, item) => acc + item.suspended_count,
      0
    );

    // シャドBANアカウント数（status = shadowban）
    const shadowbanAccounts = statusCountPerDay03?.reduce(
      (acc, item) => acc + item.shadowban_count,
      0
    );

    // 一時制限アカウント数（status = temp_locked）
    const tempLockedAccounts = statusCountPerDay03?.reduce(
      (acc, item) => acc + item.temp_locked_count,
      0
    );

    // 一時制限アカウント数（status = temp_locked）
    const examinationAccounts = statusCountPerDay03?.reduce(
      (acc, item) => acc + item.examination_count,
      0
    );

    const stats = {
      total: totalAccounts || 0,
      active: activeAccounts || 0,
      shadowban: shadowbanAccounts || 0,
      temp_locked: tempLockedAccounts || 0,
      examination: examinationAccounts || 0,
      suspended: suspendedAccounts || 0,
    };

    console.log("✅ アカウント統計取得成功:", stats);

    // レスポンスにキャッシュヘッダーを追加（1分間キャッシュに短縮）
    const response = NextResponse.json(stats);
    response.headers.set("Cache-Control", "public, max-age=60, s-maxage=60"); // 1分間キャッシュ
    response.headers.set("Vary", "Accept-Encoding");

    return response;
  } catch (error) {
    console.error("💥 アカウント統計取得エラー:", error);
    return NextResponse.json(
      {
        error: "アカウント統計の取得に失敗しました",
        statusCounts: {
          total: 0,
          active: 0,
          shadowban: 0,
          temp_locked: 0,
          examination: 0,
          suspended: 0,
        },
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // アクティブ (status = 'active')
    const { count: activeCount, error: activeError } = await supabase
      .from("twitter_account_v2")
      .select("*", { count: "exact", head: true })
      .or("status.eq.active");

    if (activeError) {
      console.error("アクティブデータの取得エラー:", activeError);
    }

    // シャドBAN (status = 'search_ban' または 'search_suggestion_ban','ghost_ban')
    const { count: shadowbanCount, error: shadowbanError } = await supabase
      .from("twitter_account_v2")
      .select("*", { count: "exact", head: true })
      .or(
        "status.eq.search_ban,status.eq.search_suggestion_ban,status.eq.ghost_ban"
      );

    if (shadowbanError) {
      console.error("シャドBANデータの取得エラー:", shadowbanError);
    }

    // 一時停止 (status = 'stop' または 'stopped')
    const { count: stoppedCount, error: stoppedError } = await supabase
      .from("twitter_account_v2")
      .select("*", { count: "exact", head: true })
      .or("status.eq.stop,status.eq.stopped");

    if (stoppedError) {
      console.error("一時停止データの取得エラー:", stoppedError);
    }

    // 審査中 (status = 'stop' または 'stopped')
    const { count: examinationCount, error: examinationError } = await supabase
      .from("twitter_account_v2")
      .select("*", { count: "exact", head: true })
      .or("status.eq.examination");

    if (examinationError) {
      console.error("審査中データの取得エラー:", examinationError);
    }

    // 凍結・除外 (status = 'suspend' または 'suspended','not_found')
    const { count: suspendedCount, error: suspendedError } = await supabase
      .from("twitter_account_v2")
      .select("*", { count: "exact", head: true })
      .or("status.eq.suspend,status.eq.suspended,status.eq.not_found");

    if (suspendedError) {
      console.error("凍結・除外データの取得エラー:", suspendedError);
    }

    const stats = {
      active: activeCount || 0,
      shadowban: shadowbanCount || 0,
      stopped: stoppedCount || 0,
      examination: examinationCount || 0,
      suspended: suspendedCount || 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("アカウント統計の取得に失敗しました:", error);
    return NextResponse.json(
      { error: "アカウント統計の取得に失敗しました" },
      { status: 500 }
    );
  }
}

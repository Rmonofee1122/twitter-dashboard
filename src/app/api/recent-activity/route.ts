import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const now = new Date();

    // 今日の開始時刻 (00:00:00)
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    // 7日前の開始時刻
    const weekAgo = new Date(todayStart);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // 今月の開始時刻 (1日 00:00:00)
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. 今日作成されたアカウント数
    const { count: todayCount, error: todayError } = await supabase
      .from("twitter_create_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString());

    if (todayError) {
      console.error("今日のアカウント作成数取得エラー:", todayError);
    }

    // 2. 今週（過去7日間）作成されたアカウント数
    const { count: weekCount, error: weekError } = await supabase
      .from("twitter_create_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgo.toISOString());

    if (weekError) {
      console.error("今週のアカウント作成数取得エラー:", weekError);
    }

    // 3. 今月作成されたアカウント数
    const { count: monthCount, error: monthError } = await supabase
      .from("twitter_create_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thisMonthStart.toISOString());

    if (monthError) {
      console.error("今月のアカウント作成数取得エラー:", monthError);
    }

    // 4. アクティブアカウント数 (status = active)
    const { count: activeCount, error: activeError } = await supabase
      .from("twitter_account_v2")
      .select("*", { count: "exact", head: true })
      .or("status.eq.active");

    if (activeError) {
      console.error("アクティブアカウント数取得エラー:", activeError);
    }

    // 5. トータルアカウント数
    const { count: totalCount, error: totalError } = await supabase
      .from("twitter_account_v2")
      .select("*", { count: "exact", head: true });

    if (totalError) {
      console.error("トータルアカウント数取得エラー:", totalError);
    }

    const activityData = {
      todayCreated: todayCount || 0,
      weekCreated: weekCount || 0,
      monthCreated: monthCount || 0,
      activeAccounts: activeCount || 0,
      totalAccounts: totalCount || 0,
    };

    return NextResponse.json(activityData);
  } catch (error) {
    console.error("最近の活動データの取得に失敗しました:", error);
    return NextResponse.json(
      { error: "最近の活動データの取得に失敗しました" },
      { status: 500 }
    );
  }
}

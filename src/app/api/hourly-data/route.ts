import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    // 日付パラメータがない場合は今日の日付を使用
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const dateStart = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate()
    );
    const dateEnd = new Date(dateStart.getTime() + 24 * 60 * 60 * 1000);

    // 指定された日に作成されたアカウントのデータを取得
    const { data, error } = await supabase
      .from("twitter_create_logs")
      .select("created_at")
      .gte("created_at", dateStart.toISOString())
      .lt("created_at", dateEnd.toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      console.error("時間別データ取得エラー:", error);
      return NextResponse.json(
        { error: "時間別データの取得に失敗しました" },
        { status: 500 }
      );
    }

    // 指定された日の24時間別にグループ化
    const hourlyData = [];

    for (let hour = 0; hour < 24; hour++) {
      const count =
        data?.filter((item) => {
          const itemDate = new Date(item.created_at);
          // +9:00
          // itemDate.setHours(itemDate.getHours() + 9);
          return itemDate.getHours() === hour;
        }).length || 0;

      hourlyData.push({
        hour: `${hour.toString().padStart(2, "0")}:00`,
        count,
      });
    }

    return NextResponse.json(hourlyData);
  } catch (error) {
    console.error("時間別データの取得に失敗しました:", error);
    return NextResponse.json(
      { error: "時間別データの取得に失敗しました" },
      { status: 500 }
    );
  }
}

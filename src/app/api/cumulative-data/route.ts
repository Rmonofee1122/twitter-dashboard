import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30days";
    const days = getRangeDays(range);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 今日から過去〇日間の開始日を計算（今日を含む）
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (days - 1));

    // 日付文字列を準備
    const startDateString = startDate.toISOString().split("T")[0];
    const endDateString = today.toISOString().split("T")[0];

    // cumulative_create_count_per_dayビューから指定期間のデータを取得
    const { data, error } = await supabase
      .from("cumulative_create_count_per_day")
      .select("created_date, cumulative_count")
      .gte("created_date", startDateString)
      .lte("created_date", endDateString)
      .order("created_date", { ascending: true });

    if (error) {
      console.error("累計データ取得エラー:", error);
      return NextResponse.json(
        { error: "累計データの取得に失敗しました" },
        { status: 500 }
      );
    }

    // cumulative_create_count_per_dayビューからのデータを変換
    const dataCumulativeMap = new Map<string, number>();
    data?.forEach((item) => {
      dataCumulativeMap.set(item.created_date, item.cumulative_count);
    });

    // 日別データを生成（累計はビューから直接取得、日別カウントは差分計算）
    const cumulativeData = [];
    let previousCumulative = 0;

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];

      const currentCumulative =
        dataCumulativeMap.get(dateStr) || previousCumulative;
      const dayCount = currentCumulative - previousCumulative;

      cumulativeData.push({
        date: dateStr,
        count: dayCount,
        cumulative: currentCumulative,
      });

      previousCumulative = currentCumulative;
    }

    return NextResponse.json(cumulativeData);
  } catch (error) {
    console.error("累計データの取得に失敗しました:", error);
    return NextResponse.json(
      { error: "累計データの取得に失敗しました" },
      { status: 500 }
    );
  }
}

function getRangeDays(range: string): number {
  switch (range) {
    case "7days":
      return 7;
    case "30days":
      return 30;
    case "90days":
      return 90;
    case "1year":
      return 365;
    default:
      return 30;
  }
}

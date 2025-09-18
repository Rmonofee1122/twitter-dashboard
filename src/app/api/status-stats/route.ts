import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let startDate = searchParams.get("startDate");
    let endDate = searchParams.get("endDate");
    const statusFilter = searchParams.get("statuses");

    // デフォルトで過去30日間を設定
    if (!startDate || !endDate) {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      endDate = today.toISOString().split("T")[0];
      startDate = thirtyDaysAgo.toISOString().split("T")[0];
    }

    // status_count_per_day03ビューからデータを取得
    const { data, error } = await supabase
      .from("status_count_per_day03")
      .select("*")
      .gte("created_date", startDate)
      .lte("created_date", endDate)
      .order("created_date", { ascending: true });

    if (error) {
      console.error("ステータス統計データの取得エラー:", error);
      return NextResponse.json(
        { error: "ステータス統計データの取得に失敗しました" },
        { status: 500 }
      );
    }

    // データを整形
    const statusData = data || [];

    // 指定期間の全日付を生成
    const generateDateRange = (start: string, end: string) => {
      const dates = [];
      const startDate = new Date(start);
      const endDate = new Date(end);

      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split("T")[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return dates;
    };

    const allDates = generateDateRange(startDate, endDate);

    // ビューから直接取得したデータを日付でマップ化
    const dataByDate = statusData.reduce((acc, item) => {
      acc[item.created_date] = item;
      return acc;
    }, {} as Record<string, any>);

    // ステータスフィルターの解析
    const selectedStatuses = statusFilter
      ? statusFilter.split(",")
      : ["active", "shadowban", "stopped", "examination", "suspended"];

    // チャート用データに変換（全日付を含む、データがない日は0）
    const chartData = allDates.map((date) => {
      const dayRecord = dataByDate[date] || {};
      const dayData: any = { date };

      if (selectedStatuses.includes("active")) {
        dayData.active = dayRecord.active_count || 0;
      }
      if (selectedStatuses.includes("suspended")) {
        dayData.suspended = dayRecord.suspended_count || 0;
      }
      if (selectedStatuses.includes("temp_locked")) {
        // temp_locked_countを「stopped」として扱う
        dayData.stopped = dayRecord.temp_locked_count || 0;
      }
      if (selectedStatuses.includes("examination")) {
        // other_countを「examination」として扱う
        dayData.examination = dayRecord.other_count || 0;
      }
      if (selectedStatuses.includes("shadowban")) {
        dayData.shadowban = dayRecord.shadowban_count || 0;
      }

      return dayData;
    });

    // 全体統計を計算
    const totalStats = statusData.reduce(
      (acc, item) => {
        acc.total += item.total_count || 0;
        acc.active += item.active_count || 0;
        acc.suspended += item.suspended_count || 0;
        acc.shadowban += item.shadowban_count || 0;
        acc.stopped += item.temp_locked_count || 0; // temp_lockedを「stopped」として扱う
        acc.examination += item.other_count || 0; // otherを「examination」として扱う
        return acc;
      },
      {
        total: 0,
        active: 0,
        suspended: 0,
        pending: 0,
        excluded: 0,
        shadowban: 0,
        stopped: 0,
        examination: 0,
      }
    );

    return NextResponse.json({
      chartData,
      totalStats,
      rawData: statusData,
      selectedStatuses,
    });
  } catch (error) {
    console.error("API エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

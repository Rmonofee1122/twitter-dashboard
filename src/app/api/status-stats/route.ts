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

    let query = supabase
      .from("status_count_per_day02")
      .select("*")
      .gte("created_date", startDate)
      .lte("created_date", endDate)
      .order("created_date", { ascending: true });

    const { data, error } = await query;

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

    // 日付ごとにグループ化
    const groupedByDate = statusData.reduce((acc, item) => {
      const dateKey = item.created_date;
      if (!acc[dateKey]) {
        acc[dateKey] = {};
      }
      acc[dateKey][item.status] = item.count;
      return acc;
    }, {} as Record<string, Record<string, number>>);

    // ステータスフィルターの解析
    const selectedStatuses = statusFilter
      ? statusFilter.split(",")
      : ["active", "shadowban", "stopped", "examination", "suspended"];

    // チャート用データに変換（全日付を含む、データがない日は0）
    const chartData = allDates.map((date) => {
      const statuses = groupedByDate[date] || {};
      const dayData: any = { date };

      if (selectedStatuses.includes("active")) {
        dayData.active = statuses["active"] || 0;
      }
      if (selectedStatuses.includes("suspended")) {
        dayData.suspended =
          (statuses["suspend"] || 0) +
          (statuses["suspended"] || 0) +
          (statuses["Email_BAN"] || 0);
      }
      if (selectedStatuses.includes("stopped")) {
        dayData.pending = (statuses["stop"] || 0) + (statuses["stopped"] || 0);
      }
      if (selectedStatuses.includes("examination")) {
        dayData.excluded =
          (statuses["false"] || 0) + (statuses["not_found"] || 0);
      }
      if (selectedStatuses.includes("shadowban")) {
        dayData.excluded =
          (statuses["search_ban"] || 0) +
          (statuses["ghost_ban"] || 0) +
          (statuses["search_suggestion_ban:"] || 0);
      }

      return dayData;
    });

    // 全体統計を計算
    const totalStats = statusData.reduce(
      (acc, item) => {
        const status = item.status;
        const count = item.count;

        if (status === "active" || status === "true") {
          acc.active += count;
        } else if (
          status === "suspend" ||
          status === "suspended" ||
          status === "email_ban" ||
          status === "Email_BAN"
        ) {
          acc.suspended += count;
        } else if (status === "FarmUp" || status === "farmup") {
          acc.pending += count;
        } else if (status === "false" || status === "not_found") {
          acc.excluded += count;
        } else if (
          status === "search_ban" ||
          status === "search_suggestion_ban" ||
          status === "ghost_ban"
        ) {
          acc.shadowban += count;
        }
        acc.total += count;
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

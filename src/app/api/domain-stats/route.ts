import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let startDate = searchParams.get("startDate");
    let endDate = searchParams.get("endDate");
    const domainFilter = searchParams.get("domains");

    // デフォルトで過去30日間を設定
    if (!startDate || !endDate) {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      endDate = today.toISOString().split("T")[0];
      startDate = thirtyDaysAgo.toISOString().split("T")[0];
    }

    // ドメイン別統計を取得（日付フィルター付き）
    const { data, error } = await supabase
      .from("domain_per_day_view")
      .select("created_date, domain, count")
      .gte("created_date", startDate)
      .lte("created_date", endDate + " 23:59:59");

    if (error) {
      console.error("ドメイン統計データの取得エラー:", error);
      return NextResponse.json(
        { error: "ドメイン統計データの取得に失敗しました" },
        { status: 500 }
      );
    }

    // ドメインフィルターの解析
    const selectedDomains = domainFilter ? domainFilter.split(",") : null;

    // メールアドレスからドメインを抽出してカウント
    const domainCounts: Record<string, number> = {};

    data?.forEach((record) => {
      if (record.domain) {
        const domain = record.domain;
        if (domain && (!selectedDomains || selectedDomains.includes(domain))) {
          domainCounts[domain] = (domainCounts[domain] || 0) + (record.count || 0);
        }
      }
    });

    // すべてのドメイン一覧を取得（フィルター用）
    const allDomainCounts: Record<string, number> = {};
    data?.forEach((record) => {
      if (record.domain) {
        const domain = record.domain;
        if (domain) {
          allDomainCounts[domain] = (allDomainCounts[domain] || 0) + (record.count || 0);
        }
      }
    });

    const allDomains = Object.keys(allDomainCounts).sort();

    // ドメインランキング作成
    const domainRanking = Object.entries(domainCounts)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count);

    // 日別ドメイン推移データの作成
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

    // 選択されたドメインまたは上位5ドメインの日別推移
    const targetDomains =
      selectedDomains && selectedDomains.length > 0
        ? selectedDomains.slice(0, 10) // 最大10ドメインまで表示
        : domainRanking.slice(0, 5).map((d) => d.domain);

    const trendData = allDates.map((date) => {
      const dayData: any = { date };

      targetDomains.forEach((domain) => {
        const count =
          data
            ?.filter((record) => {
              const recordDate = new Date(record.created_date)
                .toISOString()
                .split("T")[0];
              const recordDomain = record.domain;
              return recordDate === date && recordDomain === domain;
            })
            .reduce((sum, record) => sum + (record.count || 0), 0) || 0;

        dayData[domain] = count;
      });

      return dayData;
    });

    // 統計サマリー（フィルター適用済みのデータから計算）
    const totalAccounts = selectedDomains && selectedDomains.length > 0
      ? data?.filter(record => selectedDomains.includes(record.domain)).reduce((sum, record) => sum + (record.count || 0), 0) || 0
      : data?.reduce((sum, record) => sum + (record.count || 0), 0) || 0;
    const uniqueDomains = domainRanking.length;
    const topDomain = domainRanking[0] || null;

    return NextResponse.json({
      domainRanking,
      trendData,
      allDomains,
      summary: {
        totalAccounts,
        uniqueDomains,
        topDomain,
        dateRange: { startDate, endDate },
        selectedDomains: selectedDomains || [],
      },
    });
  } catch (error) {
    console.error("API エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

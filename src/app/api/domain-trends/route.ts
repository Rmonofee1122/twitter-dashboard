import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export interface DomainTrendData {
  created_date: string;
  domain: string;
  count: number;
}

export async function GET(request: NextRequest) {
  try {
    // 過去30日分のデータを取得
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from("domain_per_day_view")
      .select("created_date, domain, count")
      .gte("created_date", startDate)
      .order("created_date", { ascending: true });

    if (error) {
      console.error("Supabaseエラー:", error);
      return NextResponse.json(
        { error: "データの取得に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("API エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
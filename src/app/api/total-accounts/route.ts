import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // cumulative_create_count_per_dayビューから最大累計値を取得
    const { data, error } = await supabase
      .from("cumulative_create_count_per_day")
      .select("cumulative_count")
      .order("cumulative_count", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("総アカウント数の取得エラー:", error);
      return NextResponse.json(
        { error: "総アカウント数の取得に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      totalAccounts: data?.cumulative_count || 0,
    });
  } catch (error) {
    console.error("API エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
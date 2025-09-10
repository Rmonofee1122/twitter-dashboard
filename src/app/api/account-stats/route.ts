import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    console.log("📊 アカウントステータス統計を取得中...");

    // 各ステータス別に直接カウント取得（高速・確実）
    const statusQueries = [
      // アクティブ
      supabase
        .from("twitter_create_with_account_v1")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),
      
      // シャドバン系
      supabase
        .from("twitter_create_with_account_v1") 
        .select("*", { count: "exact", head: true })
        .or("status.eq.search_ban,status.eq.search_suggestion_ban,status.eq.ghost_ban"),
      
      // 一時制限（stop）
      supabase
        .from("twitter_create_with_account_v1")
        .select("*", { count: "exact", head: true })
        .eq("status", "stop"),
      
      // 一時制限（temp_locked）  
      supabase
        .from("twitter_create_with_account_v1")
        .select("*", { count: "exact", head: true })
        .eq("status", "temp_locked"),
      
      // 審査中
      supabase
        .from("twitter_create_with_account_v1")
        .select("*", { count: "exact", head: true })
        .eq("status", "examination"),
      
      // 凍結
      supabase
        .from("twitter_create_with_account_v1")
        .select("*", { count: "exact", head: true })
        .or("status.eq.suspend,status.eq.suspended"),
    ];

    console.log("🔄 並列でステータス別件数を取得中...");
    
    // Promise.allSettledで部分的失敗にも対応
    const results = await Promise.allSettled(statusQueries);
    
    const stats = {
      active: results[0].status === 'fulfilled' ? (results[0].value.count || 0) : 0,
      shadowban: results[1].status === 'fulfilled' ? (results[1].value.count || 0) : 0,
      stopped: results[2].status === 'fulfilled' ? (results[2].value.count || 0) : 0,
      temp_locked: results[3].status === 'fulfilled' ? (results[3].value.count || 0) : 0,
      examination: results[4].status === 'fulfilled' ? (results[4].value.count || 0) : 0,
      suspended: results[5].status === 'fulfilled' ? (results[5].value.count || 0) : 0,
    };

    // エラーが発生したクエリをログに出力
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const statusNames = ['active', 'shadowban', 'stopped', 'temp_locked', 'examination', 'suspended'];
        console.error(`❌ ${statusNames[index]} カウント取得失敗:`, result.reason);
      }
    });

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
          active: 0,
          shadowban: 0,
          stopped: 0,
          temp_locked: 0,
          examination: 0,
          suspended: 0,
        }
      },
      { status: 500 }
    );
  }
}

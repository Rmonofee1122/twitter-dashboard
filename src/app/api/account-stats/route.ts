import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // 新規作成 (app_login = 'FarmUP')
    const { count: newCreationCount, error: newCreationError } = await supabase
      .from("twitter_create_logs")
      .select("*", { count: "exact", head: true })
      .or("app_login.eq.FarmUP,app_login.eq.farmup");

    if (newCreationError) {
      console.error("新規作成データの取得エラー:", newCreationError);
    }

    // 運用中 (app_login = 'true' または true)
    const { count: inOperationCount, error: inOperationError } = await supabase
      .from("twitter_create_logs")
      .select("*", { count: "exact", head: true })
      .or('app_login.eq.true,app_login.eq."true"');

    if (inOperationError) {
      console.error("運用中データの取得エラー:", inOperationError);
    }

    // 除外 (app_login = 'false' または false)
    const { count: excludedCount, error: excludedError } = await supabase
      .from("twitter_create_logs")
      .select("*", { count: "exact", head: true })
      .or('app_login.eq.false,app_login.eq."false"');

    if (excludedError) {
      console.error("除外データの取得エラー:", excludedError);
    }

    // BAN (app_login = 'suspend' または 'email_ban', 'Email_BAN')
    const { count: bannedCount, error: bannedError } = await supabase
      .from("twitter_create_logs")
      .select("*", { count: "exact", head: true })
      .or("app_login.eq.suspend,app_login.eq.email_ban,app_login.eq.Email_BAN");

    if (bannedError) {
      console.error("BANデータの取得エラー:", bannedError);
    }

    const stats = {
      newCreation: newCreationCount || 0,
      inOperation: inOperationCount || 0,
      excluded: excludedCount || 0,
      banned: bannedCount || 0,
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

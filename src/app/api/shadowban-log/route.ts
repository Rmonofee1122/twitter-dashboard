import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const twitterId = searchParams.get("twitter_id");

    if (!twitterId) {
      return NextResponse.json(
        { error: "twitter_id is required" },
        { status: 400 }
      );
    }

    // 指定されたtwitter_idの最新のshadowban_account_logを取得
    const { data, error } = await supabase
      .from("shadowban_account_log")
      .select("*")
      .eq("twitter_id", twitterId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // レコードが見つからない場合は404ではなく、nullを返す
      if (error.code === "PGRST116") {
        return NextResponse.json({
          data: null,
          message: "No shadowban log found for this twitter_id"
        });
      }
      
      console.error("Shadowban log取得エラー:", error);
      return NextResponse.json(
        { error: "Shadowban logの取得に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data,
      message: "Shadowban log取得成功"
    });
  } catch (error) {
    console.error("API エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
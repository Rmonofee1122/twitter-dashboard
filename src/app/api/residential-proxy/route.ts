import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { ProxyInfo } from "@/types/database";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sortField = searchParams.get("sortField") || "used_count";
    const sortDirection = searchParams.get("sortDirection") || "asc";

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    console.log(
      `📊 プロキシ一覧を取得中: page=${page}, limit=${limit}, sort=${sortField}(${sortDirection})`
    );

    // クエリを構築
    let query = supabase
      .from("residential_proxy_list")
      .select("*", { count: "exact" });

    // ソート処理
    const ascending = sortDirection === "asc";
    switch (sortField) {
      case "id":
        query = query.order("id", { ascending });
        break;
      case "ip":
        query = query.order("ip", { ascending });
        break;
      case "used_count":
        query = query.order("used_count", { ascending });
        break;
      case "last_used_at":
        query = query.order("last_used_at", { ascending });
        break;
      case "created_at":
        query = query.order("created_at", { ascending });
        break;
      case "updated_at":
        query = query.order("updated_at", { ascending });
        break;
      default:
        query = query.order("used_count", { ascending: true }); // デフォルト: used_count昇順
        break;
    }

    // ページネーション
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("❌ プロキシデータ取得エラー:", error);
      return NextResponse.json(
        { error: "プロキシデータの取得に失敗しました" },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / limit);

    console.log(
      `✅ プロキシデータ取得成功: ${data?.length || 0}件 / 合計${count || 0}件`
    );

    return NextResponse.json({
      proxies: data || [],
      total: count || 0,
      page,
      limit,
      totalPages,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("💥 プロキシAPI エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

// プロキシの新規作成
export async function POST(request: NextRequest) {
  try {
    const { ip } = await request.json();

    // 必須チェック
    if (ip === null || ip === undefined || ip === "") {
      return NextResponse.json(
        { error: "Proxy IPが必要です" },
        { status: 400 }
      );
    }

    // 重複チェック
    const { data: existingProxy, error: checkError } = await supabase
      .from("residential_proxy_list")
      .select("id")
      .eq("ip", ip.trim())
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 = レコードが見つからない
      console.error("❌ 重複チェックエラー:", checkError);
      return NextResponse.json(
        { error: "重複チェックに失敗しました" },
        { status: 500 }
      );
    }

    if (existingProxy) {
      return NextResponse.json(
        { error: "このProxy IPは既に登録されています" },
        { status: 409 }
      );
    }

    console.log(`➕ 新規プロキシを作成中: ${ip.trim()}`);

    // プロキシを作成
    const { data, error } = await supabase
      .from("residential_proxy_list")
      .insert({
        ip: ip.trim(),
        used_count: 0,
        last_used_at: null,
      })
      .select("*")
      .single();

    if (error) {
      console.error("❌ プロキシ作成エラー:", error);
      return NextResponse.json(
        { error: "プロキシの作成に失敗しました" },
        { status: 500 }
      );
    }

    console.log(`✅ プロキシ作成成功: ID=${data.id}, IP=${data.ip}`);

    return NextResponse.json({
      success: true,
      proxy: data,
      message: "プロキシを追加しました",
    });
  } catch (error) {
    console.error("💥 プロキシ作成エラー:", error);
    return NextResponse.json(
      { error: "プロキシ作成処理でエラーが発生しました" },
      { status: 500 }
    );
  }
}

// プロキシの更新
export async function PUT(request: NextRequest) {
  try {
    const { id, ip } = await request.json();

    // 必須チェック
    if (!id || ip === null || ip === undefined || ip === "") {
      return NextResponse.json(
        { error: "プロキシIDとProxy IPが必要です" },
        { status: 400 }
      );
    }

    // 他のプロキシとの重複チェック（自分以外）
    const { data: existingProxy, error: checkError } = await supabase
      .from("residential_proxy_list")
      .select("id")
      .eq("ip", ip.trim())
      .neq("id", id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("❌ 重複チェックエラー:", checkError);
      return NextResponse.json(
        { error: "重複チェックに失敗しました" },
        { status: 500 }
      );
    }

    if (existingProxy) {
      return NextResponse.json(
        { error: "このProxy IPは既に登録されています" },
        { status: 409 }
      );
    }

    console.log(`✏️ プロキシを更新中: ID=${id}, IP=${ip.trim()}`);

    // プロキシを更新
    const { data, error } = await supabase
      .from("residential_proxy_list")
      .update({
        ip: ip.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("❌ プロキシ更新エラー:", error);
      return NextResponse.json(
        { error: "プロキシの更新に失敗しました" },
        { status: 500 }
      );
    }

    console.log(`✅ プロキシ更新成功: ID=${data.id}, IP=${data.ip}`);

    return NextResponse.json({
      success: true,
      proxy: data,
      message: "プロキシを更新しました",
    });
  } catch (error) {
    console.error("💥 プロキシ更新エラー:", error);
    return NextResponse.json(
      { error: "プロキシ更新処理でエラーが発生しました" },
      { status: 500 }
    );
  }
}

// プロキシの削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "プロキシIDが必要です" },
        { status: 400 }
      );
    }

    console.log(`🗑️ プロキシを削除中: ID=${id}`);

    const { data, error } = await supabase
      .from("residential_proxy_list")
      .delete()
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("❌ プロキシ削除エラー:", error);
      return NextResponse.json(
        { error: "プロキシの削除に失敗しました" },
        { status: 500 }
      );
    }

    console.log(`✅ プロキシ削除成功: ID=${data.id}, IP=${data.ip}`);

    return NextResponse.json({
      success: true,
      message: "プロキシを削除しました",
      deleted_proxy: data,
    });
  } catch (error) {
    console.error("💥 プロキシ削除エラー:", error);
    return NextResponse.json(
      { error: "プロキシ削除処理でエラーが発生しました" },
      { status: 500 }
    );
  }
}

// プロキシの使用回数を更新するPATCHエンドポイント（元のPOST機能）
export async function PATCH(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "プロキシIDが必要です" },
        { status: 400 }
      );
    }

    console.log(`🔄 プロキシ使用状況を更新中: ID=${id}`);

    // used_countを+1、last_used_atを現在時刻に更新
    const { data, error } = await supabase
      .from("residential_proxy_list")
      .update({
        used_count: supabase.rpc("increment_used_count", { id }),
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("❌ プロキシ更新エラー:", error);
      return NextResponse.json(
        { error: "プロキシ情報の更新に失敗しました" },
        { status: 500 }
      );
    }

    console.log(
      `✅ プロキシ更新成功: ID=${id}, new_used_count=${data.used_count}`
    );

    return NextResponse.json({
      success: true,
      proxy: data,
      message: "プロキシの使用状況を更新しました",
    });
  } catch (error) {
    console.error("💥 プロキシ更新エラー:", error);
    return NextResponse.json(
      { error: "プロキシ更新処理でエラーが発生しました" },
      { status: 500 }
    );
  }
}

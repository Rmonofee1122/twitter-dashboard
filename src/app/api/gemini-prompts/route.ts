import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { GeminiPrompt } from "@/types/database";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sortField = searchParams.get("sortField") || "created_at";
    const sortDirection = searchParams.get("sortDirection") || "desc";
    const searchQuery = searchParams.get("search") || "";
    const favoriteOnly = searchParams.get("favorite") === "true";

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    console.log(`📊 Geminiプロンプト一覧を取得中: page=${page}, limit=${limit}, sort=${sortField}(${sortDirection})`);

    let query = supabase
      .from("gemini_image_prompts")
      .select("*", { count: "exact" });

    if (searchQuery) {
      query = query.or(`prompt.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`);
    }

    if (favoriteOnly) {
      query = query.eq("favorite", true);
    }

    const ascending = sortDirection === "asc";
    switch (sortField) {
      case "id":
        query = query.order("id", { ascending });
        break;
      case "prompt":
        query = query.order("prompt", { ascending });
        break;
      case "favorite":
        query = query.order("favorite", { ascending });
        break;
      case "used_count":
        query = query.order("used_count", { ascending });
        break;
      case "last_used_at":
        query = query.order("last_used_at", { ascending, nullsFirst: false });
        break;
      case "created_at":
        query = query.order("created_at", { ascending });
        break;
      case "updated_at":
        query = query.order("updated_at", { ascending });
        break;
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("❌ Geminiプロンプトデータ取得エラー:", error);
      return NextResponse.json(
        { error: "Geminiプロンプトデータの取得に失敗しました" },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / limit);

    console.log(`✅ Geminiプロンプトデータ取得成功: ${data?.length || 0}件 / 合計${count || 0}件`);

    return NextResponse.json({
      prompts: data || [],
      total: count || 0,
      page,
      limit,
      totalPages,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("💥 GeminiプロンプトAPI エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, tags = [], favorite = false } = await request.json();

    if (!prompt || prompt.trim() === "") {
      return NextResponse.json(
        { error: "プロンプトは必須です" },
        { status: 400 }
      );
    }

    console.log(`➕ 新規Geminiプロンプトを作成中: ${prompt.substring(0, 50)}...`);

    const { data, error } = await supabase
      .from("gemini_image_prompts")
      .insert({
        prompt: prompt.trim(),
        tags: Array.isArray(tags) ? tags : [],
        favorite,
        used_count: 0,
        last_used_at: null,
      })
      .select("*")
      .single();

    if (error) {
      console.error("❌ Geminiプロンプト作成エラー:", error);
      return NextResponse.json(
        { error: "Geminiプロンプトの作成に失敗しました" },
        { status: 500 }
      );
    }

    console.log(`✅ Geminiプロンプト作成成功: ID=${data.id}`);

    return NextResponse.json({
      success: true,
      prompt: data,
      message: "Geminiプロンプトを追加しました",
    });
  } catch (error) {
    console.error("💥 Geminiプロンプト作成エラー:", error);
    return NextResponse.json(
      { error: "Geminiプロンプト作成処理でエラーが発生しました" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, prompt, tags = [], favorite = false } = await request.json();

    if (!id || !prompt || prompt.trim() === "") {
      return NextResponse.json(
        { error: "IDとプロンプトが必要です" },
        { status: 400 }
      );
    }

    console.log(`✏️ Geminiプロンプトを更新中: ID=${id}`);

    const { data, error } = await supabase
      .from("gemini_image_prompts")
      .update({
        prompt: prompt.trim(),
        tags: Array.isArray(tags) ? tags : [],
        favorite,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("❌ Geminiプロンプト更新エラー:", error);
      return NextResponse.json(
        { error: "Geminiプロンプトの更新に失敗しました" },
        { status: 500 }
      );
    }

    console.log(`✅ Geminiプロンプト更新成功: ID=${data.id}`);

    return NextResponse.json({
      success: true,
      prompt: data,
      message: "Geminiプロンプトを更新しました",
    });
  } catch (error) {
    console.error("💥 Geminiプロンプト更新エラー:", error);
    return NextResponse.json(
      { error: "Geminiプロンプト更新処理でエラーが発生しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "プロンプトIDが必要です" },
        { status: 400 }
      );
    }

    console.log(`🗑️ Geminiプロンプトを削除中: ID=${id}`);

    const { data, error } = await supabase
      .from("gemini_image_prompts")
      .delete()
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("❌ Geminiプロンプト削除エラー:", error);
      return NextResponse.json(
        { error: "Geminiプロンプトの削除に失敗しました" },
        { status: 500 }
      );
    }

    console.log(`✅ Geminiプロンプト削除成功: ID=${data.id}`);

    return NextResponse.json({
      success: true,
      message: "Geminiプロンプトを削除しました",
      deleted_prompt: data,
    });
  } catch (error) {
    console.error("💥 Geminiプロンプト削除エラー:", error);
    return NextResponse.json(
      { error: "Geminiプロンプト削除処理でエラーが発生しました" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, action } = await request.json();

    if (!id || !action) {
      return NextResponse.json(
        { error: "プロンプトIDとアクションが必要です" },
        { status: 400 }
      );
    }

    console.log(`🔄 Geminiプロンプト状況を更新中: ID=${id}, action=${action}`);

    let updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (action === "use") {
      const { data: currentData } = await supabase
        .from("gemini_image_prompts")
        .select("used_count")
        .eq("id", id)
        .single();

      updateData = {
        used_count: (currentData?.used_count || 0) + 1,
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } else if (action === "toggle_favorite") {
      const { data: currentData } = await supabase
        .from("gemini_image_prompts")
        .select("favorite")
        .eq("id", id)
        .single();

      updateData.favorite = !currentData?.favorite;
    }

    const { data, error } = await supabase
      .from("gemini_image_prompts")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("❌ Geminiプロンプト更新エラー:", error);
      return NextResponse.json(
        { error: "Geminiプロンプト情報の更新に失敗しました" },
        { status: 500 }
      );
    }

    console.log(`✅ Geminiプロンプト更新成功: ID=${id}, action=${action}`);

    return NextResponse.json({
      success: true,
      prompt: data,
      message: "Geminiプロンプトの状況を更新しました",
    });
  } catch (error) {
    console.error("💥 Geminiプロンプト更新エラー:", error);
    return NextResponse.json(
      { error: "Geminiプロンプト更新処理でエラーが発生しました" },
      { status: 500 }
    );
  }
}
// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/server";

// 任意に変更
const BUCKET = "profile_images"; // 作成済みのバケット名
const SIGNED_TTL = 60 * 10; // 非公開時の署名URL有効期限（秒）

// （任意）Node実行を強制したい場合
// export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "ファイルが選択されていません" },
        { status: 400 }
      );
    }

    // ファイル名生成（タイムスタンプ + UUID）
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
    const safeExt = ext ? `.${ext.toLowerCase()}` : "";
    const random = crypto.randomUUID();
    // 例: 2025-08-22/users/xxx/upload_2025-08-22T02-34-56-789Z_xxx.png
    const yyyyMmDd = new Date().toISOString().slice(0, 10);
    const path = `/upload_${ts}_${random}${safeExt}`;

    // アップロード（公開/非公開どちらのバケットでもOK）
    const { data: uploaded, error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        upsert: false,
        contentType: file.type || "application/octet-stream",
        cacheControl: "31536000", // 1年キャッシュ（用途に合わせて調整）
      });

    if (upErr) {
      console.error("Supabase upload error:", upErr);
      return NextResponse.json(
        { error: "アップロードに失敗しました" },
        { status: 500 }
      );
    }

    // URL を返す（公開: publicUrl / 非公開: 署名URL）
    // まず公開URLを試みる（非公開でもエラーにはならない）
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);

    let url = pub.publicUrl;
    // もしバケットが非公開なら、署名付きURLを発行
    if (!url || url.endsWith(path) === false) {
      const { data: signed, error: signErr } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, SIGNED_TTL);

      if (signErr) {
        console.warn("createSignedUrl error (bucket private?)", signErr);
      } else {
        url = signed.signedUrl;
      }
    }

    return NextResponse.json({
      success: true,
      path: uploaded.path,
      url, // 公開 or 署名URL
      contentType: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error("API エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

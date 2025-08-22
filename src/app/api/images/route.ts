// app/api/images/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs"; // Edge runtimeだとFormDataやFileが不安定なのでNode推奨

const BUCKET = "profile_images";
const IMAGE_EXTS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "avif",
  "svg",
  "img",
];

export async function GET() {
  try {
    // バケット直下のファイルを列挙（最大1000件）
    const { data: files, error } = await supabase.storage
      .from(BUCKET)
      .list("", {
        limit: 1000,
        offset: 0,
        sortBy: { column: "updated_at", order: "desc" },
      });

    if (error) {
      console.error("画像一覧の取得エラー:", error.message);
      return NextResponse.json(
        { error: "画像一覧の取得に失敗しました" },
        { status: 500 }
      );
    }

    // 画像ファイルだけフィルタリング
    const images = (files || [])
      .filter((file) => {
        const ext = file.name.toLowerCase().split(".").pop() || "";
        return IMAGE_EXTS.includes(ext);
      })
      .map((file) => {
        // 公開バケット用URLを取得
        const { data: urlData } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(file.name);
        return {
          name: file.name,
          url: urlData.publicUrl,
          size: file.metadata?.size ?? 0,
          lastModified:
            file.updated_at ?? file.created_at ?? new Date().toISOString(),
        };
      });

    return NextResponse.json({
      images,
      total: images.length,
    });
  } catch (error) {
    console.error("API エラー:", error);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

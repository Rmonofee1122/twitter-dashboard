import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 認証エラーのためテスト実装
    // 既知のtest01.jpg画像を直接返す
    const testImage = {
      name: "test01.jpg",
      url: "https://sargcxkxiyxjgkkcggmb.supabase.co/storage/v1/object/public/profile_images/test01.jpg",
      size: 50000, // 推定サイズ
      lastModified: new Date().toISOString(),
    };

    // テスト用の画像データ
    const images = [testImage];

    console.log("Test images data:", images);

    return NextResponse.json({
      images: images,
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

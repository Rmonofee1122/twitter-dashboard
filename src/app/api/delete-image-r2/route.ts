import { NextRequest, NextResponse } from "next/server";
import { r2 } from "@/lib/r2";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

const BUCKET = process.env.R2_BUCKET!;

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { error: "削除対象のキーが指定されていません" },
        { status: 400 }
      );
    }

    console.log("R2画像削除開始:", { bucket: BUCKET, key });

    // R2から画像を削除
    await r2.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    );

    console.log("R2画像削除完了:", key);

    return NextResponse.json({
      success: true,
      deletedKey: key,
      message: "R2バケットから画像を削除しました",
    });
  } catch (error: any) {
    console.error("R2削除API エラー:", error);
    return NextResponse.json(
      {
        error: "R2からの画像削除に失敗しました",
        details: error?.message || "不明なエラー",
      },
      { status: 500 }
    );
  }
}
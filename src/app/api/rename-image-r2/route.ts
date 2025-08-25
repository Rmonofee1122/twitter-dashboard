import { NextRequest, NextResponse } from "next/server";
import { r2 } from "@/lib/r2";
import { CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

const BUCKET = process.env.R2_BUCKET!;

export async function POST(request: NextRequest) {
  try {
    const { oldKey, newKey } = await request.json();

    if (!oldKey || !newKey) {
      return NextResponse.json(
        { error: "変更前と変更後のキーが必要です" },
        { status: 400 }
      );
    }

    if (oldKey === newKey) {
      return NextResponse.json(
        { error: "新しい名前が元の名前と同じです" },
        { status: 400 }
      );
    }

    console.log("R2ファイル名変更開始:", { bucket: BUCKET, oldKey, newKey });

    // 元のファイルが存在するか確認
    try {
      await r2.send(new HeadObjectCommand({
        Bucket: BUCKET,
        Key: oldKey,
      }));
    } catch (error) {
      return NextResponse.json(
        { error: "変更対象のファイルが見つかりません" },
        { status: 404 }
      );
    }

    // 新しい名前のファイルが既に存在するか確認
    try {
      await r2.send(new HeadObjectCommand({
        Bucket: BUCKET,
        Key: newKey,
      }));
      return NextResponse.json(
        { error: "新しい名前のファイルが既に存在します" },
        { status: 409 }
      );
    } catch (error) {
      // ファイルが存在しない（期待される状態）
    }

    // ファイルをコピー（名前変更）
    await r2.send(new CopyObjectCommand({
      Bucket: BUCKET,
      CopySource: `${BUCKET}/${oldKey}`,
      Key: newKey,
    }));

    // 元のファイルを削除
    await r2.send(new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: oldKey,
    }));

    console.log("R2ファイル名変更完了:", { oldKey, newKey });

    return NextResponse.json({
      success: true,
      oldKey,
      newKey,
      message: "ファイル名を変更しました",
    });
  } catch (error: any) {
    console.error("R2名前変更API エラー:", error);
    return NextResponse.json(
      {
        error: "ファイル名の変更に失敗しました",
        details: error?.message || "不明なエラー",
      },
      { status: 500 }
    );
  }
}
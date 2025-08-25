import { NextRequest, NextResponse } from "next/server";
import { r2 } from "@/lib/r2";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

const BUCKET = process.env.R2_BUCKET!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { error: "ダウンロード対象のキーが指定されていません" },
        { status: 400 }
      );
    }

    console.log("R2画像ダウンロード開始:", { bucket: BUCKET, key });

    // R2から画像データを取得
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });

    const response = await r2.send(command);

    if (!response.Body) {
      return NextResponse.json(
        { error: "画像データが見つかりません" },
        { status: 404 }
      );
    }

    // ストリームをバッファに変換
    const chunks: Uint8Array[] = [];
    const reader = response.Body.transformToWebStream().getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    // バッファを結合
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const buffer = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.length;
    }

    // ファイル名を取得（パスの最後の部分）
    const fileName = key.split('/').pop() || key;
    
    // レスポンスヘッダーを設定
    const headers = new Headers();
    headers.set('Content-Type', response.ContentType || 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    headers.set('Content-Length', buffer.length.toString());

    return new NextResponse(buffer, {
      status: 200,
      headers: headers,
    });
  } catch (error: any) {
    console.error("R2ダウンロードAPI エラー:", error);
    return NextResponse.json(
      {
        error: "画像のダウンロードに失敗しました",
        details: error?.message || "不明なエラー",
      },
      { status: 500 }
    );
  }
}
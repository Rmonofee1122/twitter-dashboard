import { NextRequest, NextResponse } from "next/server";
import { r2 } from "@/lib/r2";
import { HeadObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

const BUCKET = process.env.R2_BUCKET!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { error: "キーパラメータが必要です" },
        { status: 400 }
      );
    }

    // R2からオブジェクトのメタデータを取得
    const headResponse = await r2.send(
      new HeadObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    );

    return NextResponse.json({
      metadata: headResponse.Metadata || {},
      contentType: headResponse.ContentType,
      contentLength: headResponse.ContentLength,
      lastModified: headResponse.LastModified?.toISOString(),
    });
  } catch (error) {
    console.error("R2 metadata fetch error:", error);
    return NextResponse.json(
      { error: "メタデータの取得に失敗しました" },
      { status: 500 }
    );
  }
}
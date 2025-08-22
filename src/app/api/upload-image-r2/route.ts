import { NextRequest, NextResponse } from "next/server";
import { r2 } from "@/lib/r2";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { HeadObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const runtime = "nodejs";

const BUCKET = process.env.R2_BUCKET!;
const PUBLIC_BASE = process.env.R2_PUBLIC_BASE_URL ?? ""; // 例: https://cdn.example.com（公開バケット+ドメイン時）

function makeKey(filename: string) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const rand = Math.random().toString(36).slice(2, 8);
  return `uploads/${ts}-${rand}-${filename}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "ファイルが選択されていません" },
        { status: 400 }
      );
    }

    // 任意: サイズ制限（例: 15MB）
    const MAX = 15 * 1024 * 1024;
    if (file.size > MAX) {
      return NextResponse.json(
        { error: "ファイルサイズが大きすぎます（上限15MB）" },
        { status: 413 }
      );
    }

    const key = makeKey(file.name);
    const buf = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || "application/octet-stream";

    // R2へ実アップロード
    await r2.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buf,
        ContentType: contentType,
        Metadata: {
          original_name: file.name,
        },
      })
    );

    // ... PutObject 成功後:
    const head = await r2.send(
      new HeadObjectCommand({ Bucket: BUCKET, Key: key })
    );
    console.log("PutObject OK. HeadObject.ContentLength=", head.ContentLength);

    // 念のため同プレフィックスを一覧
    const list = await r2.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: key,
        MaxKeys: 1,
      })
    );
    console.log(
      "ListObjectsV2 count:",
      list.Contents?.length,
      "firstKey:",
      list.Contents?.[0]?.Key
    );

    // 付けておくと良いログ
    console.log({
      bucket: BUCKET,
      endpoint: (r2 as any).config.endpoint, // orログに自前で endpointBase を出す
      accountId: process.env.R2_ACCOUNT_ID,
    });

    // 表示用URLを返す
    // 1) 公開バケット+カスタムドメインがある場合はそのまま使えるURL
    let viewUrl: string | null = PUBLIC_BASE ? `${PUBLIC_BASE}/${key}` : null;

    // 2) 非公開バケットの場合は、一時的に署名付きGET URLを発行（有効期限10分）
    if (!viewUrl) {
      viewUrl = await getSignedUrl(
        r2,
        new GetObjectCommand({ Bucket: BUCKET, Key: key }),
        { expiresIn: 600 }
      );
    }

    return NextResponse.json({
      success: true,
      bucket: BUCKET,
      key,
      size: file.size,
      contentType,
      url: viewUrl,
      message: "Cloudflare R2へアップロードしました",
    });
  } catch (error) {
    console.error("R2 upload error:", error);
    return NextResponse.json(
      { error: "R2への画像アップロードに失敗しました" },
      { status: 500 }
    );
  }
}

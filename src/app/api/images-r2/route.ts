import { NextResponse } from "next/server";
import { r2 } from "@/lib/r2";
import {
  ListObjectsV2Command,
  GetObjectCommand,
  _Object as S3Object,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const runtime = "nodejs"; // EdgeではなくNodeで実行

const BUCKET = process.env.R2_BUCKET!;

// 画像拡張子だけを対象（必要に応じて調整）
const isImageKey = (key: string) =>
  /\.(png|jpe?g|gif|webp|bmp|svg|avif)$/i.test(key);

export async function GET() {
  try {
    const all: S3Object[] = [];
    let ContinuationToken: string | undefined;

    // ページングしながら全件取得（最大1000件/1リクエスト）
    do {
      const res = await r2.send(
        new ListObjectsV2Command({
          Bucket: BUCKET,
          ContinuationToken,
          MaxKeys: 1000,
        })
      );
      if (res.Contents) all.push(...res.Contents);
      ContinuationToken = res.IsTruncated
        ? res.NextContinuationToken
        : undefined;
    } while (ContinuationToken);

    // 画像のみ抽出 → 署名付きURL生成（有効期限 10分）
    const items = await Promise.all(
      (all || [])
        .filter((o) => o.Key && isImageKey(o.Key))
        .map(async (o) => {
          const key = o.Key!;
          const url = await getSignedUrl(
            r2,
            new GetObjectCommand({ Bucket: BUCKET, Key: key }),
            { expiresIn: 600 }
          );
          return {
            key,
            size: o.Size ?? null,
            lastModified: o.LastModified?.toISOString() ?? null,
            url,
          };
        })
    );

    return NextResponse.json({ bucket: BUCKET, count: items.length, items });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to list R2 objects" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { r2 } from "@/lib/r2";
import { ListObjectsV2Command, _Object as S3Object } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

const BUCKET = process.env.R2_BUCKET!;

export async function GET() {
  try {
    const folders = new Set<string>();
    let ContinuationToken: string | undefined;

    // ページングしながら全オブジェクトのキーを取得
    do {
      const res = await r2.send(
        new ListObjectsV2Command({
          Bucket: BUCKET,
          ContinuationToken,
          MaxKeys: 1000,
          Prefix: "twitterdashboard/", // twitterdashboard配下のみ取得
        })
      );

      if (res.Contents) {
        res.Contents.forEach((obj: S3Object) => {
          if (obj.Key) {
            // twitterdashboard/ プレフィックスを除去
            const keyWithoutPrefix = obj.Key.replace(/^twitterdashboard\//, "");

            // フォルダ部分を抽出（最初の"/"より前の部分）
            const folderMatch = keyWithoutPrefix.match(/^([^/]+)\//);
            if (folderMatch) {
              folders.add(folderMatch[1]);
            }
          }
        });
      }

      ContinuationToken = res.IsTruncated
        ? res.NextContinuationToken
        : undefined;
    } while (ContinuationToken);

    const folderList = Array.from(folders).sort();

    return NextResponse.json({
      bucket: BUCKET,
      folders: folderList,
      count: folderList.length,
    });
  } catch (e) {
    console.error("R2 folders fetch error:", e);
    return NextResponse.json(
      { error: "フォルダ一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

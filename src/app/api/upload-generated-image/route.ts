import { NextRequest, NextResponse } from "next/server";
import { r2 } from "@/lib/r2";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const runtime = "nodejs";

const BUCKET = process.env.R2_BUCKET!;

function makeGeneratedImageKey(prompt: string) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const rand = Math.random().toString(36).slice(2, 8);
  // promptの最初の20文字をファイル名に含める（安全な文字のみ）
  const safeName = prompt.substring(0, 20).replace(/[^a-zA-Z0-9]/g, "-");
  return `twitterdashboard/generated/${ts}-${rand}-${safeName}.png`;
}

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, prompt } = await request.json();

    if (!imageBase64 || !prompt) {
      return NextResponse.json(
        { error: "画像データまたはプロンプトが不足しています" },
        { status: 400 }
      );
    }

    // Base64データからバイナリに変換
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const key = makeGeneratedImageKey(prompt);

    // R2へアップロード（プロンプトをメタデータとして保存）
    await r2.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: "image/png",
        Metadata: {
          "prompt": prompt,
          "generation-type": "gemini",
          "generated-at": new Date().toISOString(),
        },
      })
    );

    console.log(`Generated image uploaded to R2: ${key}`);
    console.log(`Prompt metadata: "${prompt}"`);

    // 署名付きURLを生成（10分有効）
    const viewUrl = await getSignedUrl(
      r2,
      new GetObjectCommand({ Bucket: BUCKET, Key: key }),
      { expiresIn: 600 }
    );

    return NextResponse.json({
      success: true,
      bucket: BUCKET,
      key,
      size: buffer.length,
      contentType: "image/png",
      url: viewUrl,
      prompt,
      message: "生成画像をR2に保存しました",
    });
  } catch (error) {
    console.error("Generated image upload error:", error);
    return NextResponse.json(
      { error: "生成画像のR2アップロードに失敗しました" },
      { status: 500 }
    );
  }
}
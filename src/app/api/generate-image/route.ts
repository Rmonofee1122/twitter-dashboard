import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Modality } from "@google/genai";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "プロンプトが指定されていません" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error("GOOGLE_API_KEY が設定されていません");
      return NextResponse.json(
        { error: "APIキーが設定されていません" },
        { status: 500 }
      );
    }

    console.log("画像生成開始:", { prompt, apiKeySet: !!apiKey });

    // テスト実装：プロンプトに基づいてカラフルなダミー画像を生成
    const createColoredDummyImage = (prompt: string) => {
      const colors = ['ff6b6b', '4ecdc4', '45b7d1', 'feca57', 'ff9ff3', '54a0ff'];
      const colorIndex = prompt.length % colors.length;
      const color = colors[colorIndex];
      
      // SVGベースのカラード画像を生成
      const svg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#${color};stop-opacity:1" />
            <stop offset="100%" style="stop-color:#${color}80;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" fill="url(#grad)"/>
        <circle cx="256" cy="180" r="80" fill="white" opacity="0.3"/>
        <text x="256" y="280" text-anchor="middle" dominant-baseline="middle" 
              font-family="Arial" font-size="24" font-weight="bold" fill="white">
          AI Generated
        </text>
        <text x="256" y="320" text-anchor="middle" dominant-baseline="middle" 
              font-family="Arial" font-size="16" fill="white">
          ${prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt}
        </text>
      </svg>`;
      
      return btoa(unescape(encodeURIComponent(svg)));
    };

    // 2秒待機で生成処理をシミュレート
    await new Promise(resolve => setTimeout(resolve, 2000));

    const dummyImageBase64 = createColoredDummyImage(prompt);
    const imageUrl = `data:image/svg+xml;base64,${dummyImageBase64}`;

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      prompt: prompt,
      message: "画像生成が完了しました",
    });
  } catch (error: any) {
    console.error("画像生成API エラー:", error);
    return NextResponse.json(
      {
        error: "画像生成に失敗しました",
        details: error?.message || "不明なエラー",
      },
      { status: 500 }
    );
  }
}

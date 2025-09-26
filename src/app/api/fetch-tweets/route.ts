import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const screenName = searchParams.get("screen_name");
  const count = searchParams.get("count") || "20";

  if (!screenName) {
    return NextResponse.json(
      { success: false, error: "screen_name is required" },
      { status: 400 }
    );
  }

  // 環境変数からAPIのURLを取得
  // Vercel環境では、環境変数が設定されていない場合エラーを返す
  const apiBaseUrl = process.env.TWITTER_API_BASE_URL;

  // デバッグ用ログ
  console.log("Environment:", process.env.NODE_ENV);
  console.log("TWITTER_API_BASE_URL from env:", apiBaseUrl);

  if (!apiBaseUrl) {
    console.error("TWITTER_API_BASE_URL is not set in environment variables");
    return NextResponse.json(
      {
        success: false,
        error: "API configuration error",
        details:
          "TWITTER_API_BASE_URL環境変数が設定されていません。Vercelの環境変数設定を確認してください。",
        environment: process.env.NODE_ENV,
      },
      { status: 500 }
    );
  }

  // localhostの使用を防ぐ
  if (
    process.env.NODE_ENV === "production" &&
    apiBaseUrl.includes("localhost")
  ) {
    console.error("Cannot use localhost in production environment");
    return NextResponse.json(
      {
        success: false,
        error: "Configuration error",
        details:
          "本番環境でlocalhostは使用できません。TWITTER_API_BASE_URLを正しいAPIサーバーのURLに設定してください。",
        currentUrl: apiBaseUrl,
      },
      { status: 500 }
    );
  }

  try {
    const fullApiUrl = `${apiBaseUrl}/api/latest-tweets?screen_name=${screenName}&count=${count}`;
    console.log("Fetching from:", fullApiUrl);

    // 外部APIにリクエストを送信
    const response = await fetch(fullApiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // タイムアウト設定
      signal: AbortSignal.timeout(10000), // 10秒のタイムアウト
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API returned error status ${response.status}:`, errorText);
      return NextResponse.json(
        {
          success: false,
          error: `API Error: ${response.status}`,
          details: errorText,
          apiUrl: fullApiUrl,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching tweets:", error);
    console.error("Attempted API URL:", `${apiBaseUrl}/api/latest-tweets`);
    console.error("Full error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // より詳細なエラーメッセージを返す
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const isTimeoutError =
      errorMessage.includes("timeout") || errorMessage.includes("aborted");
    const isNetworkError =
      errorMessage.includes("fetch failed") ||
      errorMessage.includes("ECONNREFUSED");

    let userFriendlyMessage = "APIサーバーへの接続に失敗しました。";
    if (isTimeoutError) {
      userFriendlyMessage = "APIサーバーへの接続がタイムアウトしました。";
    } else if (isNetworkError) {
      userFriendlyMessage =
        "APIサーバーに接続できません。サーバーが起動していることを確認してください。";
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch tweets from external API",
        details: errorMessage,
        userMessage: userFriendlyMessage,
        apiUrl: `${apiBaseUrl}/api/latest-tweets`,
        environment: process.env.NODE_ENV,
        configuredUrl: apiBaseUrl,
      },
      { status: 500 }
    );
  }
}

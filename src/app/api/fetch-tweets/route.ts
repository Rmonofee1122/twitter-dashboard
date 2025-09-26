import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const screenName = searchParams.get('screen_name');
  const count = searchParams.get('count') || '20';

  if (!screenName) {
    return NextResponse.json(
      { success: false, error: 'screen_name is required' },
      { status: 400 }
    );
  }

  try {
    // 外部APIにリクエストを送信
    const response = await fetch(
      `http://localhost:3015/api/latest-tweets?screen_name=${screenName}&count=${count}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { success: false, error: `API Error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching tweets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tweets from external API' },
      { status: 500 }
    );
  }
}
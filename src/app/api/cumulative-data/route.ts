import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30days';
    const days = getRangeDays(range);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 今日から過去〇日間の開始日を計算（今日を含む）
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (days - 1));

    // 開始日より前の累計数を取得
    const { count: initialCount, error: initialError } = await supabase
      .from('twitter_create_logs')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', startDate.toISOString());

    if (initialError) {
      console.error('初期累計数取得エラー:', initialError);
    }

    // 指定期間のデータを取得
    const { data, error } = await supabase
      .from('twitter_create_logs')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('累計データ取得エラー:', error);
      return NextResponse.json({ error: '累計データの取得に失敗しました' }, { status: 500 });
    }

    // 日別の累計数を計算（今日から過去〇日間）
    const cumulativeData = [];
    let cumulative = initialCount || 0;

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      // その日の作成数をカウント
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayCount = data?.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate >= dayStart && itemDate <= dayEnd;
      }).length || 0;

      cumulative += dayCount;
      
      cumulativeData.push({
        date: dateStr,
        count: dayCount,
        cumulative
      });
    }

    return NextResponse.json(cumulativeData);
  } catch (error) {
    console.error('累計データの取得に失敗しました:', error);
    return NextResponse.json(
      { error: '累計データの取得に失敗しました' },
      { status: 500 }
    );
  }
}

function getRangeDays(range: string): number {
  switch (range) {
    case '7days':
      return 7;
    case '30days':
      return 30;
    case '90days':
      return 90;
    case '1year':
      return 365;
    default:
      return 30;
  }
}
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    // 今日作成されたアカウントのデータを取得
    const { data, error } = await supabase
      .from('twitter_create_logs')
      .select('created_at')
      .gte('created_at', todayStart.toISOString())
      .lt('created_at', todayEnd.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('時間別データ取得エラー:', error);
      return NextResponse.json(
        { error: '時間別データの取得に失敗しました' },
        { status: 500 }
      );
    }

    // 今日の24時間別にグループ化
    const hourlyData = [];
    
    for (let hour = 0; hour < 24; hour++) {
      const count = data?.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate.getHours() === hour;
      }).length || 0;

      hourlyData.push({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        count
      });
    }

    return NextResponse.json(hourlyData);
  } catch (error) {
    console.error('時間別データの取得に失敗しました:', error);
    return NextResponse.json(
      { error: '時間別データの取得に失敗しました' },
      { status: 500 }
    );
  }
}
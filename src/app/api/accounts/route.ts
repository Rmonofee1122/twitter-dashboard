import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const statusFilter = searchParams.get('status') || 'all';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('twitter_create_logs')
      .select('*', { count: 'exact' });

    // 検索フィルター
    if (search) {
      query = query.or(`twitter_id.ilike.%${search}%,email.ilike.%${search}%,create_ip.ilike.%${search}%`);
    }

    // ステータスフィルター
    if (statusFilter !== 'all') {
      switch (statusFilter) {
        case 'pending':
          query = query.or('app_login.eq.FarmUp,app_login.eq.farmup');
          break;
        case 'active':
          query = query.or('app_login.eq.true,app_login.eq."true"');
          break;
        case 'suspended':
          query = query.or('app_login.eq.suspend,app_login.eq.email_ban,app_login.eq.Email_BAN');
          break;
        case 'excluded':
          query = query.or('app_login.eq.false,app_login.eq."false"');
          break;
      }
    }

    // 日付フィルター
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      // 終了日は23:59:59まで含める
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      query = query.lte('created_at', endDateTime.toISOString());
    }

    // ページネーション
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('アカウントデータの取得エラー:', error);
      return NextResponse.json(
        { error: 'アカウントデータの取得に失敗しました' },
        { status: 500 }
      );
    }

    // ステータス別の件数も取得（フィルター適用）
    let statusCounts = null;
    if (page === 1) { // 最初のページのみで統計を取得
      try {
        // 基本クエリ（検索・日付フィルターを適用）
        const createBaseQuery = () => {
          let baseQuery = supabase.from('twitter_create_logs').select('*', { count: 'exact', head: true });
          
          // 検索フィルター適用
          if (search) {
            baseQuery = baseQuery.or(`twitter_id.ilike.%${search}%,email.ilike.%${search}%,create_ip.ilike.%${search}%`);
          }
          
          // 日付フィルター適用
          if (startDate) {
            baseQuery = baseQuery.gte('created_at', startDate);
          }
          if (endDate) {
            const endDateTime = new Date(endDate);
            endDateTime.setHours(23, 59, 59, 999);
            baseQuery = baseQuery.lte('created_at', endDateTime.toISOString());
          }
          
          return baseQuery;
        };

        // 保留中
        const { count: pendingCount } = await createBaseQuery()
          .or('app_login.eq.FarmUp,app_login.eq.farmup');

        // アクティブ
        const { count: activeCount } = await createBaseQuery()
          .or('app_login.eq.true,app_login.eq."true"');

        // BAN
        const { count: suspendedCount } = await createBaseQuery()
          .or('app_login.eq.suspend,app_login.eq.email_ban,app_login.eq.Email_BAN');

        // 除外
        const { count: excludedCount } = await createBaseQuery()
          .or('app_login.eq.false,app_login.eq."false"');

        statusCounts = {
          pending: pendingCount || 0,
          active: activeCount || 0,
          suspended: suspendedCount || 0,
          excluded: excludedCount || 0
        };
      } catch (statusError) {
        console.error('ステータス別統計の取得エラー:', statusError);
      }
    }

    return NextResponse.json({
      accounts: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      ...(statusCounts && { statusCounts })
    });
  } catch (error) {
    console.error('API エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
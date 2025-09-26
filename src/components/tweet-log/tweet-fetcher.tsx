"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Download, AlertCircle } from "lucide-react";

interface Tweet {
  id: string;
  text: string;
  created_at: string;
  favorite_count: number;
  retweet_count: number;
  reply_count: number;
  quote_count: number;
  views: string | number;
  is_retweet: boolean;
  is_quote: boolean;
  media: any[];
}

interface TweetResponse {
  success: boolean;
  tweets: Tweet[];
  user: {
    id: string;
    name: string;
    screen_name: string;
    profile_image_url: string;
    verified: boolean;
  };
}

export default function TweetFetcher() {
  const [screenName, setScreenName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fetchedCount, setFetchedCount] = useState(0);

  const handleFetchTweets = async () => {
    if (!screenName.trim()) {
      setError("スクリーンネームを入力してください");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    setFetchedCount(0);

    try {
      // APIから  Tweetデータを取得 (Next.js APIルート経由)
      const response = await fetch(
        `/api/fetch-tweets?screen_name=${screenName}&count=20`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Response Error:', errorText);
        throw new Error(`APIエラー: ${response.status} - ${errorText}`);
      }

      const data: TweetResponse = await response.json();

      if (!data.success) {
        throw new Error("ツイートの取得に失敗しました");
      }

      // Supabaseに保存するデータを準備
      const tweetsToInsert = data.tweets.map((tweet) => ({
        twitter_id: "@" + data.user.screen_name,
        name: data.user.name,
        screen_name: data.user.screen_name,
        tweet_id: tweet.id,
        tweet_created_at: new Date(tweet.created_at).toISOString(),
        tweet_text: tweet.text,
        favorite_count: tweet.favorite_count,
        retweet_count: tweet.retweet_count,
        reply_count: tweet.reply_count,
        quote_count: tweet.quote_count,
        view_count:
          typeof tweet.views === "string"
            ? parseInt(tweet.views) || 0
            : tweet.views || 0,
        is_retweet: tweet.is_retweet,
        is_quote: tweet.is_quote,
        media_type: tweet.media && tweet.media.length > 0 ? "image" : null,
        media_url:
          tweet.media && tweet.media.length > 0 ? tweet.media[0] : null,
      }));

      // Supabaseに一括保存
      const { error: insertError } = await supabase
        .from("twitter_tweet_log")
        .upsert(tweetsToInsert, {
          onConflict: "tweet_id",
          ignoreDuplicates: false,
        });

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        throw new Error(
          `データベースへの保存に失敗しました: ${insertError.message}`
        );
      }

      setFetchedCount(data.tweets.length);
      setSuccess(true);
      setScreenName("");
    } catch (err) {
      console.error("Error fetching tweets:", err);
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError("APIサーバーに接続できませんでした。CORSエラーの可能性があります。APIサーバーが起動していることを確認してください。");
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "ツイートの取得中にエラーが発生しました"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        ツイート取得
      </h2>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="screen_name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            スクリーンネーム
          </label>
          <div className="flex gap-2">
            <input
              id="screen_name"
              type="text"
              value={screenName}
              onChange={(e) => setScreenName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleFetchTweets()}
              placeholder="例: sgchjnjay7l"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={loading}
            />
            <button
              onClick={handleFetchTweets}
              disabled={loading || !screenName.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  取得中...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  取得
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center p-4 text-sm text-red-800 bg-red-100 rounded-lg dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="mr-2 h-4 w-4" />
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 text-sm text-green-800 bg-green-100 rounded-lg dark:bg-green-900/20 dark:text-green-400">
            ✅ {fetchedCount}件のツイートを正常に保存しました
          </div>
        )}

        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>※ 最新20件のツイートを取得してデータベースに保存します</p>
          <p>※ 重複するツイートIDは自動的に更新されます</p>
        </div>
      </div>
    </div>
  );
}

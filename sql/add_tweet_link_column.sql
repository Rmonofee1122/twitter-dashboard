-- twitter_tweet_logテーブルにtweet_linkカラムを追加
ALTER TABLE public.twitter_tweet_log
ADD COLUMN IF NOT EXISTS tweet_link text;

-- 既存のデータに対してツイートリンクを生成
UPDATE public.twitter_tweet_log
SET tweet_link = CONCAT('https://x.com/', screen_name, '/status/', tweet_id)
WHERE tweet_link IS NULL;
export interface TwitterCreateLog {
  id: number;
  created_at: string;
  twitter_id: string | null;
  twitter_pass: string | null;
  twitter_2fa_code: string | null;
  ct0: string | null;
  create_ip: string | null;
  email_id: string | null;
  email: string | null;
  device_base64: string | null;
  app_login: string | null;
}

export interface DashboardStats {
  totalAccounts: number;
  activeAccounts: number;
  accountsCreatedToday: number;
  accountsCreatedThisWeek: number;
  accountsCreatedThisMonth: number;
}

export interface TwitterAccountInfo {
  id: number;
  created_at: string;
  updated_at: string;
  twitter_id: string | null;
  name: string | null;
  screen_name: string | null;
  status: string | null;
  description_text: string | null;
  profile_image_url_https: string | null;
  profile_banner_url: string | null;
  follower_count: number | null;
  following_count: number | null;
  posts_count: number | null;
  media_count: number | null;
  favourites_count: number | null;
  verified: boolean;
  protected: boolean;
  not_found: boolean;
  suspend: boolean;
  protect: boolean;
  no_tweet: boolean;
  search_ban: boolean;
  search_suggestion_ban: boolean;
  no_reply: boolean;
  ghost_ban: boolean;
  reply_deboosting: boolean;
  twitter_pass: string | null;
  twitter_2fa_code: string | null;
  ct0: string | null;
  create_ip: string | null;
  email_id: string | null;
  email: string | null;
  log_created_at: string;
  device_base64: string | null;
  app_login: string | null;
  shadowban_check_at: string;
}

export interface ProxyInfo {
  id: number;
  ip: string;
  used_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

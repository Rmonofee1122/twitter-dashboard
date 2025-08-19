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
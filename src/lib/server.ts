import { createClient } from "@supabase/supabase-js";

export function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !serviceRole) {
    throw new Error("Supabase URL / Service Role Key が未設定です");
  }
  return createClient(url, serviceRole, {
    auth: { persistSession: false }, // サーバーなのでセッション保持不要
  });
}

import { supabase } from "./supabase";

export async function updateAccountStatus(id: number, status: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("twitter_create_logs")
      .update({ app_login: status })
      .eq("id", id);

    if (error) {
      console.error("Supabaseエラー:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("ステータス更新エラー:", error);
    return false;
  }
}
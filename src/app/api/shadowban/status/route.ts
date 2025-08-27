export const runtime = "nodejs"; // EdgeではなくNode（DB接続など安定）
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, // ← server-onlyの環境変数を使う
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const job_id = searchParams.get("job_id");
  if (!job_id) {
    return NextResponse.json({ error: "job_id required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("shadowban_jobs")
    .select("*")
    .eq("id", job_id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  return NextResponse.json(data);
}

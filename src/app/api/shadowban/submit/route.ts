export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { screen_name } = await req.json();
  if (!screen_name)
    return NextResponse.json(
      { error: "screen_name required" },
      { status: 400 }
    );

  // 既にqueued/runningならそのジョブを返す（重複合流）
  const { data: exist } = await sb
    .from("shadowban_jobs")
    .select("id,status")
    .eq("screen_name", screen_name)
    .in("status", ["queued", "running"])
    .maybeSingle();
  if (exist)
    return NextResponse.json({ job_id: exist.id, status: exist.status });

  const { data, error } = await sb
    .from("shadowban_jobs")
    .insert({ screen_name })
    .select("id")
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ job_id: data.id, status: "queued" });
}

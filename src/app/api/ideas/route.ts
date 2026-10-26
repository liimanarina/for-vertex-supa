import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await getSupabase()
    .from("ideas")
    .select("id, title, description, author_nickname, vote_count, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Could not load ideas." }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { title, description, author_nickname } = body as Record<string, unknown>;
  if (typeof title !== "string" || typeof description !== "string" || typeof author_nickname !== "string") {
    return NextResponse.json({ error: "Please complete all fields." }, { status: 400 });
  }
  const values = { title: title.trim(), description: description.trim(), author_nickname: author_nickname.trim() };
  if (!values.title || values.title.length > 100 || !values.description || values.description.length > 1000 || !values.author_nickname || values.author_nickname.length > 40) {
    return NextResponse.json({ error: "Title, description, or nickname is empty or too long." }, { status: 400 });
  }
  const { data, error } = await getSupabase().from("ideas").insert(values)
    .select("id, title, description, author_nickname, vote_count, created_at").single();
  if (error) return NextResponse.json({ error: "Could not submit your idea." }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}

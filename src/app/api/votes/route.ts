import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null);
  const ideaId = body && typeof body === "object" ? (body as Record<string, unknown>).ideaId : null;
  if (typeof ideaId !== "string" || !/^[0-9a-f-]{36}$/i.test(ideaId)) {
    return NextResponse.json({ error: "Invalid idea." }, { status: 400 });
  }
  let voterId = request.cookies.get("idea_voter")?.value;
  const isNewVoter = !voterId || !/^[0-9a-f-]{36}$/i.test(voterId);
  if (isNewVoter) voterId = crypto.randomUUID();

  const { error } = await getSupabase().from("votes").insert({ idea_id: ideaId, voter_id: voterId });
  if (error?.code === "23505") return NextResponse.json({ error: "You have already voted for this idea." }, { status: 409 });
  if (error) return NextResponse.json({ error: "Could not record your vote." }, { status: 400 });

  const response = NextResponse.json({ ok: true });
  if (isNewVoter) response.cookies.set("idea_voter", voterId, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 * 5,
  });
  return response;
}

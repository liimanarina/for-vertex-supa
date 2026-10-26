"use client";

import { FormEvent, useEffect, useState } from "react";

type Idea = { id: string; title: string; description: string; author_nickname: string; vote_count: number; created_at: string };

export default function Home() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function loadIdeas() {
    const response = await fetch("/api/ideas", { cache: "no-store" });
    if (response.ok) setIdeas(await response.json());
    setLoading(false);
  }
  useEffect(() => { void loadIdeas(); }, []);

  async function submitIdea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setNotice(""); setBusy(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await fetch("/api/ideas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: form.get("title"), description: form.get("description"), author_nickname: form.get("nickname") }) });
    const result = await response.json();
    if (response.ok) { formElement.reset(); setNotice("Your idea is on the board."); await loadIdeas(); }
    else setNotice(result.error || "Something went wrong.");
    setBusy(false);
  }

  async function vote(id: string) {
    setNotice("");
    const response = await fetch("/api/votes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ideaId: id }) });
    const result = await response.json();
    if (response.ok) await loadIdeas(); else setNotice(result.error || "Could not vote.");
  }

  return <main className="shell">
    <header className="topbar"><a className="brand" href="#top"><span className="brand-mark">i</span> idea<span>board</span></a><a className="top-link" href="#submit">Share an idea <span aria-hidden="true">↗</span></a></header>
    <section className="hero" id="top"><p className="eyebrow"><span className="live-dot" /> A LITTLE SPACE FOR BIG IDEAS</p><h1>Good ideas get<br /><em>better together.</em></h1><p className="intro">Have a thought that could make things better? Put it out there. The best ideas start with a conversation.</p><a className="primary-link" href="#submit">Add your idea <span aria-hidden="true">↓</span></a><div className="hero-scribble" aria-hidden="true">✳</div></section>
    <section className="board" aria-labelledby="board-title"><div className="section-heading"><div><p className="eyebrow">THE COMMUNITY BOARD</p><h2 id="board-title">Ideas in motion <span className="count">{ideas.length.toString().padStart(2, "0")}</span></h2></div><span className="sort-note">Recently shared <span aria-hidden="true">↘</span></span></div>
      {notice && <p className="notice" role="status">{notice}</p>}
      {loading ? <p className="empty">Gathering ideas…</p> : ideas.length === 0 ? <p className="empty">It’s quiet here. Share the first idea below.</p> : <div className="idea-grid">{ideas.map((idea) => <article className="idea-card" key={idea.id}><div className="card-top"><span className="idea-label">IDEA <span>·</span> {new Date(idea.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span><button className="vote-button" onClick={() => void vote(idea.id)} aria-label={`Vote for ${idea.title}`}><span aria-hidden="true">↑</span> {idea.vote_count}</button></div><h3>{idea.title}</h3><p className="idea-description">{idea.description}</p><div className="author"><span className="avatar">{idea.author_nickname.slice(0, 1).toUpperCase()}</span><span>Shared by <strong>{idea.author_nickname}</strong></span></div></article>)}</div>}
    </section>
    <section className="submit-section" id="submit"><div className="form-aside"><p className="eyebrow">YOUR TURN</p><h2>What’s on<br /><em>your mind?</em></h2><p>Big, small, half-formed, or ready to go. Every idea has to start somewhere.</p></div><form className="idea-form" onSubmit={submitIdea}><label>Your name <span>(nickname is fine)</span><input name="nickname" placeholder="e.g. Alex" maxLength={40} required /></label><label>Idea title<input name="title" placeholder="Give your idea a name" maxLength={100} required /></label><label>The details<textarea name="description" placeholder="What would you like to see?" maxLength={1000} rows={4} required /></label><button className="submit-button" disabled={busy}>{busy ? "Sharing…" : "Share your idea"}<span aria-hidden="true">↗</span></button><p className="form-footnote">No account needed. Just bring your curiosity.</p></form></section>
    <footer><a className="brand footer-brand" href="#top"><span className="brand-mark">i</span> idea<span>board</span></a><span>Made for ideas that move us forward.</span><a href="#top">Back to top ↑</a></footer>
  </main>;
}

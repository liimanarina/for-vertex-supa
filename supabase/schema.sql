-- Run in Supabase SQL Editor. The public API can read and create ideas, and
-- create votes. Vote rows (including voter identifiers) are never readable
-- through the public API. A trigger maintains the public vote_count.

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 100),
  description text not null check (char_length(btrim(description)) between 1 and 1000),
  author_nickname text not null check (char_length(btrim(author_nickname)) between 1 and 40),
  vote_count integer not null default 0 check (vote_count >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  voter_id uuid not null,
  created_at timestamptz not null default now(),
  constraint votes_one_per_voter_per_idea unique (idea_id, voter_id)
);

create index if not exists ideas_created_at_idx on public.ideas (created_at desc);

alter table public.ideas enable row level security;
alter table public.votes enable row level security;

-- Remove broad default grants before granting only the operations this app uses.
revoke all on public.ideas from anon, authenticated;
revoke all on public.votes from anon, authenticated;
grant select on public.ideas to anon, authenticated;
grant insert (title, description, author_nickname) on public.ideas to anon, authenticated;
grant insert (idea_id, voter_id) on public.votes to anon, authenticated;

drop policy if exists "Anyone can read ideas" on public.ideas;
create policy "Anyone can read ideas" on public.ideas
  for select to anon, authenticated using (true);

drop policy if exists "Anyone can submit ideas" on public.ideas;
create policy "Anyone can submit ideas" on public.ideas
  for insert to anon, authenticated
  with check (
    vote_count = 0
    and char_length(btrim(title)) between 1 and 100
    and char_length(btrim(description)) between 1 and 1000
    and char_length(btrim(author_nickname)) between 1 and 40
  );

-- There is deliberately no public SELECT, UPDATE, or DELETE policy for votes.
drop policy if exists "Anyone can cast a vote" on public.votes;
create policy "Anyone can cast a vote" on public.votes
  for insert to anon, authenticated
  with check (voter_id is not null and exists (
    select 1 from public.ideas where ideas.id = votes.idea_id
  ));

create or replace function public.add_vote_to_idea()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.ideas set vote_count = vote_count + 1 where id = new.idea_id;
  return new;
end;
$$;

revoke all on function public.add_vote_to_idea() from public, anon, authenticated;

drop trigger if exists votes_increment_idea_count on public.votes;
create trigger votes_increment_idea_count
after insert on public.votes
for each row execute function public.add_vote_to_idea();

-- ============================================================================
--  HISTOIRE — Migration Phase 3
--  Réactions sur souvenirs + Catégories de souvenirs
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABLE DES RÉACTIONS (cœur, emojis sur les souvenirs)
-- ----------------------------------------------------------------------------
create table if not exists public.reactions (
  id           uuid primary key default gen_random_uuid(),
  memory_id    uuid not null references public.memories(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  emoji        text not null default 'heart' check (emoji in ('heart','thumbsup','love','smile','cry','wow')),
  created_at   timestamptz not null default now(),
  unique (memory_id, user_id, emoji)
);

create index if not exists reactions_memory_id_idx on public.reactions(memory_id);
create index if not exists reactions_user_id_idx on public.reactions(user_id);

alter table public.reactions enable row level security;

-- Visible si on peut voir le souvenir
drop policy if exists "reactions_select_visible" on public.reactions;
create policy "reactions_select_visible"
  on public.reactions for select
  using (
    exists (
      select 1 from public.memories m
      where m.id = reactions.memory_id
        and (m.user_id = auth.uid() or m.user_id = public.my_partner_id())
    )
  );

drop policy if exists "reactions_insert_self" on public.reactions;
create policy "reactions_insert_self"
  on public.reactions for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.memories m
      where m.id = reactions.memory_id
        and (m.user_id = auth.uid() or m.user_id = public.my_partner_id())
    )
  );

drop policy if exists "reactions_delete_own" on public.reactions;
create policy "reactions_delete_own"
  on public.reactions for delete
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 2. COLONNE category sur memories
-- ----------------------------------------------------------------------------
alter table public.memories
  add column if not exists category text default 'other' check (category in ('voyage','rencontre','anniversaire','date_night','famille','aventure','other'));

-- ----------------------------------------------------------------------------
-- 3. ENABLE REALTIME sur reactions
-- ----------------------------------------------------------------------------
do $$
begin
  begin
    alter publication supabase_realtime add table public.reactions;
  exception when duplicate_object then null;
  end;
end $$;

-- ============================================================================
--  FIN Phase 3
-- ============================================================================

-- ============================================================================
--  HISTOIRE — Migration Phase 2
--  Messagerie temps réel + Notes d'amour + Anniversaires
--  À exécuter dans Supabase SQL Editor après phase1_themes_couple_photo.sql.
--  Idempotent (safe à re-exécuter).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABLE DES MESSAGES (chat entre partenaires)
-- ----------------------------------------------------------------------------
create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid not null references public.profiles(id) on delete cascade,
  receiver_id  uuid not null references public.profiles(id) on delete cascade,
  text         text not null,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists messages_sender_id_idx on public.messages(sender_id);
create index if not exists messages_receiver_id_idx on public.messages(receiver_id);
create index if not exists messages_created_at_idx on public.messages(created_at desc);

-- RLS : on voit/écrit seulement les messages où on est sender OU receiver
-- ET on ne peut écrire qu'à son partenaire lié
alter table public.messages enable row level security;

drop policy if exists "messages_select_own" on public.messages;
create policy "messages_select_own"
  on public.messages for select
  using (sender_id = auth.uid() or receiver_id = auth.uid());

drop policy if exists "messages_insert_own" on public.messages;
create policy "messages_insert_own"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and receiver_id = public.my_partner_id()
  );

drop policy if exists "messages_update_own" on public.messages;
create policy "messages_update_own"
  on public.messages for update
  using (receiver_id = auth.uid());

drop policy if exists "messages_delete_own" on public.messages;
create policy "messages_delete_own"
  on public.messages for delete
  using (sender_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 2. TABLE DES NOTES D'AMOUR
-- ----------------------------------------------------------------------------
create table if not exists public.love_notes (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid not null references public.profiles(id) on delete cascade,
  receiver_id  uuid not null references public.profiles(id) on delete cascade,
  text         text not null,
  color        text not null default 'rose' check (color in ('rose','peach','lavender','mint','sky','gold')),
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists love_notes_receiver_id_idx on public.love_notes(receiver_id);
create index if not exists love_notes_created_at_idx on public.love_notes(created_at desc);

alter table public.love_notes enable row level security;

drop policy if exists "love_notes_select_own" on public.love_notes;
create policy "love_notes_select_own"
  on public.love_notes for select
  using (sender_id = auth.uid() or receiver_id = auth.uid());

drop policy if exists "love_notes_insert_own" on public.love_notes;
create policy "love_notes_insert_own"
  on public.love_notes for insert
  with check (
    sender_id = auth.uid()
    and receiver_id = public.my_partner_id()
  );

drop policy if exists "love_notes_delete_own" on public.love_notes;
create policy "love_notes_delete_own"
  on public.love_notes for delete
  using (sender_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 3. TABLE DES ANNIVERSAIRES / DATES IMPORTANTES
-- ----------------------------------------------------------------------------
create table if not exists public.anniversaries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  title        text not null,
  date         date not null,
  recurrence   text not null default 'yearly' check (recurrence in ('once','yearly','monthly')),
  icon         text default 'heart',
  created_at   timestamptz not null default now()
);

create index if not exists anniversaries_user_id_idx on public.anniversaries(user_id);
create index if not exists anniversaries_date_idx on public.anniversaries(date);

-- RLS : visible par owner + partenaire (comme memories)
alter table public.anniversaries enable row level security;

drop policy if exists "anniversaries_select_visible" on public.anniversaries;
create policy "anniversaries_select_visible"
  on public.anniversaries for select
  using (
    user_id = auth.uid()
    or user_id = public.my_partner_id()
  );

drop policy if exists "anniversaries_insert_own" on public.anniversaries;
create policy "anniversaries_insert_own"
  on public.anniversaries for insert
  with check (user_id = auth.uid());

drop policy if exists "anniversaries_update_own" on public.anniversaries;
create policy "anniversaries_update_own"
  on public.anniversaries for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "anniversaries_delete_own" on public.anniversaries;
create policy "anniversaries_delete_own"
  on public.anniversaries for delete
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 4. ENABLE REALTIME pour messages + love_notes
-- ----------------------------------------------------------------------------
-- Supabase Realtime doit être activé sur ces tables pour le chat instantané.
-- On le fait via la commande SQL ci-dessous.
do $$
begin
  -- Ajoute les tables au publication realtime (idempotent)
  begin
    alter publication supabase_realtime add table public.messages;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.love_notes;
  exception when duplicate_object then null;
  end;
end $$;

-- ============================================================================
--  FIN Phase 2
-- ============================================================================

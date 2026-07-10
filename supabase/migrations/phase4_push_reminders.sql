-- ============================================================================
--  HISTOIRE — Migration Phase 4
--  Push subscriptions + Rappels de souvenirs
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABLE DES PUSH SUBSCRIPTIONS (notifications push natives)
-- ----------------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  endpoint      text not null,
  p256dh        text not null,
  auth          text not null,
  user_agent    text,
  created_at    timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subs_select_own" on public.push_subscriptions;
create policy "push_subs_select_own"
  on public.push_subscriptions for select
  using (user_id = auth.uid());

drop policy if exists "push_subs_insert_own" on public.push_subscriptions;
create policy "push_subs_insert_own"
  on public.push_subscriptions for insert
  with check (user_id = auth.uid());

drop policy if exists "push_subs_delete_own" on public.push_subscriptions;
create policy "push_subs_delete_own"
  on public.push_subscriptions for delete
  using (user_id = auth.uid());

-- ============================================================================
--  FIN Phase 4
-- ============================================================================

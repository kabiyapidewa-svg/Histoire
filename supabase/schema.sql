-- ============================================================================
--  HISTOIRE — Schéma de base de données Supabase
--  À exécuter une seule fois dans : Supabase Dashboard > SQL Editor > New query
--  Puis "Run". Sans danger à re-exécuter (idempotent).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto";   -- pour gen_random_uuid()

-- ----------------------------------------------------------------------------
-- 2. TABLE DES PROFILS (lié 1-1 à auth.users)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  name        text not null,
  partner_id  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists profiles_partner_id_idx on public.profiles(partner_id);

-- ----------------------------------------------------------------------------
-- 3. TABLE DES SOUVENIRS (memories)
-- ----------------------------------------------------------------------------
create table if not exists public.memories (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  title        text not null,
  description  text default '',
  date         date not null,
  location     text default '',
  recap        text default '',
  created_at   timestamptz not null default now()
);

create index if not exists memories_user_id_idx on public.memories(user_id);
create index if not exists memories_date_idx on public.memories(date desc);

-- ----------------------------------------------------------------------------
-- 4. TABLE DES MÉDIAS (photos + vidéos, un row par fichier)
-- ----------------------------------------------------------------------------
create table if not exists public.media (
  id            uuid primary key default gen_random_uuid(),
  memory_id     uuid not null references public.memories(id) on delete cascade,
  storage_path  text not null,           -- chemin dans le bucket Storage
  url           text not null,           -- URL publique signée ou publique
  type          text not null check (type in ('image','video')),
  created_at    timestamptz not null default now()
);

create index if not exists media_memory_id_idx on public.media(memory_id);

-- ----------------------------------------------------------------------------
-- 5. TABLE DES COMMENTAIRES
-- ----------------------------------------------------------------------------
create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  memory_id   uuid not null references public.memories(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  text        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists comments_memory_id_idx on public.comments(memory_id);

-- ----------------------------------------------------------------------------
-- 6. TABLE DES INVITATIONS PARTENAIRE
-- ----------------------------------------------------------------------------
create table if not exists public.partner_invitations (
  id             uuid primary key default gen_random_uuid(),
  inviter_id     uuid not null references public.profiles(id) on delete cascade,
  invitee_email  text not null,
  status         text not null default 'pending'
                 check (status in ('pending','accepted','rejected','cancelled')),
  created_at     timestamptz not null default now(),
  last_email_sent_at timestamptz,   -- pour le rate-limiting de l'Edge Function
  unique (inviter_id, invitee_email)
);

create index if not exists partner_invitations_invitee_email_idx
  on public.partner_invitations(invitee_email);

-- ----------------------------------------------------------------------------
-- 7. FONCTION : profil auto-créé à l'inscription
--    (déclencheur sur auth.users)
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 8. FONCTION : récupérer l'id du partenaire de l'utilisateur courant
-- ----------------------------------------------------------------------------
create or replace function public.my_partner_id()
returns uuid
language sql
stable
security definer set search_path = public
as $$
  select partner_id from public.profiles where id = auth.uid();
$$;

-- ----------------------------------------------------------------------------
-- 9. POLITIQUES RLS — PROFILES
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_self_or_partner" on public.profiles;
create policy "profiles_select_self_or_partner"
  on public.profiles for select
  using (
    id = auth.uid()
    or id = public.my_partner_id()
  );

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ----------------------------------------------------------------------------
-- 10. POLITIQUES RLS — MEMORIES
--     Règle : on voit ses souvenirs + ceux de son partenaire lié.
--     Écriture (insert/update/delete) : uniquement sur ses propres souvenirs.
-- ----------------------------------------------------------------------------
alter table public.memories enable row level security;

drop policy if exists "memories_select_own_or_partner" on public.memories;
create policy "memories_select_own_or_partner"
  on public.memories for select
  using (
    user_id = auth.uid()
    or user_id = public.my_partner_id()
  );

drop policy if exists "memories_insert_own" on public.memories;
create policy "memories_insert_own"
  on public.memories for insert
  with check (user_id = auth.uid());

drop policy if exists "memories_update_own" on public.memories;
create policy "memories_update_own"
  on public.memories for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "memories_delete_own" on public.memories;
create policy "memories_delete_own"
  on public.memories for delete
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 11. POLITIQUES RLS — MEDIA
--     On lit les médias des souvenirs visibles ; on écrit seulement
--     sur les médias de ses propres souvenirs.
-- ----------------------------------------------------------------------------
alter table public.media enable row level security;

drop policy if exists "media_select_visible" on public.media;
create policy "media_select_visible"
  on public.media for select
  using (
    exists (
      select 1 from public.memories m
      where m.id = media.memory_id
        and (m.user_id = auth.uid() or m.user_id = public.my_partner_id())
    )
  );

drop policy if exists "media_insert_own" on public.media;
create policy "media_insert_own"
  on public.media for insert
  with check (
    exists (
      select 1 from public.memories m
      where m.id = media.memory_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "media_delete_own" on public.media;
create policy "media_delete_own"
  on public.media for delete
  using (
    exists (
      select 1 from public.memories m
      where m.id = media.memory_id and m.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- 12. POLITIQUES RLS — COMMENTS
--     Lecture : commentaires des souvenirs visibles.
--     Écriture : seulement par l'utilisateur connecté, et seulement
--     sur un souvenir qu'il a le droit de voir (le sien ou celui de
--     son partenaire lié). => ferme la faille "n'importe qui peut
--     commenter n'importe quel souvenir".
-- ----------------------------------------------------------------------------
alter table public.comments enable row level security;

drop policy if exists "comments_select_visible" on public.comments;
create policy "comments_select_visible"
  on public.comments for select
  using (
    exists (
      select 1 from public.memories m
      where m.id = comments.memory_id
        and (m.user_id = auth.uid() or m.user_id = public.my_partner_id())
    )
  );

drop policy if exists "comments_insert_self" on public.comments;
create policy "comments_insert_self"
  on public.comments for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.memories m
      where m.id = comments.memory_id
        and (m.user_id = auth.uid() or m.user_id = public.my_partner_id())
    )
  );

drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own"
  on public.comments for delete
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 13. POLITIQUES RLS — PARTNER_INVITATIONS
--     Lecture : mes invitations envoyées + celles reçues (par email).
--     Insert : seulement pour moi-même (inviter_id = auth.uid()).
--     Update : seulement sur une invitation reçue par mon email
--              (pour l'accepter / la refuser).
-- ----------------------------------------------------------------------------
alter table public.partner_invitations enable row level security;

drop policy if exists "invitations_select_own" on public.partner_invitations;
create policy "invitations_select_own"
  on public.partner_invitations for select
  using (
    inviter_id = auth.uid()
    or invitee_email = (
      select email from public.profiles where id = auth.uid()
    )
  );

drop policy if exists "invitations_insert_self" on public.partner_invitations;
create policy "invitations_insert_self"
  on public.partner_invitations for insert
  with check (inviter_id = auth.uid());

drop policy if exists "invitations_update_received" on public.partner_invitations;
create policy "invitations_update_received"
  on public.partner_invitations for update
  using (
    invitee_email = (
      select email from public.profiles where id = auth.uid()
    )
  );

drop policy if exists "invitations_delete_own" on public.partner_invitations;
create policy "invitations_delete_own"
  on public.partner_invitations for delete
  using (inviter_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 14. FONCTION RPC : accepter une invitation + lier les deux comptes
--     (security definer pour pouvoir écrire partner_id sur les 2 profils)
-- ----------------------------------------------------------------------------
create or replace function public.accept_partner_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_inviter_id uuid;
  v_invitee_id uuid;
  v_invitee_email text;
  v_inviter_partner uuid;
begin
  -- Vérifier que l'invitation existe, est pending, et m'est adressée
  select inviter_id, invitee_email
    into v_inviter_id, v_invitee_email
  from public.partner_invitations
  where id = p_invitation_id and status = 'pending';

  if not found then
    raise exception 'Invitation introuvable ou déjà traitée';
  end if;

  -- L'utilisateur courant doit être l'invité
  select id into v_invitee_id from public.profiles
    where id = auth.uid() and email = v_invitee_email;
  if not found then
    raise exception 'Cette invitation ne vous est pas adressée';
  end if;

  -- Refuser si l'inviteur a déjà un partenaire
  select partner_id into v_inviter_partner from public.profiles where id = v_inviter_id;
  if v_inviter_partner is not null then
    raise exception 'Cet utilisateur a déjà un partenaire';
  end if;

  -- Lier les deux comptes
  update public.profiles set partner_id = v_inviter_id where id = v_invitee_id;
  update public.profiles set partner_id = v_invitee_id where id = v_inviter_id;

  -- Marquer l'invitation comme acceptée + annuler les autres pending de ces users
  update public.partner_invitations
    set status = 'accepted'
    where id = p_invitation_id;

  -- Annuler toute autre invitation pending envoyée par l'un ou l'autre
  update public.partner_invitations
    set status = 'cancelled'
    where status = 'pending'
      and (inviter_id in (v_inviter_id, v_invitee_id)
           or invitee_email in (
             select email from public.profiles where id in (v_inviter_id, v_invitee_id)
           ));
end;
$$;

-- ----------------------------------------------------------------------------
-- 15. FONCTION RPC : délier deux partenaires
-- ----------------------------------------------------------------------------
create or replace function public.unlink_partner()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_partner uuid;
begin
  select partner_id into v_partner from public.profiles where id = auth.uid();
  if v_partner is null then
    raise exception 'Aucun partenaire à délier';
  end if;
  update public.profiles set partner_id = null where id = auth.uid();
  update public.profiles set partner_id = null where id = v_partner;
end;
$$;

-- ----------------------------------------------------------------------------
-- 16. BUCKET STORAGE — PRIVÉ (sécurisé par URLs signées)
--     Bucket "memories" PRIVÉ. Les fichiers ne sont accessibles que via
--     des URLs signées générées par le client Supabase (validité 1h).
--     Politique RLS Storage :
--       - SELECT : propriétaire du dossier OU son partenaire lié
--       - INSERT / UPDATE / DELETE : propriétaire du dossier uniquement
--     Le chemin de stockage est toujours `{user_id}/{memory_id}/{filename}`
--     donc le 1er segment identifie le propriétaire.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('memories', 'memories', false)
on conflict (id) do update set public = false;

-- Lecture : propriétaire du dossier OU partenaire lié (via my_partner_id)
drop policy if exists "memories_bucket_read_own_or_partner" on storage.objects;
create policy "memories_bucket_read_own_or_partner"
  on storage.objects for select
  using (
    bucket_id = 'memories'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or (storage.foldername(name))[1] = public.my_partner_id()::text
    )
  );

-- Écriture : seulement dans son propre dossier user_id/...
drop policy if exists "memories_bucket_write_own" on storage.objects;
create policy "memories_bucket_write_own"
  on storage.objects for insert
  with check (
    bucket_id = 'memories'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Update : seulement dans son propre dossier
drop policy if exists "memories_bucket_update_own" on storage.objects;
create policy "memories_bucket_update_own"
  on storage.objects for update
  using (
    bucket_id = 'memories'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Delete : seulement dans son propre dossier
drop policy if exists "memories_bucket_delete_own" on storage.objects;
create policy "memories_bucket_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'memories'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ----------------------------------------------------------------------------
-- 17. FONCTION RPC : suppression de compte (RGPD)
--     Supprime le profil + tous les souvenirs/médias/commentaires de l'utilisateur.
--     La suppression de auth.users doit se faire via Edge Function (service_role).
--     Cette RPC prépare le terrain en vidant les données utilisateur.
-- ----------------------------------------------------------------------------
create or replace function public.purge_my_account()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  -- La cascade on delete cascade supprimera memories, media, comments,
  -- mais on supprime explicitement les fichiers Storage via Edge Function
  -- avant l'appel à cette RPC (sinon fichiers orphelins).
  delete from public.profiles where id = auth.uid();
end;
$$;

-- ============================================================================
--  FIN. Vérifie dans "Table Editor" que les 5 tables existent :
--  profiles, memories, media, comments, partner_invitations.
-- ============================================================================

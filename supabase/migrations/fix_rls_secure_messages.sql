-- ============================================================================
--  HISTOIRE — Fix CRITIQUE de sécurité : réactiver RLS sur messages + love_notes
--
--  Problème : La RLS était désactivée, permettant à n'importe quel utilisateur
--  de lire TOUS les messages et notes de TOUS les couples.
--
--  Solution : Réactiver RLS avec politiques SELECT et DELETE strictes.
--  L'INSERT reste géré par les RPC send_message/send_love_note (security definer).
--  Le Realtime respecte automatiquement la RLS SELECT.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. RÉACTIVER RLS sur messages
-- ----------------------------------------------------------------------------
alter table public.messages enable row level security;

-- SELECT : l'utilisateur ne voit que les messages où il est sender OU receiver
drop policy if exists "messages_select_own" on public.messages;
create policy "messages_select_own"
  on public.messages for select
  using (sender_id = auth.uid() or receiver_id = auth.uid());

-- DELETE : seul l'expéditeur peut supprimer ses propres messages
drop policy if exists "messages_delete_sender_only" on public.messages;
create policy "messages_delete_sender_only"
  on public.messages for delete
  using (sender_id = auth.uid());

-- UPDATE : seul le receiver peut marquer comme lu (update read_at)
drop policy if exists "messages_update_receiver" on public.messages;
create policy "messages_update_receiver"
  on public.messages for update
  using (receiver_id = auth.uid())
  with check (receiver_id = auth.uid());

-- NB: Pas de politique INSERT → l'insertion se fait uniquement via les RPC
-- send_message() et send_love_note() qui sont security definer.

-- ----------------------------------------------------------------------------
-- 2. RÉACTIVER RLS sur love_notes
-- ----------------------------------------------------------------------------
alter table public.love_notes enable row level security;

-- SELECT : l'utilisateur ne voit que les notes où il est sender OU receiver
drop policy if exists "love_notes_select_own" on public.love_notes;
create policy "love_notes_select_own"
  on public.love_notes for select
  using (sender_id = auth.uid() or receiver_id = auth.uid());

-- DELETE : seul l'expéditeur peut supprimer ses propres notes
drop policy if exists "love_notes_delete_sender_only" on public.love_notes;
create policy "love_notes_delete_sender_only"
  on public.love_notes for delete
  using (sender_id = auth.uid());

-- UPDATE : seul le receiver peut marquer comme lu
drop policy if exists "love_notes_update_receiver" on public.love_notes;
create policy "love_notes_update_receiver"
  on public.love_notes for update
  using (receiver_id = auth.uid())
  with check (receiver_id = auth.uid());

-- ============================================================================
--  FIN — La sécurité est maintenant assurée :
--  - INSERT : via RPC security definer (vérifie que receiver = partner_id)
--  - SELECT : RLS filtre par sender_id OU receiver_id = auth.uid()
--  - DELETE : RLS filtre par sender_id = auth.uid()
--  - UPDATE : RLS filtre par receiver_id = auth.uid() (pour read_at)
--  - REALTIME : respecte automatiquement la politique SELECT
-- ============================================================================

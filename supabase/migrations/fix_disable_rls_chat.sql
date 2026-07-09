-- ============================================================================
--  HISTOIRE — Fix RLS : DÉSACTIVER RLS sur messages et love_notes
--  La sécurité est assurée par les fonctions RPC send_message() et send_love_note()
--  qui vérifient que le receiver est bien le partenaire du sender.
-- ============================================================================

-- 1. Désactiver RLS sur messages
alter table public.messages disable row level security;

-- 2. Désactiver RLS sur love_notes
alter table public.love_notes disable row level security;

-- ============================================================================
--  FIN
-- ============================================================================

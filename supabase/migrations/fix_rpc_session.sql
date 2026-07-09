-- ============================================================================
--  HISTOIRE — Fix RPC send_message/send_love_note (gestion session robuste)
-- ============================================================================

create or replace function public.send_message(p_receiver_id uuid, p_text text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_sender_id uuid := auth.uid();
  v_message_id uuid;
  v_partner_id uuid;
begin
  if v_sender_id is null then
    raise exception 'SESSION_EXPIRED: Vous devez être connecté pour envoyer un message';
  end if;
  if p_text is null or trim(p_text) = '' then
    raise exception 'Le message ne peut pas être vide';
  end if;
  select partner_id into v_partner_id from public.profiles where id = v_sender_id;
  if v_partner_id is null or v_partner_id <> p_receiver_id then
    raise exception 'Vous ne pouvez envoyer des messages qu''à votre partenaire';
  end if;
  insert into public.messages (sender_id, receiver_id, text)
  values (v_sender_id, p_receiver_id, p_text)
  returning id into v_message_id;
  return v_message_id;
end;
$$;

create or replace function public.send_love_note(p_receiver_id uuid, p_text text, p_color text default 'rose')
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_sender_id uuid := auth.uid();
  v_note_id uuid;
  v_partner_id uuid;
begin
  if v_sender_id is null then
    raise exception 'SESSION_EXPIRED: Vous devez être connecté pour envoyer une note';
  end if;
  if p_text is null or trim(p_text) = '' then
    raise exception 'La note ne peut pas être vide';
  end if;
  select partner_id into v_partner_id from public.profiles where id = v_sender_id;
  if v_partner_id is null or v_partner_id <> p_receiver_id then
    raise exception 'Vous ne pouvez envoyer des notes qu''à votre partenaire';
  end if;
  insert into public.love_notes (sender_id, receiver_id, text, color)
  values (v_sender_id, p_receiver_id, p_text, p_color)
  returning id into v_note_id;
  return v_note_id;
end;
$$;

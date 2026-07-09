import { supabase } from './supabase';

export type LoveNoteColor = 'rose' | 'peach' | 'lavender' | 'mint' | 'sky' | 'gold';

export interface LoveNote {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  color: LoveNoteColor;
  read_at: string | null;
  created_at: string;
  sender_name?: string;
}

export const LOVE_NOTE_COLORS: Record<LoveNoteColor, { label: string; bg: string; border: string; text: string }> = {
  rose:     { label: 'Rose',     bg: '#FCE7F3', border: '#F9A8D4', text: '#831843' },
  peach:    { label: 'Pêche',    bg: '#FFEDD5', border: '#FDBA74', text: '#7C2D12' },
  lavender: { label: 'Lavande',  bg: '#EDE9FE', border: '#C4B5FD', text: '#4C1D95' },
  mint:     { label: 'Menthe',   bg: '#D1FAE5', border: '#6EE7B7', text: '#064E3B' },
  sky:      { label: 'Ciel',     bg: '#E0F2FE', border: '#7DD3FC', text: '#0C4A6E' },
  gold:     { label: 'Or',       bg: '#FEF3C7', border: '#FCD34D', text: '#78350F' },
};

/** Récupère toutes les notes d'amour entre l'utilisateur et son partenaire. */
export async function fetchLoveNotes(): Promise<LoveNote[]> {
  // Pas de jointure (posait problème RLS).
  const { data, error } = await supabase
    .from('love_notes')
    .select('id, sender_id, receiver_id, text, color, read_at, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    sender_id: row.sender_id,
    receiver_id: row.receiver_id,
    text: row.text,
    color: row.color as LoveNoteColor,
    read_at: row.read_at,
    created_at: row.created_at,
  })) as LoveNote[];
}

/** Envoie une note d'amour au partenaire via RPC (security definer, bypass RLS). */
export async function sendLoveNote(receiverId: string, text: string, color: LoveNoteColor = 'rose'): Promise<LoveNote> {
  // 1. Appel RPC qui insère la note
  const { data: noteId, error: rpcErr } = await supabase
    .rpc('send_love_note', { p_receiver_id: receiverId, p_text: text, p_color: color });
  if (rpcErr) throw rpcErr;

  // 2. Re-fetch la note insérée
  const { data, error } = await supabase
    .from('love_notes')
    .select('id, sender_id, receiver_id, text, color, read_at, created_at')
    .eq('id', noteId)
    .single();
  if (error) throw error;
  const row = data as any;
  return {
    id: row.id,
    sender_id: row.sender_id,
    receiver_id: row.receiver_id,
    text: row.text,
    color: row.color as LoveNoteColor,
    read_at: row.read_at,
    created_at: row.created_at,
  };
}

/** Marque les notes reçues comme lues. */
export async function markLoveNotesAsRead(): Promise<void> {
  const { error } = await supabase
    .from('love_notes')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', 'null')
    .neq('sender_id', (await supabase.auth.getUser()).data.user?.id ?? '');
  if (error) throw error;
}

/** Compte les notes non lues reçues. */
export async function countUnreadLoveNotes(): Promise<number> {
  const { count, error } = await supabase
    .from('love_notes')
    .select('id', { count: 'exact', head: true })
    .is('read_at', 'null')
    .neq('sender_id', (await supabase.auth.getUser()).data.user?.id ?? '');
  if (error) return 0;
  return count ?? 0;
}

/** Supprime une note (uniquement si on est l'expéditeur). */
export async function deleteLoveNote(noteId: string): Promise<void> {
  const { error } = await supabase.from('love_notes').delete().eq('id', noteId);
  if (error) throw error;
}

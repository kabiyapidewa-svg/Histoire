import { supabase } from './supabase';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  read_at: string | null;
  created_at: string;
  sender_name?: string;
}

/** Récupère la conversation entre l'utilisateur courant et son partenaire. */
export async function fetchMessages(): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(name)')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    sender_id: row.sender_id,
    receiver_id: row.receiver_id,
    text: row.text,
    read_at: row.read_at,
    created_at: row.created_at,
    sender_name: row.sender?.name,
  })) as Message[];
}

/** Envoie un message au partenaire. */
export async function sendMessage(receiverId: string, text: string): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ receiver_id: receiverId, text })
    .select('*, sender:profiles!messages_sender_id_fkey(name)')
    .single();
  if (error) throw error;
  const row = data as any;
  return {
    id: row.id,
    sender_id: row.sender_id,
    receiver_id: row.receiver_id,
    text: row.text,
    read_at: row.read_at,
    created_at: row.created_at,
    sender_name: row.sender?.name,
  };
}

/** Marque tous les messages reçus comme lus. */
export async function markMessagesAsRead(): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', 'null')
    .neq('sender_id', (await supabase.auth.getUser()).data.user?.id ?? '');
  if (error) throw error;
}

/** Compte les messages non lus reçus. */
export async function countUnreadMessages(): Promise<number> {
  const { data, error } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .is('read_at', 'null')
    .neq('sender_id', (await supabase.auth.getUser()).data.user?.id ?? '');
  if (error) return 0;
  return data?.length ?? 0;
}

/** Souscrit aux nouveaux messages en temps réel. */
export function subscribeToMessages(callback: (message: Message) => void): () => void {
  const channel = supabase
    .channel('messages-realtime')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        const row = payload.new as any;
        callback({
          id: row.id,
          sender_id: row.sender_id,
          receiver_id: row.receiver_id,
          text: row.text,
          read_at: row.read_at,
          created_at: row.created_at,
        });
      }
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

/** Supprime un message (uniquement si on est l'expéditeur). */
export async function deleteMessage(messageId: string): Promise<void> {
  const { error } = await supabase.from('messages').delete().eq('id', messageId);
  if (error) throw error;
}

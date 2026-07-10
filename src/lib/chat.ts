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
  // Pas de jointure (posait problème RLS). On récupère juste les messages.
  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_id, receiver_id, text, read_at, created_at')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    sender_id: row.sender_id,
    receiver_id: row.receiver_id,
    text: row.text,
    read_at: row.read_at,
    created_at: row.created_at,
  })) as Message[];
}

/** Envoie un message au partenaire via RPC (security definer, bypass RLS). */
export async function sendMessage(receiverId: string, text: string): Promise<Message> {
  // 0. Vérifier que la session est valide avant l'envoi (fix session PC)
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
    }
  }

  // 1. Appel RPC qui insère le message (security definer = bypass RLS)
  const { data: msgId, error: rpcErr } = await supabase
    .rpc('send_message', { p_receiver_id: receiverId, p_text: text });
  if (rpcErr) {
    if (rpcErr.message?.includes('SESSION_EXPIRED')) {
      throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
    }
    throw rpcErr;
  }

  // 2. Re-fetch le message inséré
  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_id, receiver_id, text, read_at, created_at')
    .eq('id', msgId)
    .single();
  if (error) throw error;
  const row = data as any;
  const message = {
    id: row.id,
    sender_id: row.sender_id,
    receiver_id: row.receiver_id,
    text: row.text,
    read_at: row.read_at,
    created_at: row.created_at,
  };

  // 3. ENVOI DE LA NOTIFICATION PUSH au destinataire (fire-and-forget)
  //    On ne bloque pas l'envoi du message si la push échoue.
  supabase.functions.invoke('send-push-notification', {
    body: {
      target_user_id: receiverId,
      title: 'Nouveau message',
      body: text.length > 60 ? text.slice(0, 60) + '...' : text,
      url: '/chat',
    },
  }).catch(() => {
    // Silencieux : la push est optionnelle (le destinataire peut ne pas être souscrit)
  });

  return message;
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

// ----------------------------------------------------------------------------
// INDICATEUR "EN TRAIN D'ÉCRIRE" (typing indicator via Supabase Realtime presence)
// ----------------------------------------------------------------------------

/**
 * Crée un canal de présence pour le typing indicator.
 * L'appelant peut notifier qu'il est en train d'écrire, et écouter si le partenaire écrit.
 */
export function createTypingChannel(opts: {
  userId: string;
  partnerId: string;
  onPartnerTyping: (isTyping: boolean) => void;
}): { setTyping: (isTyping: boolean) => void; cleanup: () => void } {
  const channel = supabase.channel(`typing-${[opts.userId, opts.partnerId].sort().join('-')}`, {
    config: { presence: { key: opts.userId } },
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      // Si le partenaire est présent dans le channel = il est en train d'écrire
      const partnerPresent = Boolean(state[opts.partnerId]);
      opts.onPartnerTyping(partnerPresent);
    })
    .subscribe();

  const setTyping = (isTyping: boolean) => {
    if (isTyping) {
      channel.track({ user_id: opts.userId, typing: true });
    } else {
      channel.untrack();
    }
  };

  const cleanup = () => {
    channel.untrack();
    supabase.removeChannel(channel);
  };

  return { setTyping, cleanup };
}

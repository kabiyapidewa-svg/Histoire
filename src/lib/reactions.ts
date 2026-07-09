import { supabase } from './supabase';

export type ReactionEmoji = 'heart' | 'thumbsup' | 'love' | 'smile' | 'cry' | 'wow';

export const REACTION_EMOJIS: Record<ReactionEmoji, string> = {
  heart: '❤️',
  thumbsup: '👍',
  love: '😍',
  smile: '😊',
  cry: '😢',
  wow: '😮',
};

export interface Reaction {
  id: string;
  memory_id: string;
  user_id: string;
  emoji: ReactionEmoji;
  created_at: string;
}

export async function fetchReactions(memoryId: string): Promise<Reaction[]> {
  const { data, error } = await supabase
    .from('reactions')
    .select('id, memory_id, user_id, emoji, created_at')
    .eq('memory_id', memoryId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Reaction[];
}

export async function toggleReaction(memoryId: string, emoji: ReactionEmoji): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Non connecté');

  // Check si la réaction existe déjà
  const { data: existing } = await supabase
    .from('reactions')
    .select('id')
    .eq('memory_id', memoryId)
    .eq('user_id', user.user.id)
    .eq('emoji', emoji)
    .maybeSingle();

  if (existing) {
    // Supprime
    const { error } = await supabase.from('reactions').delete().eq('id', existing.id);
    if (error) throw error;
  } else {
    // Insère
    const { error } = await supabase.from('reactions').insert({
      memory_id: memoryId,
      user_id: user.user.id,
      emoji,
    });
    if (error) throw error;
  }
}

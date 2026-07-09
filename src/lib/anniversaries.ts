import { supabase } from './supabase';

export type AnniversaryRecurrence = 'once' | 'yearly' | 'monthly';

export interface Anniversary {
  id: string;
  user_id: string;
  title: string;
  date: string;            // ISO date
  recurrence: AnniversaryRecurrence;
  icon: string;
  created_at: string;
  owner_name?: string;
}

export const ANNIVERSARY_ICONS = ['heart', 'star', 'cake', 'ring', 'plane', 'gift', 'home', 'baby'] as const;
export type AnniversaryIcon = typeof ANNIVERSARY_ICONS[number];

export const RECURRENCE_LABELS: Record<AnniversaryRecurrence, string> = {
  once: 'Une fois',
  yearly: 'Tous les ans',
  monthly: 'Tous les mois',
};

/** Récupère les anniversaires de l'utilisateur + son partenaire. */
export async function fetchAnniversaries(): Promise<Anniversary[]> {
  const { data, error } = await supabase
    .from('anniversaries')
    .select('*, owner:profiles!anniversaries_user_id_fkey(name)')
    .order('date', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    date: row.date,
    recurrence: row.recurrence as AnniversaryRecurrence,
    icon: row.icon,
    created_at: row.created_at,
    owner_name: row.owner?.name,
  })) as Anniversary[];
}

export async function createAnniversary(input: {
  user_id: string;
  title: string;
  date: string;
  recurrence: AnniversaryRecurrence;
  icon: string;
}): Promise<Anniversary> {
  const { data, error } = await supabase
    .from('anniversaries')
    .insert(input)
    .select('*')
    .single();
  if (error) throw error;
  return data as Anniversary;
}

export async function deleteAnniversary(id: string): Promise<void> {
  const { error } = await supabase.from('anniversaries').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Calcule la prochaine occurrence d'un anniversaire + le nombre de jours restants.
 */
export function getNextOccurrence(anniversary: Anniversary): { date: Date; daysLeft: number; isToday: boolean } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const annivDate = new Date(anniversary.date);
  annivDate.setHours(0, 0, 0, 0);

  if (anniversary.recurrence === 'once') {
    const diff = Math.round((annivDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return { date: annivDate, daysLeft: diff, isToday: diff === 0 };
  }

  if (anniversary.recurrence === 'monthly') {
    // Prochain jour du mois identique
    let next = new Date(today.getFullYear(), today.getMonth(), annivDate.getDate());
    if (next < today) {
      next = new Date(today.getFullYear(), today.getMonth() + 1, annivDate.getDate());
    }
    const diff = Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return { date: next, daysLeft: diff, isToday: diff === 0 };
  }

  // yearly : prochaine date anniversaire
  let next = new Date(today.getFullYear(), annivDate.getMonth(), annivDate.getDate());
  if (next < today) {
    next = new Date(today.getFullYear() + 1, annivDate.getMonth(), annivDate.getDate());
  }
  const diff = Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return { date: next, daysLeft: diff, isToday: diff === 0 };
}

/** Formatte un countdown en texte lisible. */
export function formatCountdown(daysLeft: number): string {
  if (daysLeft === 0) return "Aujourd'hui ! 🎉";
  if (daysLeft === 1) return "Demain !";
  if (daysLeft < 7) return `Dans ${daysLeft} jours`;
  if (daysLeft < 30) return `Dans ${Math.floor(daysLeft / 7)} semaine${Math.floor(daysLeft / 7) > 1 ? 's' : ''}`;
  if (daysLeft < 365) return `Dans ${Math.floor(daysLeft / 30)} mois`;
  return `Dans ${Math.floor(daysLeft / 365)} an${Math.floor(daysLeft / 365) > 1 ? 's' : ''}`;
}

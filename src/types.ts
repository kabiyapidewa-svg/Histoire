export type ThemeName = 'rose' | 'ocean' | 'forest' | 'sunset' | 'noir' | 'nuit';

export interface Profile {
  id: string;
  email: string;
  name: string;
  partner_id: string | null;
  created_at: string;
  theme?: ThemeName;
  couple_photo_path?: string | null;
}

export type MediaType = 'image' | 'video';

export type MemoryCategory = 'voyage' | 'rencontre' | 'anniversaire' | 'date_night' | 'famille' | 'aventure' | 'other';

export const MEMORY_CATEGORIES: { value: MemoryCategory; label: string; emoji: string }[] = [
  { value: 'voyage', label: 'Voyage', emoji: '✈️' },
  { value: 'rencontre', label: 'Rencontre', emoji: '💕' },
  { value: 'anniversaire', label: 'Anniversaire', emoji: '🎂' },
  { value: 'date_night', label: 'Date night', emoji: '🌹' },
  { value: 'famille', label: 'Famille', emoji: '👨‍👩‍👧' },
  { value: 'aventure', label: 'Aventure', emoji: '🏔️' },
  { value: 'other', label: 'Autre', emoji: '📸' },
];

export interface Memory {
  id: string;
  user_id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  recap: string;
  category?: MemoryCategory;
  created_at: string;
  media?: MediaItem[];
  comments?: Comment[];
}

export interface MediaItem {
  id: string;
  memory_id: string;
  storage_path: string;
  url: string;
  type: MediaType;
  created_at: string;
}

export interface Comment {
  id: string;
  memory_id: string;
  user_id: string;
  text: string;
  created_at: string;
  author_name?: string;
}

export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface PartnerInvitation {
  id: string;
  inviter_id: string;
  invitee_email: string;
  status: InvitationStatus;
  created_at: string;
  inviter_name?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  partner_id?: string | null;
}

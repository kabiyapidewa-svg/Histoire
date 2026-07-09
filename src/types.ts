export type ThemeName = 'rose' | 'ocean' | 'forest' | 'sunset' | 'noir';

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

export interface Memory {
  id: string;
  user_id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  recap: string;
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

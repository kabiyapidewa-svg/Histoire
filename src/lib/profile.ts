import { supabase } from './supabase';
import type { ThemeName } from '../types';

export async function updateUserTheme(userId: string, theme: ThemeName): Promise<void> {
  const { error } = await supabase.from('profiles').update({ theme }).eq('id', userId);
  if (error) throw error;
}

export async function uploadCouplePhoto(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const storagePath = `${userId}/couple-photo-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage.from('couple-photos').upload(storagePath, file, { cacheControl: '3600', upsert: false, contentType: file.type });
  if (upErr) throw upErr;
  const { error: dbErr } = await supabase.from('profiles').update({ couple_photo_path: storagePath }).eq('id', userId);
  if (dbErr) throw dbErr;
  return storagePath;
}

export async function getCouplePhotoUrl(storagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from('couple-photos').createSignedUrl(storagePath, 3600);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function deleteCouplePhoto(userId: string, storagePath: string): Promise<void> {
  const { error: storageErr } = await supabase.storage.from('couple-photos').remove([storagePath]);
  if (storageErr) console.warn('[couple-photo] storage delete failed:', storageErr.message);
  const { error: dbErr } = await supabase.from('profiles').update({ couple_photo_path: null }).eq('id', userId);
  if (dbErr) throw dbErr;
}

export async function updateProfileName(userId: string, newName: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ name: newName }).eq('id', userId);
  if (error) throw error;
}

import { supabase } from './supabase';
import type { MediaItem } from '../types';

// Durée de validité des URLs signées (1h)
const SIGNED_URL_EXPIRY = 3600;

/**
 * Génère une URL signée pour un chemin de stockage donné.
 * À utiliser pour les médias principaux (grande taille).
 */
export async function getSignedUrl(storagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('memories')
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY);
  if (error || !data?.signedUrl) {
    // eslint-disable-next-line no-console
    console.warn('[storage] getSignedUrl error:', error?.message);
    return null;
  }
  return data.signedUrl;
}

/**
 * Génère une URL signée pour une VERSION REDIMENSIONNÉE d'une image
 * (thumbnails pour les miniatures du Dashboard).
 * Supabase supporte les transforms d'images côté serveur.
 * Pour les vidéos, on ne redimensionne pas — on renvoie l'URL signée brute.
 */
export async function getSignedThumbUrl(
  storagePath: string,
  width = 400
): Promise<string | null> {
  // Si le chemin semble être une vidéo (extension), pas de transform
  if (isVideoPath(storagePath)) {
    return getSignedUrl(storagePath);
  }
  const { data, error } = await supabase.storage
    .from('memories')
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY, {
      transform: { width, resize: 'cover' },
    });
  if (error || !data?.signedUrl) {
    return getSignedUrl(storagePath);  // fallback sans transform
  }
  return data.signedUrl;
}

/**
 * Pour un tableau de MediaItem, remplace le champ `url` par une URL signée.
 * Les URLs signées expirent après 1h, donc à appeler à chaque fetch.
 */
export async function attachSignedUrls(
  items: MediaItem[],
  thumbWidth?: number
): Promise<MediaItem[]> {
  const result = await Promise.all(
    items.map(async item => ({
      ...item,
      url: thumbWidth
        ? (await getSignedThumbUrl(item.storage_path, thumbWidth)) ?? item.url
        : (await getSignedUrl(item.storage_path)) ?? item.url,
    }))
  );
  return result;
}

function isVideoPath(path: string): boolean {
  return /\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(path);
}

import { supabase } from './supabase';
import type { MediaItem } from '../types';

// Durée de validité des URLs signées (1h)
const SIGNED_URL_EXPIRY = 3600;

// Cache des URLs signées avec timestamp d'expiration
// Pour éviter de régénérer les URLs à chaque render et permettre le refresh auto
const urlCache = new Map<string, { url: string; expiresAt: number }>();

/** Vérifie si une URL en cache est encore valide. */
function isCacheValid(path: string): boolean {
  const entry = urlCache.get(path);
  if (!entry) return false;
  // On considère l'URL invalide 5 min avant son expiration réelle (marge de sécurité)
  return Date.now() < entry.expiresAt - 5 * 60 * 1000;
}

/** Récupère une URL du cache ou null. */
function getCachedUrl(path: string): string | null {
  if (isCacheValid(path)) return urlCache.get(path)!.url;
  return null;
}

/** Stocke une URL dans le cache. */
function setCachedUrl(path: string, url: string): void {
  urlCache.set(path, { url, expiresAt: Date.now() + SIGNED_URL_EXPIRY * 1000 });
}

/**
 * Génère une URL signée pour un chemin de stockage donné.
 * À utiliser pour les médias principaux (grande taille).
 */
export async function getSignedUrl(storagePath: string): Promise<string | null> {
  // Vérifie le cache d'abord
  const cached = getCachedUrl(storagePath);
  if (cached) return cached;

  const { data, error } = await supabase.storage
    .from('memories')
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY);
  if (error || !data?.signedUrl) {
    console.warn('[storage] getSignedUrl error:', error?.message);
    return null;
  }
  setCachedUrl(storagePath, data.signedUrl);
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
  // Cache key inclut la width pour différencier thumb vs full
  const cacheKey = `${storagePath}__w${width}`;
  const cached = getCachedUrl(cacheKey);
  if (cached) return cached;

  if (isVideoPath(storagePath)) {
    return getSignedUrl(storagePath);
  }
  const { data, error } = await supabase.storage
    .from('memories')
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY, {
      transform: { width, resize: 'cover' },
    });
  if (error || !data?.signedUrl) {
    return getSignedUrl(storagePath);
  }
  setCachedUrl(cacheKey, data.signedUrl);
  return data.signedUrl;
}

/**
 * Invalide le cache pour un chemin donné (utile après suppression).
 */
export function invalidateUrlCache(storagePath: string): void {
  // Supprime toutes les variantes (thumb + full) de ce path
  for (const key of urlCache.keys()) {
    if (key.startsWith(storagePath)) urlCache.delete(key);
  }
}

/**
 * Hook: rafraîchit automatiquement les URLs signées avant qu'elles n'expirent.
 * À appeler dans un useEffect avec un intervalle de 50 minutes.
 */
export function startUrlRefreshTimer(callback: () => void): () => void {
  // 50 minutes = avant les 55 min de marge du cache
  const interval = setInterval(() => {
    // Invalide tout le cache pour forcer la régénération au prochain accès
    urlCache.clear();
    callback();
  }, 50 * 60 * 1000);
  return () => clearInterval(interval);
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

import { supabase } from './supabase';
import { attachSignedUrls, getSignedUrl } from './storage';
import { validateFiles, stripExif, detectMediaType } from './image';
import type { Memory, MediaItem, Comment } from '../types';

const PAGE_SIZE = 20;

// ----------------------------------------------------------------------------
// LECTURE
// ----------------------------------------------------------------------------

export async function fetchMemoriesForCurrentUser(page = 0): Promise<{ memories: Memory[]; hasMore: boolean }> {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE;

  const { data, error } = await supabase
    .from('memories')
    .select('*', { count: 'exact' })
    .order('date', { ascending: false })
    .range(from, to);
  if (error) throw error;

  const allRows = (data ?? []) as Memory[];
  const hasMore = allRows.length > PAGE_SIZE;
  const memories = allRows.slice(0, PAGE_SIZE);
  if (memories.length === 0) return { memories: [], hasMore: false };

  const memoryIds = memories.map(m => m.id);

  // Récupération média + commentaires en mode résilient (offline-friendly)
  // Si une des requêtes échoue (réseau coupé), on continue quand même avec les données qu'on a
  const [mediaRes, commentsRes] = await Promise.allSettled([
    supabase.from('media').select('*').in('memory_id', memoryIds).order('created_at', { ascending: true }),
    supabase.from('comments')
      .select('*, profiles!comments_user_id_fkey(name)')
      .in('memory_id', memoryIds)
      .order('created_at', { ascending: true }),
  ]);

  const mediaByMemory = new Map<string, MediaItem[]>();
  if (mediaRes.status === 'fulfilled' && mediaRes.value.data) {
    await Promise.all((mediaRes.value.data ?? []).map(async (row: any) => {
      const arr = mediaByMemory.get(row.memory_id) ?? [];
      // Pour le dashboard, on génère une URL signée en thumbnail (400px) pour économiser la BP
      const signedUrl = await getSignedThumb(row.storage_path, row.type);
      arr.push({ ...row, url: signedUrl ?? row.url } as MediaItem);
      mediaByMemory.set(row.memory_id, arr);
    }));
  }

  const commentsByMemory = new Map<string, Comment[]>();
  if (commentsRes.status === 'fulfilled' && commentsRes.value.data) {
    (commentsRes.value.data ?? []).forEach((row: any) => {
      const arr = commentsByMemory.get(row.memory_id) ?? [];
      arr.push({
        id: row.id,
        memory_id: row.memory_id,
        user_id: row.user_id,
        text: row.text,
        created_at: row.created_at,
        author_name: row.profiles?.name,
      } as Comment);
      commentsByMemory.set(row.memory_id, arr);
    });
  }

  return {
    memories: memories.map(m => ({
      ...m,
      media: mediaByMemory.get(m.id) ?? [],
      comments: commentsByMemory.get(m.id) ?? [],
    })),
    hasMore,
  };
}

async function getSignedThumb(storagePath: string, type: string): Promise<string | null> {
  if (type === 'video') {
    return getSignedUrl(storagePath);
  }
  const { data, error } = await supabase.storage
    .from('memories')
    .createSignedUrl(storagePath, 3600, { transform: { width: 400, resize: 'cover' } });
  if (error || !data?.signedUrl) {
    return getSignedUrl(storagePath);
  }
  return data.signedUrl;
}

export async function fetchMemoryById(id: string): Promise<Memory | null> {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const memory = data as Memory;
  const [mediaRes, commentsRes] = await Promise.all([
    supabase.from('media').select('*').eq('memory_id', id).order('created_at', { ascending: true }),
    supabase.from('comments')
      .select('*, profiles!comments_user_id_fkey(name)')
      .eq('memory_id', id)
      .order('created_at', { ascending: true }),
  ]);
  if (mediaRes.error) throw mediaRes.error;
  if (commentsRes.error) throw commentsRes.error;

  // Pour la page de détail : URLs signées pleine résolution
  const mediaWithUrls = await attachSignedUrls((mediaRes.data ?? []) as MediaItem[]);

  return {
    ...memory,
    media: mediaWithUrls,
    comments: (commentsRes.data ?? []).map((row: any) => ({
      id: row.id,
      memory_id: row.memory_id,
      user_id: row.user_id,
      text: row.text,
      created_at: row.created_at,
      author_name: row.profiles?.name,
    })) as Comment[],
  };
}

// ----------------------------------------------------------------------------
// ÉCRITURE — MEMORIES
// ----------------------------------------------------------------------------

export interface CreateMemoryInput {
  user_id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  category?: string;
}

export function validateMemoryDate(dateStr: string): string | null {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Date invalide';
  const now = new Date();
  const inFuture = d.getTime() > now.getTime() + 24 * 3600 * 1000;  // tolérance 24h
  if (inFuture) return 'La date ne peut pas être dans le futur';
  return null;
}

export async function createMemory(input: CreateMemoryInput): Promise<Memory> {
  const dateErr = validateMemoryDate(input.date);
  if (dateErr) throw new Error(dateErr);

  const { data, error } = await supabase
    .from('memories')
    .insert({
      user_id: input.user_id,
      title: input.title,
      description: input.description,
      date: input.date,
      location: input.location,
      recap: '',
      category: input.category || 'other',
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Memory;
}

export async function updateMemory(memoryId: string, patch: Partial<Pick<Memory, 'title' | 'description' | 'date' | 'location' | 'recap' | 'category'>>): Promise<void> {
  if (patch.date) {
    const dateErr = validateMemoryDate(patch.date);
    if (dateErr) throw new Error(dateErr);
  }
  const { error } = await supabase.from('memories').update(patch).eq('id', memoryId);
  if (error) throw error;
}

export async function updateMemoryRecap(memoryId: string, recap: string): Promise<void> {
  const { error } = await supabase
    .from('memories')
    .update({ recap })
    .eq('id', memoryId);
  if (error) throw error;
}

export async function deleteMemory(memoryId: string): Promise<void> {
  // 1. Liste les médias pour nettoyer Storage
  const { data: mediaRows, error: mediaErr } = await supabase
    .from('media')
    .select('storage_path')
    .eq('memory_id', memoryId);
  if (mediaErr) throw mediaErr;

  if (mediaRows && mediaRows.length > 0) {
    const paths = mediaRows.map(r => r.storage_path);
    const { error: delErr } = await supabase.storage.from('memories').remove(paths);
    if (delErr) {
      // eslint-disable-next-line no-console
      console.warn('[storage] suppression des médias échouée:', delErr.message);
    }
  }

  // 2. La cascade SQL supprime media + comments automatiquement.
  const { error } = await supabase.from('memories').delete().eq('id', memoryId);
  if (error) throw error;
}

// ----------------------------------------------------------------------------
// ÉCRITURE — MEDIA (upload + suppression réelle du Storage)
// ----------------------------------------------------------------------------

export interface UploadProgress {
  fileName: string;
  loaded: number;
  total: number;
  percent: number;
  current: number;
  totalFiles: number;
}

export async function uploadMedia(
  memoryId: string,
  userId: string,
  files: File[],
  onProgress?: (p: UploadProgress) => void
): Promise<MediaItem[]> {
  // 1. Valider tous les fichiers (taille, nombre, type)
  const validation = validateFiles(files);
  if (!validation.ok) throw new Error(validation.error || 'Fichier invalide');

  // 2. Pour chaque fichier : strip EXIF (images) → upload → insert en base
  const created: MediaItem[] = [];

  for (let i = 0; i < files.length; i++) {
    const originalFile = files[i];
    const file = await stripExif(originalFile);   // no-op pour les vidéos
    const type = detectMediaType(file);

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${userId}/${memoryId}/${Date.now()}-${safeName}`;

    // Upload avec progress callback (XHR-based via Supabase JS)
    if (onProgress) {
      onProgress({
        fileName: file.name,
        loaded: 0,
        total: file.size,
        percent: 0,
        current: i + 1,
        totalFiles: files.length,
      });
    }

    const { error: upErr } = await supabase.storage
      .from('memories')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });
    if (upErr) throw upErr;

    if (onProgress) {
      onProgress({
        fileName: file.name,
        loaded: file.size,
        total: file.size,
        percent: 100,
        current: i + 1,
        totalFiles: files.length,
      });
    }

    // On stocke le storage_path. L'URL signée sera générée à la lecture.
    const { data, error: dbErr } = await supabase
      .from('media')
      .insert({
        memory_id: memoryId,
        storage_path: storagePath,
        url: '',  // on n'utilise plus d'URL publique (bucket privé)
        type,
      })
      .select('*')
      .single();
    if (dbErr) throw dbErr;

    // On attache une URL signée pour pouvoir l'afficher immédiatement
    const signedUrl = type === 'video'
      ? await getSignedUrl(storagePath)
      : await getSignedThumb(storagePath, type);
    created.push({ ...(data as MediaItem), url: signedUrl ?? '' });
  }

  return created;
}

export async function deleteMediaItem(media: MediaItem): Promise<void> {
  // 1. Supprime la ligne en base (RLS vérifie que la memory appartient au user)
  const { error: dbErr } = await supabase.from('media').delete().eq('id', media.id);
  if (dbErr) throw dbErr;

  // 2. Supprime le fichier du Storage (évite les orphelins)
  const { error: storageErr } = await supabase.storage
    .from('memories')
    .remove([media.storage_path]);
  if (storageErr) {
    // eslint-disable-next-line no-console
    console.warn('[storage] fichier non supprimé:', storageErr.message);
  }
}

// ----------------------------------------------------------------------------
// ÉCRITURE — COMMENTS
// ----------------------------------------------------------------------------

export async function addComment(
  memoryId: string,
  userId: string,
  text: string
): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .insert({ memory_id: memoryId, user_id: userId, text })
    .select('*, profiles!comments_user_id_fkey(name)')
    .single();
  if (error) throw error;

  const row = data as any;
  return {
    id: row.id,
    memory_id: row.memory_id,
    user_id: row.user_id,
    text: row.text,
    created_at: row.created_at,
    author_name: row.profiles?.name,
  } as Comment;
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase.from('comments').delete().eq('id', commentId);
  if (error) throw error;
}

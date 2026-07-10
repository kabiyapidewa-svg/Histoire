// Utilitaires de traitement d'images côté client :
// - validation de la taille des fichiers
// - stripping EXIF (GPS, métadonnées) via canvas
// - génération de preview URL
// - resize pour économiser la bande passante

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;   // 10 MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024;  // 100 MB
export const MAX_FILES_PER_MEMORY = 20;
export const MAX_TOTAL_SIZE = 200 * 1024 * 1024;  // 200 MB par souvenir

export interface FileValidationResult {
  ok: boolean;
  error?: string;
}

export function detectMediaType(file: File): 'image' | 'video' {
  return file.type.startsWith('video/') ? 'video' : 'image';
}

/** Valide la taille et le type d'un fichier avant upload. */
export function validateFile(file: File): FileValidationResult {
  const type = detectMediaType(file);
  if (type === 'image' && file.size > MAX_IMAGE_SIZE) {
    return { ok: false, error: `Image trop volumineuse (max ${MAX_IMAGE_SIZE / 1024 / 1024} Mo) : ${file.name}` };
  }
  if (type === 'video' && file.size > MAX_VIDEO_SIZE) {
    return { ok: false, error: `Vidéo trop volumineuse (max ${MAX_VIDEO_SIZE / 1024 / 1024} Mo) : ${file.name}` };
  }
  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    return { ok: false, error: `Type de fichier non supporté : ${file.name}` };
  }
  return { ok: true };
}

/** Valide un ensemble de fichiers (taille individuelle + nombre total + taille totale). */
export function validateFiles(files: File[]): FileValidationResult {
  if (files.length > MAX_FILES_PER_MEMORY) {
    return { ok: false, error: `Trop de fichiers (max ${MAX_FILES_PER_MEMORY} par souvenir)` };
  }
  let totalSize = 0;
  for (const f of files) {
    const r = validateFile(f);
    if (!r.ok) return r;
    totalSize += f.size;
  }
  if (totalSize > MAX_TOTAL_SIZE) {
    return { ok: false, error: `Volume total trop important (max ${MAX_TOTAL_SIZE / 1024 / 1024} Mo par souvenir)` };
  }
  return { ok: true };
}

/**
 * Strip les métadonnées EXIF (GPS notamment) d'une image en la ré-encodant
 * via canvas. Pour les vidéos, on ne fait rien (les vidéos n'ont généralement
 * pas de GPS EXIF).
 *
 * Retourne un nouveau File, ou le File original si le traitement échoue
 * (pour ne pas bloquer l'upload).
 */
export async function stripExif(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (file.type === 'image/gif' || file.type === 'image/png') {
    return file;
  }

  try {
    const bitmap = await loadImageBitmap(file);

    // Compression + resize : cap à 1920px max, qualité 0.82
    const MAX_DIM = 1920;
    let w = bitmap.width;
    let h = bitmap.height;
    if (w > MAX_DIM || h > MAX_DIM) {
      const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob: Blob | null = await new Promise(resolve =>
      canvas.toBlob(resolve, 'image/jpeg', 0.82)
    );
    if (!blob) return file;
    const newName = file.name.replace(/\.(heic|heif|webp|bmp|tiff?)$/i, '.jpg') + '';
    return new File([blob], newName, { type: 'image/jpeg', lastModified: Date.now() });
  } catch (e) {
    console.warn('[stripExif] fallback to original:', e);
    return file;
  }
}

/** Wrapper robuste autour de createImageBitmap avec fallback sur <img>. */
function loadImageBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file);
  }
  // Fallback (Safari ancien)
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/** Génère une URL de preview locale (pour afficher avant upload). */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/** Formate une taille de fichier en Mo. */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

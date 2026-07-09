import { useState } from 'react';
import { ImageIcon, Film, AlertCircle } from 'lucide-react';
import type { MediaItem } from '../types';

interface Props {
  media: MediaItem | undefined;
  url?: string;
  type?: 'image' | 'video';
  alt?: string;
  className?: string;
  // Pour les miniatures on peut vouloir un comportement différent
  thumbnail?: boolean;
}

/**
 * Affiche une image ou une vidéo selon le type de média.
 * Si l'URL est absente/cassée, affiche un placeholder propre.
 */
export default function MediaViewer({
  media,
  url,
  type,
  alt = '',
  className = '',
  thumbnail = false,
}: Props) {
  const [errored, setErrored] = useState(false);

  const finalUrl = url ?? media?.url;
  const finalType = type ?? media?.type ?? 'image';

  if (!finalUrl || errored) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gray-100 text-gray-400 ${className}`}
      >
        <AlertCircle className={thumbnail ? 'w-5 h-5' : 'w-10 h-10 mb-2'} />
        {!thumbnail && <p className="text-sm">Média indisponible</p>}
      </div>
    );
  }

  if (finalType === 'video') {
    return (
      <video
        src={finalUrl}
        controls={!thumbnail}
        muted={thumbnail}
        playsInline
        preload="metadata"
        onError={() => setErrored(true)}
        className={className}
        aria-label={alt}
      />
    );
  }

  return (
    <img
      src={finalUrl}
      alt={alt}
      loading="lazy"
      onError={() => setErrored(true)}
      className={className}
    />
  );
}

/** Petite pastille indiquant le type (image vs vidéo) — utile en overlay */
export function MediaTypeBadge({ type }: { type: 'image' | 'video' }) {
  if (type === 'video') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-black/60 text-white text-xs rounded-full">
        <Film className="w-3 h-3" /> Vidéo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-black/60 text-white text-xs rounded-full">
      <ImageIcon className="w-3 h-3" /> Photo
    </span>
  );
}

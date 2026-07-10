import { useState, useRef } from 'react';
import { ImageIcon, Film, AlertCircle, Play } from 'lucide-react';
import type { MediaItem } from '../types';

interface Props {
  media: MediaItem | undefined;
  url?: string;
  type?: 'image' | 'video';
  alt?: string;
  className?: string;
  thumbnail?: boolean;
}

export default function MediaViewer({
  media,
  url,
  type,
  alt = '',
  className = '',
  thumbnail = false,
}: Props) {
  const [errored, setErrored] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const finalUrl = url ?? media?.url;
  const finalType = type ?? media?.type ?? 'image';

  if (!finalUrl || errored) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-100 text-gray-400 ${className}`}>
        <AlertCircle className={thumbnail ? 'w-5 h-5' : 'w-10 h-10 mb-2'} />
        {!thumbnail && <p className="text-sm">Média indisponible</p>}
      </div>
    );
  }

  if (finalType === 'video') {
    return (
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          src={finalUrl}
          controls={!thumbnail}
          muted={thumbnail}
          playsInline
          preload="auto"
          onError={() => setErrored(true)}
          className={className}
          aria-label={alt}
        />
        {/* Bouton play overlay pour les vidéos en miniature (dashboard grid) */}
        {thumbnail && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Play className="w-6 h-6 text-white ml-1" fill="currentColor" />
            </div>
          </div>
        )}
      </div>
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

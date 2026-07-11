import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Play, Pause, Calendar, MapPin } from 'lucide-react';
import MediaViewer from './MediaViewer';
import type { Memory } from '../types';

interface Props {
  memories: Memory[];
  onClose: () => void;
}

export default function Slideshow({ memories, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const next = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % memories.length);
  }, [memories.length]);

  const prev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + memories.length) % memories.length);
  }, [memories.length]);

  // Auto-play : 5 secondes par souvenir
  useEffect(() => {
    if (!isPlaying || memories.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [isPlaying, next, memories.length]);

  // Navigation clavier
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === ' ') { e.preventDefault(); setIsPlaying(p => !p); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onClose]);

  if (memories.length === 0) return null;

  const memory = memories[currentIndex];
  const allMedia = memory.media ?? [];
  const firstMedia = allMedia[0];

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="fixed inset-0 bg-black z-[200] flex flex-col">
      {/* Barre du haut */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
        <div className="text-white">
          <p className="text-sm opacity-75">{currentIndex + 1} / {memories.length}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(p => !p)}
            className="p-2 text-white/80 hover:text-white transition rounded-full hover:bg-white/10"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white transition rounded-full hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Média principal */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={memory.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="w-full h-full flex items-center justify-center"
          >
            {firstMedia ? (
              <MediaViewer
                media={firstMedia}
                alt={memory.title}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center text-white/60 p-8">
                <p className="text-2xl font-playfair">{memory.title}</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Boutons navigation */}
        {memories.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white transition rounded-full hover:bg-white/10"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white transition rounded-full hover:bg-white/10"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </>
        )}
      </div>

      {/* Informations du souvenir (bas) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`info-${memory.id}`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent"
        >
          <div className="max-w-3xl mx-auto text-white">
            <div className="flex items-center gap-3 text-sm opacity-75 mb-2">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(memory.date)}</span>
              </div>
              {memory.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{memory.location}</span>
                </div>
              )}
            </div>
            <h2 className="text-2xl md:text-3xl font-playfair font-bold mb-2">{memory.title}</h2>
            {memory.description && (
              <p className="text-white/80 text-sm md:text-base line-clamp-3">{memory.description}</p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Barre de progression */}
      {isPlaying && memories.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <motion.div
            key={`bar-${currentIndex}`}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 5, ease: 'linear' }}
            className="h-full bg-theme-primary"
          />
        </div>
      )}
    </div>
  );
}

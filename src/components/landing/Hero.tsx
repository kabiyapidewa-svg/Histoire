import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[70vh] sm:min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="/hero-couple.jpg"
          alt=""
          className="w-full h-full object-cover object-[38%_center] sm:object-[center_top]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/30 to-black/50" />
      </div>

      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div key={i} className="absolute text-white/30 pointer-events-none"
          initial={{ opacity: 0 }} animate={{ opacity: [0, 0.6, 0], y: [0, -100, -200], x: [0, Math.sin(i) * 30, Math.cos(i) * 20] }}
          transition={{ duration: 6 + i, repeat: Infinity, delay: i * 0.8, ease: 'easeOut' }}
          style={{ left: `${10 + i * 14}%`, top: `${30 + (i % 3) * 20}%`, fontSize: `${20 + (i % 3) * 12}px` }}>
          <svg width="24" height="24" viewBox="0 0 64 64"><path d="M32 56C32 56 8 40 8 24C8 16 14 10 22 10C26 10 30 12 32 16C34 12 38 10 42 10C50 10 56 16 56 24C56 40 32 56 32 56Z" fill="currentColor"/></svg>
        </motion.div>
      ))}

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 text-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 mb-8">
          <Sparkles className="w-4 h-4 text-white" />
          <span className="text-sm font-medium text-white">Your love story, preserved forever</span>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-playfair font-bold text-white mb-6 leading-tight drop-shadow-2xl">
          Preserve every<br />
          <span className="bg-gradient-to-r from-rose-300 to-pink-200 bg-clip-text text-transparent">moment together</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
          className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed drop-shadow-lg">
          Store your photos, videos, and memories in a beautiful timeline you share with your partner.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/auth/register" className="group px-8 py-4 bg-theme-primary text-white rounded-full font-medium text-lg hover:bg-theme-primary-hover transition-all shadow-xl hover:shadow-2xl hover:scale-105 flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 64 64"><path d="M32 56C32 56 8 40 8 24C8 16 14 10 22 10C26 10 30 12 32 16C34 12 38 10 42 10C50 10 56 16 56 24C56 40 32 56 32 56Z" fill="currentColor"/></svg>
            Start your story
          </Link>
          <Link to="/auth/login" className="px-8 py-4 border-2 border-white text-white rounded-full font-medium text-lg hover:bg-white/10 transition-all backdrop-blur-sm">
            {t('login')}
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.8 }}
          className="mt-12 flex items-center justify-center gap-2 text-white/80 text-sm">
          <div className="flex -space-x-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-rose-300 to-pink-400 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 64 64"><path d="M32 56C32 56 8 40 8 24C8 16 14 10 22 10C26 10 30 12 32 16C34 12 38 10 42 10C50 10 56 16 56 24C56 40 32 56 32 56Z" fill="white"/></svg>
              </div>
            ))}
          </div>
          <span className="ml-2">Join couples preserving their memories</span>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, y: [0, 10, 0] }} transition={{ duration: 1.5, delay: 1.2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-2 bg-white/70 rounded-full mt-2" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

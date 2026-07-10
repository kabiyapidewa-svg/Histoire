import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X } from 'lucide-react';
import { fetchMemoriesForCurrentUser } from '../lib/memories';
import type { Memory } from '../types';

interface Reminder {
  memory: Memory;
  yearsAgo: number;
}

export default function MemoryReminder() {
  const navigate = useNavigate();
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { memories } = await fetchMemoriesForCurrentUser();
        const today = new Date();
        const todayMonthDay = `${today.getMonth()}-${today.getDate()}`;

        // Cherche un souvenir dont la date (mois-jour) correspond à aujourd'hui
        // et qui s'est passé il y a au moins 1 an
        for (const m of memories) {
          const d = new Date(m.date);
          const monthDay = `${d.getMonth()}-${d.getDate()}`;
          if (monthDay === todayMonthDay) {
            const yearsAgo = today.getFullYear() - d.getFullYear();
            if (yearsAgo >= 1) {
              setReminder({ memory: m, yearsAgo });
              return;
            }
          }
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  if (!reminder || dismissed) return null;

  const m = reminder.memory;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-gradient-to-r from-theme-soft via-rose-50 to-theme-pale rounded-2xl p-5 border border-theme-medium/30 shadow-sm relative"
      >
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white text-theme-primary flex items-center justify-center flex-shrink-0 shadow-sm">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-theme-primary uppercase tracking-wide mb-1">
              Il y a {reminder.yearsAgo} an{reminder.yearsAgo > 1 ? 's' : ''}
            </p>
            <h3 className="font-playfair font-bold text-theme-dark leading-tight">{m.title}</h3>
            {m.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{m.description}</p>
            )}
            <button
              onClick={() => navigate(`/memory/${m.id}`)}
              className="mt-3 text-sm font-medium text-theme-primary hover:text-theme-primary-hover transition"
            >
              Revivre ce moment →
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

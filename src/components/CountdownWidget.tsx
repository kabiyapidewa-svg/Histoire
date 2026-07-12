import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Star, Cake, Gem, Plane, Gift, Home, Baby } from 'lucide-react';
import { fetchAnniversaries, getNextOccurrence, formatCountdown } from '../lib/anniversaries';
import type { Anniversary } from '../lib/anniversaries';

const ICONS_MAP: Record<string, any> = {
  heart: Heart, star: Star, cake: Cake, ring: Gem,
  plane: Plane, gift: Gift, home: Home, baby: Baby,
};

export default function CountdownWidget() {
  const navigate = useNavigate();
  const [next, setNext] = useState<Anniversary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchAnniversaries();
        if (data.length === 0) { setNext(null); return; }
        // Trouve la prochaine occurrence la plus proche
        const sorted = data
          .map(a => ({ anniv: a, next: getNextOccurrence(a) }))
          .filter(x => x.next.daysLeft >= 0)
          .sort((a, b) => a.next.daysLeft - b.next.daysLeft);
        if (sorted.length > 0) setNext(sorted[0].anniv);
      } catch (e) { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading || !next) return null;

  const occ = getNextOccurrence(next);
  const Icon = ICONS_MAP[next.icon] ?? Heart;
  const isToday = occ.isToday;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={() => navigate('/anniversaries')}
      className="w-full bg-gradient-to-r from-theme-soft to-theme-pale rounded-2xl p-5 border border-theme-medium/40 hover:shadow-lg transition-all text-left"
    >
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${isToday ? 'bg-theme-primary text-white animate-heartbeat' : 'bg-white text-theme-primary'}`}>
          <Icon className="w-7 h-7" fill={isToday ? 'currentColor' : 'none'} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-theme-primary font-medium uppercase tracking-wide">À venir</p>
          <h3 className="font-playfair font-bold text-theme-dark text-lg leading-tight truncate">{next.title}</h3>
          <p className="text-sm text-gray-600 mt-0.5">
            {isToday ? "It's today! 🎉" : formatCountdown(occ.daysLeft)}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className={`text-3xl font-playfair font-bold ${isToday ? 'text-theme-primary' : 'text-theme-dark'}`}>
            {isToday ? '🎉' : occ.daysLeft}
          </p>
          <p className="text-xs text-gray-500">{isToday ? '' : occ.daysLeft === 1 ? 'day' : 'day(s)'}</p>
        </div>
      </div>
    </motion.button>
  );
}

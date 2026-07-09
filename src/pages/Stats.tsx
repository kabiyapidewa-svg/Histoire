import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Calendar, MapPin, Image as ImageIcon, TrendingUp, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchMemoriesForCurrentUser } from '../lib/memories';
import { fetchPartner } from '../lib/partners';
import BottomNav from '../components/BottomNav';
import type { Memory, Profile } from '../types';

const CATEGORIES: Record<string, { label: string; emoji: string }> = {
  voyage: { label: 'Voyages', emoji: '✈️' },
  rencontre: { label: 'Rencontres', emoji: '💕' },
  anniversaire: { label: 'Anniversaires', emoji: '🎂' },
  date_night: { label: 'Date night', emoji: '🌹' },
  famille: { label: 'Famille', emoji: '👨‍👩‍👧' },
  aventure: { label: 'Aventures', emoji: '🏔️' },
  other: { label: 'Autres', emoji: '📸' },
};

export default function Stats() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [daysTogether, setDaysTogether] = useState(0);

  useEffect(() => {
    (async () => {
      if (!profile) return;
      try {
        const [mems, p] = await Promise.all([
          fetchMemoriesForCurrentUser(),
          profile.partner_id ? fetchPartner(profile) : Promise.resolve(null),
        ]);
        setMemories(mems.memories);
        setPartner(p);

        // Calcul jours ensemble (basé sur le 1er souvenir ou la date d'inscription)
        if (mems.memories.length > 0) {
          const firstMemory = mems.memories[mems.memories.length - 1];
          const firstDate = new Date(firstMemory.date);
          const now = new Date();
          const diff = Math.floor((now.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
          setDaysTogether(diff);
        } else {
          const created = new Date(profile.created_at);
          const now = new Date();
          setDaysTogether(Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));
        }
      } catch (e) { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, [profile?.id]);

  // Stats calculées
  const totalMemories = memories.length;
  const totalMedia = memories.reduce((sum, m) => sum + (m.media?.length ?? 0), 0);
  const totalComments = memories.reduce((sum, m) => sum + (m.comments?.length ?? 0), 0);
  const locations = new Set(memories.filter(m => m.location).map(m => m.location));
  const uniqueLocations = locations.size;

  // Par catégorie
  const byCategory = memories.reduce((acc, m) => {
    const cat = (m as any).category ?? 'other';
    acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Top lieux
  const locationCounts = memories.reduce((acc, m) => {
    if (m.location) acc[m.location] = (acc[m.location] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topLocations = Object.entries(locationCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-beige flex items-center justify-center pb-24 md:pb-0">
        <Loader2 className="w-10 h-10 text-theme-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-beige pb-24 md:pb-0">
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-full hover:bg-theme-pale transition">
            <ArrowLeft className="w-5 h-5 text-theme-dark" />
          </button>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-theme-primary" />
            <h1 className="font-playfair font-bold text-theme-dark text-lg">Notre histoire en chiffres</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Bannière principale : jours ensemble */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-theme-primary to-rose-400 rounded-3xl p-6 text-white text-center mb-6 shadow-lg"
        >
          <p className="text-sm opacity-90 uppercase tracking-wide">Ensemble depuis</p>
          <p className="text-5xl font-playfair font-bold my-2">{daysTogether}</p>
          <p className="text-sm opacity-90">{daysTogether === 1 ? 'jour' : 'jours'}</p>
          {partner && <p className="mt-3 text-sm opacity-90">{profile?.name} & {partner.name}</p>}
        </motion.div>

        {/* 4 stats principales */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard icon={Heart} label="Souvenirs" value={totalMemories} color="bg-rose-100 text-rose-500" delay={0.1} />
          <StatCard icon={ImageIcon} label="Photos/vidéos" value={totalMedia} color="bg-purple-100 text-purple-500" delay={0.15} />
          <StatCard icon={MapPin} label="Lieux visités" value={uniqueLocations} color="bg-blue-100 text-blue-500" delay={0.2} />
          <StatCard icon={Calendar} label="Commentaires" value={totalComments} color="bg-green-100 text-green-500" delay={0.25} />
        </div>

        {/* Par catégorie */}
        {Object.keys(byCategory).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-theme-soft mb-6"
          >
            <h3 className="font-playfair font-bold text-theme-dark mb-4">Par catégorie</h3>
            <div className="space-y-2">
              {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
                const max = Math.max(...Object.values(byCategory));
                const pct = (count / max) * 100;
                const info = CATEGORIES[cat] ?? CATEGORIES.other;
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-xl w-8 text-center">{info.emoji}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-theme-dark">{info.label}</span>
                        <span className="text-gray-500">{count}</span>
                      </div>
                      <div className="h-2 bg-theme-pale rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.4 }}
                          className="h-full bg-theme-primary rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Top lieux */}
        {topLocations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-theme-soft"
          >
            <h3 className="font-playfair font-bold text-theme-dark mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-theme-primary" /> Lieux favoris
            </h3>
            <div className="space-y-2">
              {topLocations.map(([loc, count], i) => (
                <div key={loc} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-theme-soft text-theme-primary flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <span className="flex-1 font-medium text-theme-dark">{loc}</span>
                  <span className="text-sm text-gray-500">{count} souvenir{count > 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, delay }: { icon: any; label: string; value: number; color: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl p-4 shadow-sm border border-theme-soft"
    >
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-2`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-playfair font-bold text-theme-dark">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </motion.div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Calendar, ArrowLeft, Loader2, Plus, Trash2, Cake, Star, Gem, Plane, Gift, Home, Baby, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchAnniversaries, createAnniversary, deleteAnniversary,
  getNextOccurrence, formatCountdown, ANNIVERSARY_ICONS,
  RECURRENCE_LABELS, AnniversaryRecurrence,
} from '../lib/anniversaries';
import type { Anniversary } from '../lib/anniversaries';

const ICONS_MAP: Record<string, any> = {
  heart: Heart, star: Star, cake: Cake, ring: Gem,
  plane: Plane, gift: Gift, home: Home, baby: Baby,
};

export default function Anniversaries() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [anniversaries, setAnniversaries] = useState<Anniversary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    date: '',
    recurrence: 'yearly' as AnniversaryRecurrence,
    icon: 'heart',
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAnniversaries();
      setAnniversaries(data);
    } catch (err: any) { setError(err?.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !form.title.trim() || !form.date) return;
    setSaving(true); setError('');
    try {
      await createAnniversary({
        user_id: profile.id,
        title: form.title.trim(),
        date: form.date,
        recurrence: form.recurrence,
        icon: form.icon,
      });
      setShowModal(false);
      setForm({ title: '', date: '', recurrence: 'yearly', icon: 'heart' });
      await load();
    } catch (err: any) { setError(err?.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this anniversary?')) return;
    try {
      await deleteAnniversary(id);
      setAnniversaries(prev => prev.filter(a => a.id !== id));
    } catch (err: any) { setError(err?.message); }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

  // Trie par prochaine occurrence
  const sorted = [...anniversaries].sort((a, b) => {
    const aDays = getNextOccurrence(a).daysLeft;
    const bDays = getNextOccurrence(b).daysLeft;
    return aDays - bDays;
  });

  return (
    <div className="min-h-screen bg-theme-beige pb-24 md:pb-0">
      <nav className="bg-white shadow-sm sticky top-0 z-10 md:hidden">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-2 rounded-full hover:bg-theme-pale transition">
              <ArrowLeft className="w-5 h-5 text-theme-dark" />
            </button>
            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-theme-primary" />
              <h1 className="font-playfair font-bold text-theme-dark text-lg">Anniversaires</h1>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 px-4 py-2 bg-theme-primary text-white rounded-full font-medium hover:bg-theme-primary-hover transition text-sm"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

        {loading ? (
          <div className="text-center py-20"><Loader2 className="w-10 h-10 text-theme-primary animate-spin mx-auto" /></div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 text-theme-medium mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No important dates yet.</p>
            <p className="text-gray-400 text-sm mb-6">Add your anniversaries, dates, milestones...</p>
            <button onClick={() => setShowModal(true)} className="px-6 py-3 bg-theme-primary text-white rounded-full font-medium hover:bg-theme-primary-hover transition">
              Add date
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {sorted.map(anniv => {
                const next = getNextOccurrence(anniv);
                const Icon = ICONS_MAP[anniv.icon] ?? Heart;
                const isToday = next.isToday;
                const isSoon = next.daysLeft > 0 && next.daysLeft <= 7;
                return (
                  <motion.div
                    key={anniv.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`group bg-white rounded-2xl shadow-md p-5 border-l-4 transition-all ${
                      isToday ? 'border-theme-primary bg-theme-pale' : isSoon ? 'border-amber-400' : 'border-theme-soft'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        isToday ? 'bg-theme-primary text-white' : 'bg-theme-soft text-theme-primary'
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-playfair font-bold text-theme-dark text-lg leading-tight">{anniv.title}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{formatDate(anniv.date)} · {RECURRENCE_LABELS[anniv.recurrence]}</p>
                        <div className="mt-2 flex items-center gap-2">
                          {anniv.owner_name && anniv.owner_name !== profile?.name && (
                            <span className="text-xs text-gray-400">Ajouté par {anniv.owner_name}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-2xl font-playfair font-bold ${isToday ? 'text-theme-primary' : 'text-theme-dark'}`}>
                          {isToday ? '🎉' : next.daysLeft}
                        </p>
                        <p className="text-xs text-gray-500">
                          {isToday ? "Today" : next.daysLeft === 1 ? 'day' : 'day(s)'}
                        </p>
                      </div>
                      {anniv.user_id === profile?.id && (
                        <button
                          onClick={() => handleDelete(anniv.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {isSoon && !isToday && (
                      <div className="mt-3 px-3 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm flex items-center gap-2">
                        <span className="font-medium">{formatCountdown(next.daysLeft)}</span>
                      </div>
                    )}
                    {isToday && (
                      <div className="mt-3 px-3 py-2 bg-theme-soft text-theme-primary rounded-lg text-sm font-medium">
                        It's today! 🎉
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-2xl font-playfair font-bold text-theme-dark">Nouvelle date</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" required placeholder="Ex: Notre rencontre" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-theme-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" required value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-theme-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Récurrence</label>
                <select value={form.recurrence}
                  onChange={(e) => setForm({ ...form, recurrence: e.target.value as AnniversaryRecurrence })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-theme-primary">
                  <option value="yearly">Yearly</option>
                  <option value="monthly">Monthly</option>
                  <option value="once">Once</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {ANNIVERSARY_ICONS.map(iconName => {
                    const Icon = ICONS_MAP[iconName] ?? Heart;
                    return (
                      <button key={iconName} type="button" onClick={() => setForm({ ...form, icon: iconName })}
                        className={`p-2 rounded-xl border-2 transition ${form.icon === iconName ? 'border-theme-primary bg-theme-pale' : 'border-gray-200 hover:border-theme-medium'}`}>
                        <Icon className="w-5 h-5 text-theme-primary" />
                      </button>
                    );
                  })}
                </div>
              </div>
              {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-theme-primary text-white rounded-xl font-medium hover:bg-theme-primary-hover transition disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-5 h-5 animate-spin" />} Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
    </div>
  );
}

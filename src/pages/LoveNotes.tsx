import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Send, ArrowLeft, Loader2, Trash2, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchPartner } from '../lib/partners';
import {
  fetchLoveNotes, sendLoveNote, markLoveNotesAsRead, deleteLoveNote,
  LOVE_NOTE_COLORS, LoveNoteColor,
} from '../lib/loveNotes';
import type { LoveNote } from '../lib/loveNotes';
import type { Profile } from '../types';
import BottomNav from '../components/BottomNav';

export default function LoveNotes() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [partner, setPartner] = useState<Profile | null>(null);
  const [notes, setNotes] = useState<LoveNote[]>([]);
  const [text, setText] = useState('');
  const [color, setColor] = useState<LoveNoteColor>('rose');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      if (!profile?.partner_id) { setLoading(false); return; }
      try {
        const [p, n] = await Promise.all([fetchPartner(profile), fetchLoveNotes()]);
        setPartner(p);
        setNotes(n);
        await markLoveNotesAsRead();
      } catch (err: any) { setError(err?.message); }
      finally { setLoading(false); }
    })();
  }, [profile?.id, profile?.partner_id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !partner) return;
    setSending(true); setError('');
    try {
      const note = await sendLoveNote(partner.id, text.trim(), color);
      setNotes(prev => [note, ...prev]);
      setText('');
    } catch (err: any) { setError(err?.message); }
    finally { setSending(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette note d\'amour ?')) return;
    try {
      await deleteLoveNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch (err: any) { setError(err?.message); }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
  };

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
            <Sparkles className="w-6 h-6 text-theme-primary" />
            <h1 className="font-playfair font-bold text-theme-dark text-lg">Notes d'amour</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

        {!profile?.partner_id || !partner ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-theme-medium mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Invitez votre partenaire pour échanger des notes d'amour.</p>
            <button onClick={() => navigate('/account')} className="px-6 py-3 bg-theme-primary text-white rounded-full font-medium hover:bg-theme-primary-hover transition">
              Inviter mon partenaire
            </button>
          </div>
        ) : (
          <>
            {/* Composer */}
            <form onSubmit={handleSend} className="bg-white rounded-3xl shadow-md p-5 mb-6 border border-theme-soft">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`Un petit mot doux pour ${partner.name}...`}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-theme-primary resize-none"
              />
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {(Object.keys(LOVE_NOTE_COLORS) as LoveNoteColor[]).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : 'hover:scale-110'}`}
                    style={{ background: LOVE_NOTE_COLORS[c].bg, borderColor: LOVE_NOTE_COLORS[c].border }}
                    title={LOVE_NOTE_COLORS[c].label}
                  />
                ))}
                <button
                  type="submit"
                  disabled={sending || !text.trim()}
                  className="ml-auto px-5 py-2.5 bg-theme-primary text-white rounded-full font-medium hover:bg-theme-primary-hover transition disabled:opacity-50 flex items-center gap-2"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Envoyer
                </button>
              </div>
            </form>

            {/* Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AnimatePresence>
                {notes.map(note => {
                  const isMine = note.sender_id === profile?.id;
                  const colorStyle = LOVE_NOTE_COLORS[note.color];
                  return (
                    <motion.div
                      key={note.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ y: -4, rotate: isMine ? -1 : 1 }}
                      className="group relative p-5 rounded-2xl shadow-md"
                      style={{ background: colorStyle.bg, borderColor: colorStyle.border, borderWidth: 1 }}
                    >
                      <div className="absolute top-3 right-3 opacity-20">
                        <Heart className="w-8 h-8" fill={colorStyle.text} />
                      </div>
                      <p className="relative font-playfair text-lg leading-relaxed mb-3" style={{ color: colorStyle.text }}>
                        {note.text}
                      </p>
                      <div className="flex items-center justify-between text-xs" style={{ color: colorStyle.text }}>
                        <span className="opacity-80">
                          {isMine ? 'De vous' : `De ${partner?.name ?? 'votre partenaire'}`}
                        </span>
                        <span className="opacity-60">{formatDate(note.created_at)}</span>
                      </div>
                      {isMine && (
                        <button
                          onClick={() => handleDelete(note.id)}
                          className="absolute -top-2 -right-2 p-1.5 bg-white text-red-500 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {notes.length === 0 && (
              <div className="text-center py-16">
                <Sparkles className="w-16 h-16 text-theme-medium mx-auto mb-4" />
                <p className="text-gray-500">Aucune note d'amour pour l'instant.</p>
                <p className="text-gray-400 text-sm mt-1">Surprenez {partner.name} avec un petit mot doux !</p>
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

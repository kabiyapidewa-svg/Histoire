import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Send, ArrowLeft, Loader2, Trash2, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchPartner } from '../lib/partners';
import {
  fetchMessages, sendMessage, markMessagesAsRead, subscribeToMessages, deleteMessage,
} from '../lib/chat';
import type { Message } from '../lib/chat';
import type { Profile } from '../types';
import BottomNav from '../components/BottomNav';

export default function Chat() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [partner, setPartner] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);  // Verrou anti-double-envoi (plus fiable que le state)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    (async () => {
      if (!profile?.partner_id) { setLoading(false); return; }
      try {
        const [p, msgs] = await Promise.all([
          fetchPartner(profile),
          fetchMessages(),
        ]);
        setPartner(p);
        setMessages(msgs);
        await markMessagesAsRead();
      } catch (err: any) {
        setError(err?.message || 'Erreur');
      } finally {
        setLoading(false);
      }
    })();
  }, [profile?.id, profile?.partner_id]);

  // Souscription temps réel aux nouveaux messages
  useEffect(() => {
    const unsubscribe = subscribeToMessages((newMsg) => {
      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      // Marque comme lu si on a reçu le message (pas nous qui l'avons envoyé)
      if (newMsg.receiver_id === profile?.id) {
        markMessagesAsRead().catch(() => {});
      }
    });
    return unsubscribe;
  }, [profile?.id]);

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !partner) return;

    // VERROU ANTI-DOUBLE-ENVOI : si un envoi est déjà en cours, on ignore
    if (sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);

    setError('');
    const textToSend = text.trim();
    setText('');  // vide le champ immédiatement
    try {
      await sendMessage(partner.id, textToSend);
      // Pas d'ajout local : la souscription Realtime s'en charge (1 seule fois)
    } catch (err: any) {
      setError(err?.message || 'Erreur');
      setText(textToSend);  // restore le texte en cas d'erreur
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce message ?')) return;
    try {
      await deleteMessage(id);
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch (err: any) { setError(err?.message); }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-beige flex items-center justify-center pb-24 md:pb-0">
        <Loader2 className="w-10 h-10 text-theme-primary animate-spin" />
      </div>
    );
  }

  if (!profile?.partner_id || !partner) {
    return (
      <div className="min-h-screen bg-theme-beige pb-24 md:pb-0">
        <Nav onBack={() => navigate('/dashboard')} />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <Heart className="w-16 h-16 text-theme-medium mx-auto mb-4" />
          <h2 className="text-2xl font-playfair font-bold text-theme-dark mb-2">Pas de partenaire lié</h2>
          <p className="text-gray-600 mb-6">Invitez votre partenaire pour commencer à discuter avec lui/elle.</p>
          <button onClick={() => navigate('/account')} className="px-6 py-3 bg-theme-primary text-white rounded-full font-medium hover:bg-theme-primary-hover transition">
            Inviter mon partenaire
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-beige flex flex-col pb-24 md:pb-0">
      <Nav onBack={() => navigate('/dashboard')} partnerName={partner.name} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-4 flex flex-col">
        {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-3 text-sm">{error}</div>}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto pb-4 space-y-2">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isMine = msg.sender_id === profile?.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`group max-w-[75%] md:max-w-[60%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isMine
                          ? 'bg-theme-primary text-white rounded-br-md'
                          : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words text-sm">{msg.text}</p>
                    </div>
                    <div className={`flex items-center gap-2 mt-1 px-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className="text-xs text-gray-400">{formatTime(msg.created_at)}</span>
                      {isMine && (
                        <button
                          onClick={() => handleDelete(msg.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {messages.length === 0 && (
            <div className="text-center py-20">
              <MessageCircle className="w-16 h-16 text-theme-medium mx-auto mb-4" />
              <p className="text-gray-500">Aucun message pour l'instant.</p>
              <p className="text-gray-400 text-sm mt-1">Démarrez la conversation avec {partner.name} !</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="flex gap-2 p-3 bg-white rounded-2xl shadow-md border border-gray-100 sticky bottom-20 md:bottom-4">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Écrire à ${partner.name}...`}
            className="flex-1 px-4 py-3 rounded-xl bg-theme-pale focus:outline-none focus:ring-2 focus:ring-theme-primary"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="p-3 bg-theme-primary text-white rounded-xl hover:bg-theme-primary-hover transition disabled:opacity-50 flex items-center justify-center"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </main>

      <BottomNav />
    </div>
  );
}

function Nav({ onBack, partnerName }: { onBack: () => void; partnerName?: string }) {
  return (
    <nav className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-theme-pale transition">
          <ArrowLeft className="w-5 h-5 text-theme-dark" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-theme-soft to-theme-medium flex items-center justify-center">
            <Heart className="w-5 h-5 text-theme-primary" fill="currentColor" />
          </div>
          <div>
            <p className="font-playfair font-bold text-theme-dark leading-tight">{partnerName ?? 'Chat'}</p>
            <p className="text-xs text-gray-500">En ligne</p>
          </div>
        </div>
      </div>
    </nav>
  );
}

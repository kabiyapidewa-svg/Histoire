import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { countUnreadMessages } from '../lib/chat';
import { countUnreadLoveNotes } from '../lib/loveNotes';

export interface ToastNotification {
  id: string;
  type: 'message' | 'love_note' | 'info';
  title: string;
  body?: string;
  emoji?: string;
}

interface NotificationContextValue {
  unreadMessages: number;
  unreadLoveNotes: number;
  totalUnread: number;
  toasts: ToastNotification[];
  dismissToast: (id: string) => void;
  refreshUnread: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue>({
  unreadMessages: 0,
  unreadLoveNotes: 0,
  totalUnread: 0,
  toasts: [],
  dismissToast: () => {},
  refreshUnread: async () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { session, profile } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadLoveNotes, setUnreadLoveNotes] = useState(0);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const refreshUnread = useCallback(async () => {
    if (!session) { setUnreadMessages(0); setUnreadLoveNotes(0); return; }
    try {
      const [m, n] = await Promise.all([countUnreadMessages(), countUnreadLoveNotes()]);
      setUnreadMessages(m);
      setUnreadLoveNotes(n);
    } catch {
      // ignore
    }
  }, [session]);

  // Charge les compteurs initiaux
  useEffect(() => {
    refreshUnread();
  }, [refreshUnread, profile?.id]);

  // Souscription Realtime aux nouveaux messages
  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel('notifications-messages')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const row = payload.new as any;
          // Seulement si je suis le receiver (pas mes propres messages)
          if (row.receiver_id === profile?.id) {
            // Toast
            setToasts(prev => [...prev, {
              id: crypto.randomUUID(),
              type: 'message',
              title: 'Nouveau message',
              body: row.text?.slice(0, 60) + (row.text?.length > 60 ? '...' : ''),
              emoji: '💬',
            }]);
            // Incrémente le compteur
            setUnreadMessages(prev => prev + 1);
          }
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'love_notes' },
        (payload) => {
          const row = payload.new as any;
          if (row.receiver_id === profile?.id) {
            setToasts(prev => [...prev, {
              id: crypto.randomUUID(),
              type: 'love_note',
              title: 'Nouvelle note d\'amour',
              body: row.text?.slice(0, 60) + (row.text?.length > 60 ? '...' : ''),
              emoji: '💌',
            }]);
            setUnreadLoveNotes(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session, profile?.id]);

  // Auto-dismiss toasts après 5 sec
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts(prev => prev.slice(1));
    }, 5000);
    return () => clearTimeout(timer);
  }, [toasts]);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const totalUnread = unreadMessages + unreadLoveNotes;

  return (
    <NotificationContext.Provider value={{
      unreadMessages,
      unreadLoveNotes,
      totalUnread,
      toasts,
      dismissToast,
      refreshUnread,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}

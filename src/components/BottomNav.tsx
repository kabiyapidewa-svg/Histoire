import { Link, useLocation } from 'react-router-dom';
import { Home, MessageCircle, Sparkles, Calendar, User } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

export default function BottomNav() {
  const location = useLocation();
  const { unreadMessages, unreadLoveNotes } = useNotifications();

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-bottom shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around py-2">
        <Link to="/dashboard" className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${isActive('/dashboard') ? 'text-theme-primary' : 'text-gray-500'}`}>
          <Home className="w-5 h-5" /><span className="text-[10px]">Accueil</span>
        </Link>

        <Link to="/chat" className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${isActive('/chat') ? 'text-theme-primary' : 'text-gray-500'}`}>
          <div className="relative">
            <MessageCircle className="w-5 h-5" />
            {unreadMessages > 0 && (
              <span className="absolute -top-2 -right-2 bg-theme-primary text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </span>
            )}
          </div>
          <span className="text-[10px]">Chat</span>
        </Link>

        <Link to="/love-notes" className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${isActive('/love-notes') ? 'text-theme-primary' : 'text-gray-500'}`}>
          <div className="relative">
            <Sparkles className="w-5 h-5" />
            {unreadLoveNotes > 0 && (
              <span className="absolute -top-2 -right-2 bg-theme-primary text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {unreadLoveNotes > 9 ? '9+' : unreadLoveNotes}
              </span>
            )}
          </div>
          <span className="text-[10px]">Notes</span>
        </Link>

        <Link to="/anniversaries" className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${isActive('/anniversaries') ? 'text-theme-primary' : 'text-gray-500'}`}>
          <Calendar className="w-5 h-5" /><span className="text-[10px]">Dates</span>
        </Link>

        <Link to="/account" className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${isActive('/account') ? 'text-theme-primary' : 'text-gray-500'}`}>
          <User className="w-5 h-5" /><span className="text-[10px]">Compte</span>
        </Link>
      </div>
    </div>
  );
}

import { Link, useLocation } from 'react-router-dom';
import { Home, MessageCircle, Sparkles, Calendar, User, TrendingUp } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

export default function Sidebar() {
  const location = useLocation();
  const { unreadMessages, unreadLoveNotes } = useNotifications();

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const items = [
    { to: '/dashboard', icon: Home, label: 'Accueil' },
    { to: '/chat', icon: MessageCircle, label: 'Chat', badge: unreadMessages },
    { to: '/love-notes', icon: Sparkles, label: 'Notes', badge: unreadLoveNotes },
    { to: '/anniversaries', icon: Calendar, label: 'Dates' },
    { to: '/stats', icon: TrendingUp, label: 'Stats' },
    { to: '/account', icon: User, label: 'Compte' },
  ];

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-100 z-30">
      <div className="p-6 border-b border-gray-100">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src="/favicon.svg" alt="MemoryLine" className="w-8 h-8" />
          <h1 className="text-2xl font-playfair font-bold text-theme-dark">MemoryLine</h1>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {items.map(item => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
              isActive(item.to)
                ? 'bg-theme-pale text-theme-primary font-medium'
                : 'text-gray-600 hover:bg-theme-pale hover:text-theme-dark'
            }`}
          >
            <div className="relative">
              <item.icon className="w-5 h-5" />
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-2 -right-2 bg-theme-primary text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </div>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">Made with love</p>
      </div>
    </aside>
  );
}

import { Link, useLocation } from 'react-router-dom';
import { Home, Plus, User } from 'lucide-react';

export default function BottomNav({ onAddClick }: { onAddClick?: () => void }) {
  const location = useLocation();
  const isActive = (path: string) => path === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(path);
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-bottom shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around py-2">
        <Link to="/dashboard" className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-colors ${isActive('/dashboard') ? 'text-theme-primary' : 'text-gray-500'}`}>
          <Home className="w-6 h-6" /><span className="text-xs">Accueil</span>
        </Link>
        <button onClick={onAddClick} className="flex flex-col items-center justify-center -mt-6 w-14 h-14 bg-theme-primary text-white rounded-full shadow-lg hover:bg-theme-primary-hover active:scale-95 transition">
          <Plus className="w-7 h-7" />
        </button>
        <Link to="/account" className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-colors ${isActive('/account') ? 'text-theme-primary' : 'text-gray-500'}`}>
          <User className="w-6 h-6" /><span className="text-xs">Compte</span>
        </Link>
      </div>
    </div>
  );
}

import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';

export default function ToastContainer() {
  const { toasts, dismissToast } = useNotifications();
  const navigate = useNavigate();

  const handleClick = (type: string) => {
    if (type === 'message') navigate('/chat');
    else if (type === 'love_note') navigate('/love-notes');
  };

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)] sm:w-auto">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={() => { handleClick(toast.type); dismissToast(toast.id); }}
            className="bg-white rounded-2xl shadow-xl border border-theme-soft p-4 cursor-pointer hover:shadow-2xl transition-shadow flex items-start gap-3"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              toast.type === 'message' ? 'bg-theme-soft text-theme-primary' : 'bg-rose-100 text-rose-500'
            }`}>
              {toast.type === 'message'
                ? <MessageCircle className="w-5 h-5" />
                : <Heart className="w-5 h-5" fill="currentColor" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-theme-dark text-sm">{toast.title}</p>
              {toast.body && <p className="text-gray-600 text-xs mt-0.5 truncate">{toast.body}</p>}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); dismissToast(toast.id); }}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

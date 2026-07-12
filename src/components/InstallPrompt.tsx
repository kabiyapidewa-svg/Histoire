import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'memoryline-install-dismissed';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Si déjà installé ou fermé, on n'affiche pas
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (localStorage.getItem(DISMISS_KEY) === '1') return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setVisible(true), 3000);  // attend 3s avant d'afficher
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, '1');
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[90] bg-white rounded-2xl shadow-2xl border border-theme-soft p-4"
        >
          <button onClick={handleDismiss} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-theme-soft text-theme-primary flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-playfair font-bold text-theme-dark mb-1">Installer MemoryLine</h3>
              <p className="text-sm text-gray-600 mb-3">
                Accédez à votre histoire en un tap, même hors-ligne. Aucun App Store requis.
              </p>
              <button
                onClick={handleInstall}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-theme-primary text-white rounded-xl font-medium hover:bg-theme-primary-hover transition"
              >
                <Download className="w-4 h-4" />
                Installer l'application
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

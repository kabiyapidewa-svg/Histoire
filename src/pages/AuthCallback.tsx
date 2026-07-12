import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Page de callback après :
 *  - Google OAuth (Supabase renvoie ici avec la session dans l'URL)
 *  - Confirmation email (Supabase renvoie ici après clic sur le lien)
 *
 * Supabase détecte automatiquement la session dans l'URL (detectSessionInUrl: true),
 * donc il suffit d'attendre que `session` soit peuplée, puis rediriger vers /dashboard.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading && session) {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, session, navigate]);

  // Timeout de sécurité (10s) pour ne pas rester bloqué sur l'écran de chargement
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 10000);
    return () => clearTimeout(t);
  }, []);

  if (timedOut && !session) {
    return (
      <div className="min-h-screen bg-rose-pale flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <Heart className="w-10 h-10 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-playfair font-bold text-brun-doux mb-2">Login failed</h2>
          <p className="text-gray-600 text-sm mb-6">
            La redirection Google n'a pas abouti. Réessayez ou connectez-vous par email.
          </p>
          <button
            onClick={() => navigate('/auth/login')}
            className="px-6 py-2 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition"
          >
            Aller à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rose-pale flex flex-col items-center justify-center">
      <Heart className="w-12 h-12 text-rose-500 animate-pulse mb-4" />
      <Loader2 className="w-6 h-6 text-brun-doux animate-spin mb-3" />
      <p className="text-brun-doux font-medium">Logging in...</p>
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, Loader2, ArrowLeft } from 'lucide-react';
import { useAppStore } from '../store';
import { signInWithEmail, validateEmail } from '../lib/auth';
import { isSupabaseConfigured } from '../lib/supabase';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const notice = useAppStore(s => s.notice);
  const clearNotice = useAppStore(s => s.clearNotice);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation professionnelle (pas HTML5)
    const emailErr = validateEmail(form.email);
    if (emailErr) { setError(emailErr); return; }
    if (!form.password) { setError('Password is required.'); return; }

    setLoading(true);
    try {
      await signInWithEmail(form.email, form.password);
      clearNotice?.();
      navigate('/dashboard');
    } catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
        setError(t('errorInvalidCredentials'));
      } else if (msg.includes('email not confirmed')) {
        setError(t('errorEmailNotConfirmed'));
      } else {
        setError(err?.message || t('errorGeneric'));
      }
    } finally {
      setLoading(false);
    }
  };

    // Google OAuth désactivé — à configurer plus tard si besoin

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-rose-pale flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <Heart className="w-10 h-10 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-playfair font-bold text-brun-doux mb-2">Configuration required</h2>
          <p className="text-gray-600 text-sm">
            Variables Supabase manquantes. Voir <code>VITE_SUPABASE_URL</code> et <code>VITE_SUPABASE_ANON_KEY</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rose-pale flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <Heart className="w-8 h-8 text-rose-500" />
          <h1 className="text-3xl font-playfair font-bold text-brun-doux">{t('appName')}</h1>
        </div>
        <h2 className="text-2xl font-playfair font-bold text-gray-800 text-center mb-2">{t('login')}</h2>
        <p className="text-gray-500 text-center mb-8">Bon retour dans votre histoire</p>

        {notice && (
          <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-sm">{notice}</div>
        )}
        {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('password')}</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
          <div className="text-right">
            <Link to="/auth/forgot-password" className="text-sm text-rose-600 hover:underline">
              {t('forgotPassword')}
            </Link>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rose-500 text-white py-3 rounded-xl font-medium hover:bg-rose-600 transition shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? t('loading') : t('login')}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6 text-sm">
          {t('noAccount')}{' '}
          <Link to="/auth/register" className="text-rose-600 font-medium hover:underline">{t('register')}</Link>
        </p>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brun-doux transition">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}



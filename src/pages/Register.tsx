import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useAppStore } from '../store';
import {
  signUpWithEmail,
  validateEmail,
  validatePassword,
} from '../lib/auth';
import { isSupabaseConfigured } from '../lib/supabase';

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setNotice = useAppStore(s => s.setNotice);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Email pré-rempli si on arrive depuis une page d'invitation
  const prefillEmail = searchParams.get('email') || '';
  if (prefillEmail && !form.email) {
    setForm(f => ({ ...f, email: prefillEmail }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError(t('name') + ' requis');
      return;
    }
    const emailErr = validateEmail(form.email);
    if (emailErr) { setError(emailErr); return; }
    const pwdErr = validatePassword(form.password);
    if (pwdErr) { setError(pwdErr); return; }
    if (form.password !== form.confirmPassword) {
      setError(t('password') + ' ≠ ' + t('confirmPassword'));
      return;
    }

    setLoading(true);
    try {
      const data = await signUpWithEmail(form.email, form.password, form.name.trim());
      // Si Supabase exige la confirmation email, data.session sera null.
      if (!data.session) {
        setNotice?.(
          'Account created! Check your inbox to confirm your email, then log in.'
        );
        navigate('/auth/login');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (err?.message?.toLowerCase().includes('already registered') ||
          err?.message?.toLowerCase().includes('already been registered')) {
        setError(t('errorEmailExists'));
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
          <img src="/favicon.svg" alt="MemoryLine" className="w-10 h-10 mx-auto mb-4" />
          <h2 className="text-xl font-playfair font-bold text-brun-doux mb-2">Configuration required</h2>
          <p className="text-gray-600 text-sm">
            Variables Supabase manquantes. Voir <code>VITE_SUPABASE_URL</code> et <code>VITE_SUPABASE_ANON_KEY</code> dans le fichier <code>.env</code> et dans Vercel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rose-pale flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <img src="/favicon.svg" alt="MemoryLine" className="w-8 h-8" />
          <h1 className="text-3xl font-playfair font-bold text-brun-doux">{t('appName')}</h1>
        </div>
        <h2 className="text-2xl font-playfair font-bold text-gray-800 text-center mb-2">{t('register')}</h2>
        <p className="text-gray-500 text-center mb-8">Créez votre compte pour commencer votre histoire</p>

        {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('name')}</label>
            <input
              type="text"

              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
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
            <p className="text-xs text-gray-400 mt-1">Min. 8 caractères, 1 majuscule, 1 chiffre</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('confirmPassword')}</label>
            <input
              type="password"

              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rose-500 text-white py-3 rounded-xl font-medium hover:bg-rose-600 transition shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? t('saving') : t('register')}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6 text-sm">
          {t('alreadyHaveAccount')}{' '}
          <Link to="/auth/login" className="text-rose-600 font-medium hover:underline">{t('login')}</Link>
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


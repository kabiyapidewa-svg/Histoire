import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, Loader2, CheckCircle2 } from 'lucide-react';
import { updatePassword, validatePassword } from '../lib/auth';
import { useAuth } from '../contexts/AuthContext';

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const pwdErr = validatePassword(password);
    if (pwdErr) { setError(pwdErr); return; }
    if (password !== confirm) { setError(t('password') + ' ≠ ' + t('confirmPassword')); return; }

    setLoading(true);
    try {
      await updatePassword(password);
      setDone(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: any) {
      setError(err?.message || t('errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-rose-pale flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <Heart className="w-10 h-10 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-playfair font-bold text-brun-doux mb-2">Lien invalide</h2>
          <p className="text-gray-600 text-sm mb-4">Ce lien de réinitialisation est invalide ou expiré.</p>
          <Link to="/auth/forgot-password" className="text-rose-600 font-medium hover:underline">
            {t('sendResetLink')}
          </Link>
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

        {done ? (
          <div className="text-center">
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-playfair font-bold text-gray-800 mb-2">{t('passwordUpdated')}</h2>
            <p className="text-gray-500">Redirection…</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-playfair font-bold text-gray-800 text-center mb-2">{t('newPassword')}</h2>
            <p className="text-gray-500 text-center mb-8">Choisissez un nouveau mot de passe pour votre compte.</p>
            {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('newPassword')}</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
                <p className="text-xs text-gray-400 mt-1">Min. 8 caractères, 1 majuscule, 1 chiffre</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('confirmPassword')}</label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-rose-500 text-white py-3 rounded-xl font-medium hover:bg-rose-600 transition shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {loading ? t('saving') : t('updatePassword')}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

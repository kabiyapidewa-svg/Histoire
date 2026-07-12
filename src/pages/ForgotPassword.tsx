import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, MailCheck } from 'lucide-react';
import { sendPasswordReset, validateEmail } from '../lib/auth';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const emailErr = validateEmail(email);
    if (emailErr) { setError(emailErr); return; }

    setLoading(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (err: any) {
      setError(err?.message || t('errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rose-pale flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <img src="/favicon.svg" alt="MemoryLine" className="w-8 h-8" />
          <h1 className="text-3xl font-playfair font-bold text-brun-doux">{t('appName')}</h1>
        </div>

        {sent ? (
          <div className="text-center">
            <MailCheck className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-playfair font-bold text-gray-800 mb-2">{t('resetPasswordSuccess')}</h2>
            <p className="text-gray-500 mb-6">Un lien a été envoyé à <strong>{email}</strong>. Cliquez dessus pour définir un nouveau mot de passe.</p>
            <Link to="/auth/login" className="text-rose-600 font-medium hover:underline">
              {t('backToLogin')}
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-playfair font-bold text-gray-800 text-center mb-2">{t('resetPassword')}</h2>
            <p className="text-gray-500 text-center mb-8">Entrez votre email, nous vous enverrons un lien de réinitialisation.</p>
            {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-rose-500 text-white py-3 rounded-xl font-medium hover:bg-rose-600 transition shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {loading ? t('loading') : t('sendResetLink')}
              </button>
            </form>
            <p className="text-center mt-6">
              <Link to="/auth/login" className="text-sm text-rose-600 font-medium hover:underline">
                {t('backToLogin')}
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

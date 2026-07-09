import { Link } from 'react-router-dom';
import { Heart, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-pale to-beige flex items-center justify-center p-6">
      <div className="text-center">
        <Heart className="w-20 h-20 text-rose-300 mx-auto mb-6" />
        <h1 className="text-6xl font-playfair font-bold text-brun-doux mb-4">404</h1>
        <p className="text-lg text-gray-600 mb-8">
          Cette page n'existe pas ou plus.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition"
        >
          <Home className="w-5 h-5" />
          {t('backToDashboard')}
        </Link>
      </div>
    </div>
  );
}

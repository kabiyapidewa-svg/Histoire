import { Heart, Lock, CheckCircle, Gift, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-theme-dark text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-7 h-7 text-rose-400" fill="currentColor" />
              <span className="text-2xl font-playfair font-bold">Histoire</span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">Votre timeline d'amour. Préservez chaque moment ensemble, partagez-les avec votre partenaire, revivez-les pour toujours.</p>
          </div>

          {/* Liens */}
          <div>
            <h4 className="font-medium mb-4 text-white/90">Navigation</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link to="/" className="hover:text-white transition-colors">Accueil</Link></li>
              <li><Link to="/auth/login" className="hover:text-white transition-colors">Connexion</Link></li>
              <li><Link to="/auth/register" className="hover:text-white transition-colors">Inscription</Link></li>
              <li><Link to="/auth/forgot-password" className="hover:text-white transition-colors">Mot de passe oublié</Link></li>
            </ul>
          </div>

          {/* Informations */}
          <div>
            <h4 className="font-medium mb-4 text-white/90">Informations</h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>Données chiffrées & privées</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>Conforme RGPD</span>
              </li>
              <li className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>Gratuit pour toujours</span>
              </li>
              <li className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>Installable sur mobile (PWA)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

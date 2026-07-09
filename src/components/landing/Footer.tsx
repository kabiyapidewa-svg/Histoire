import { Heart, Mail, Github } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-theme-dark text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-7 h-7 text-rose-400" fill="currentColor" />
              <span className="text-2xl font-playfair font-bold">Histoire</span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">Votre timeline d'amour. Préservez chaque moment ensemble, partagez-les avec votre partenaire, revivez-les pour toujours.</p>
          </div>
          <div>
            <h4 className="font-medium mb-4 text-white/90">Navigation</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link to="/" className="hover:text-white transition-colors">Accueil</Link></li>
              <li><Link to="/auth/login" className="hover:text-white transition-colors">Connexion</Link></li>
              <li><Link to="/auth/register" className="hover:text-white transition-colors">Inscription</Link></li>
              <li><Link to="/auth/forgot-password" className="hover:text-white transition-colors">Mot de passe oublié</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4 text-white/90">Informations</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>🔒 Données chiffrées & privées</li>
              <li>✅ Conforme RGPD</li>
              <li>🆓 Gratuit pour toujours</li>
              <li>📱 Installable sur mobile (PWA)</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/60">
          <p>© {new Date().getFullYear()} Histoire. Fait avec amour.</p>
          <div className="flex items-center gap-4">
            <a href="mailto:contact@histoire.app" className="flex items-center gap-1 hover:text-white transition-colors"><Mail className="w-4 h-4" /> Contact</a>
            <a href="https://github.com/kabiyapidewa-svg/Histoire" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white transition-colors"><Github className="w-4 h-4" /> Code source</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

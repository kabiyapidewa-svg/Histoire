import { Lock, CheckCircle, Gift, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-theme-dark text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/favicon.svg" alt="MemoryLine" className="w-8 h-8" />
              <span className="text-2xl font-playfair font-bold">MemoryLine</span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">Your love timeline. Preserve every moment together, share them with your partner, relive them forever.</p>
          </div>
          <div>
            <h4 className="font-medium mb-4 text-white/90">Navigation</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/auth/login" className="hover:text-white transition-colors">Login</Link></li>
              <li><Link to="/auth/register" className="hover:text-white transition-colors">Sign Up</Link></li>
              <li><Link to="/auth/forgot-password" className="hover:text-white transition-colors">Forgot password</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4 text-white/90">Information</h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-center gap-2"><Lock className="w-4 h-4 text-rose-400 flex-shrink-0" /><span>Encrypted & private</span></li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-rose-400 flex-shrink-0" /><span>GDPR compliant</span></li>
              <li className="flex items-center gap-2"><Gift className="w-4 h-4 text-rose-400 flex-shrink-0" /><span>Free forever</span></li>
              <li className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-rose-400 flex-shrink-0" /><span>Installable on mobile (PWA)</span></li>
            </ul>
            <div className="mt-4 pt-4 border-t border-white/10 space-y-1">
              <Link to="/terms" className="block text-sm text-white/60 hover:text-white transition-colors">Terms of Service</Link>
              <Link to="/privacy" className="block text-sm text-white/60 hover:text-white transition-colors">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

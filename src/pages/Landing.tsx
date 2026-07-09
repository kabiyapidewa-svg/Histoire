import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Menu, X } from 'lucide-react';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import Demo from '../components/landing/Demo';
import FAQ from '../components/landing/FAQ';
import Footer from '../components/landing/Footer';
import { useAuth } from '../contexts/AuthContext';

export default function Landing() {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { href: '#features', label: 'Fonctionnalités' },
    { href: '#how', label: 'Comment ça marche' },
    { href: '#demo', label: 'Aperçu' },
    { href: '#faq', label: 'FAQ' },
  ];

  return (
    <div className="min-h-screen bg-theme-beige">
      <motion.nav initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.5 }} className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-md py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <Heart className="w-8 h-8 text-theme-primary" fill="currentColor" />
            <h1 className="text-2xl font-playfair font-bold text-theme-dark">{t('appName')}</h1>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <a key={link.href} href={link.href} className={`text-sm font-medium hover:text-theme-primary transition-colors ${scrolled ? 'text-gray-700' : 'text-theme-dark'}`}>{link.label}</a>
            ))}
            <select value={i18n.language} onChange={(e) => i18n.changeLanguage(e.target.value)} className="bg-white/70 backdrop-blur px-3 py-1 rounded-full border border-theme-medium text-theme-dark text-sm">
              <option value="en">EN</option>
              <option value="fr">FR</option>
            </select>
            {session ? (
              <Link to="/dashboard" className="px-5 py-2 bg-theme-primary text-white rounded-full font-medium hover:bg-theme-primary-hover transition shadow-md">{t('dashboard')}</Link>
            ) : (
              <>
                <Link to="/auth/login" className="px-5 py-2 text-theme-dark font-medium hover:text-theme-primary transition-colors">{t('login')}</Link>
                <Link to="/auth/register" className="px-5 py-2 bg-theme-primary text-white rounded-full font-medium hover:bg-theme-primary-hover transition shadow-md">{t('register')}</Link>
              </>
            )}
          </div>
          <button onClick={() => setMenuOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-theme-soft transition">
            <Menu className="w-6 h-6 text-theme-dark" />
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-theme-dark/95 backdrop-blur-lg md:hidden">
            <div className="flex justify-end p-6">
              <button onClick={() => setMenuOpen(false)} className="p-2 text-white"><X className="w-7 h-7" /></button>
            </div>
            <div className="flex flex-col items-center justify-center h-full gap-6 -mt-16">
              {navLinks.map(link => (
                <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="text-2xl text-white font-playfair hover:text-rose-300 transition">{link.label}</a>
              ))}
              <div className="flex flex-col gap-3 mt-6 w-64">
                <select value={i18n.language} onChange={(e) => i18n.changeLanguage(e.target.value)} className="bg-white/10 text-white px-4 py-2 rounded-full border border-white/30 text-center">
                  <option value="en" className="text-theme-dark">English</option>
                  <option value="fr" className="text-theme-dark">Français</option>
                </select>
                {session ? (
                  <Link to="/dashboard" className="px-5 py-3 bg-theme-primary text-white rounded-full font-medium text-center">{t('dashboard')}</Link>
                ) : (
                  <>
                    <Link to="/auth/login" className="px-5 py-3 border-2 border-white text-white rounded-full font-medium text-center">{t('login')}</Link>
                    <Link to="/auth/register" className="px-5 py-3 bg-theme-primary text-white rounded-full font-medium text-center">{t('register')}</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        <Hero />
        <div id="features"><Features /></div>
        <div id="how"><HowItWorks /></div>
        <div id="demo"><Demo /></div>
        <div id="faq"><FAQ /></div>
      </main>
      <Footer />
    </div>
  );
}

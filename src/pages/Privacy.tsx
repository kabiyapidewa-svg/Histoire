import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-theme-beige">
      <nav className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <Heart className="w-7 h-7 text-theme-primary" fill="currentColor" />
            <h1 className="text-2xl font-playfair font-bold text-theme-dark">MemoryLine</h1>
          </Link>
        </div>
      </nav>
      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-playfair font-bold text-theme-dark mb-2">Politique de Confidentialité</h1>
        <p className="text-sm text-gray-500 mb-8">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
        <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
          <section><h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">1. Responsable du traitement</h2><p>L'éditeur de l'Application MemoryLine est responsable du traitement des données. Contact : contact@histoire.app</p></section>
          <section><h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">2. Données collectées</h2><ul className="list-disc pl-5 mt-2 space-y-1"><li>Identifiants : email, nom, mot de passe (haché)</li><li>Contenus : photos, vidéos, textes, messages</li><li>Données techniques : user-agent, tokens de session</li><li>Subscriptions push (pour les notifications)</li></ul></section>
          <section><h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">3. Finalités</h2><p>Création et gestion du compte, stockage et affichage des souvenirs, messagerie, notifications, statistiques, sécurité.</p></section>
          <section><h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">4. Base légale</h2><p>Consentement (RGPD 6.1.a), exécution du contrat (6.1.b), intérêt légitime (6.1.f).</p></section>
          <section><h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">5. Destinataires</h2><p>Vous-même et votre partenaire lié. Prestataires : Supabase (hébergement Europe), Resend (email), Vercel (déploiement). Aucune vente de données.</p></section>
          <section><h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">6. Durée de conservation</h2><p>Les données sont conservées tant que le compte est actif. À la suppression, toutes les données sont effacées sous 24h.</p></section>
          <section><h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">7. Sécurité</h2><p>Chiffrement HTTPS/TLS, bucket privé avec URLs signées (1h), RLS sur toutes les tables, suppression EXIF GPS, mots de passe hachés, validation des tailles de fichiers.</p></section>
          <section><h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">8. Vos droits</h2><p>Accès, rectification, effacement, limitation, portabilité, opposition. Contact : contact@histoire.app. Réclamation possible auprès de la CNIL (www.cnil.fr).</p></section>
          <section><h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">9. Cookies</h2><p>Utilisation de localStorage pour : session d'auth, thème, langue. Aucun cookie de tracking. Service worker pour le mode hors-ligne.</p></section>
        </div>
        <div className="mt-10 flex gap-4">
          <Link to="/terms" className="text-theme-primary hover:underline text-sm">Conditions générales →</Link>
          <Link to="/" className="text-gray-500 hover:underline text-sm">Retour à l'accueil</Link>
        </div>
      </main>
    </div>
  );
}

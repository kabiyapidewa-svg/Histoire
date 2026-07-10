import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-theme-beige">
      <nav className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <Heart className="w-7 h-7 text-theme-primary" fill="currentColor" />
            <h1 className="text-2xl font-playfair font-bold text-theme-dark">Histoire</h1>
          </Link>
        </div>
      </nav>
      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-playfair font-bold text-theme-dark mb-2">Politique de Confidentialité</h1>
        <p className="text-sm text-gray-500 mb-8">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">1. Responsable du traitement</h2>
            <p>L'éditeur de l'Application Histoire est responsable du traitement des données personnelles collectées. Pour toute question relative à vos données, vous pouvez contacter : contact@histoire.app</p>
          </section>

          <section>
            <h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">2. Données collectées</h2>
            <p>L'Application collecte les données suivantes :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Identifiants de compte</strong> : email, nom, mot de passe (haché)</li>
              <li><strong>Contenus</strong> : photos, vidéos, textes de souvenirs, messages de chat, notes d'amour</li>
              <li><strong>Métadonnées</strong> : dates, lieux, catégories de souvenirs, dates d'anniversaires</li>
              <li><strong>Données techniques</strong> : user-agent (pour les notifications push), tokens de session</li>
              <li><strong>Subscriptions push</strong> : endpoint, clés de chiffrement (pour envoyer les notifications)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">3. Finalités</h2>
            <p>Les données sont traitées pour les finalités suivantes :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Création et gestion du compte utilisateur</li>
              <li>Stockage et affichage des souvenirs partagés entre partenaires</li>
              <li>Messagerie en temps réel entre partenaires</li>
              <li>Envoi de notifications push et in-app</li>
              <li>Fonctionnalités sociales (notes d'amour, anniversaires, statistiques)</li>
              <li>Sécurité et prévention des abus</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">4. Base légale</h2>
            <p>Le traitement repose sur :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Consentement</strong> (Article 6.1.a du RGPD) : pour les notifications push, la création de compte</li>
              <li><strong>Exécution du contrat</strong> (Article 6.1.b) : pour les fonctionnalités de l'Application</li>
              <li><strong>Intérêt légitime</strong> (Article 6.1.f) : pour la sécurité du service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">5. Destinataires</h2>
            <p>Vos données sont accessibles :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>À vous-même</strong> et à votre partenaire lié (pour les souvenirs, messages, notes)</li>
              <li><strong>Au prestataire d'hébergement</strong> : Supabase (stockage des données et fichiers), hébergé en Europe (AWS Frankfurt)</li>
              <li><strong>Au prestataire d'email</strong> : Resend (uniquement pour l'envoi des invitations par email)</li>
              <li><strong>Au prestataire de déploiement</strong> : Vercel (hébergement de l'application web)</li>
            </ul>
            <p>Aucune donnée n'est vendue ou partagée avec des tiers à des fins commerciales.</p>
          </section>

          <section>
            <h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">6. Durée de conservation</h2>
            <p>Les données sont conservées tant que votre compte est actif. À la suppression de votre compte, toutes vos données (souvenirs, photos, vidéos, messages, notes) sont définitivement effacées dans un délai de 24 heures. Les fichiers stockés dans Supabase Storage sont supprimés immédiatement.</p>
          </section>

          <section>
            <h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">7. Sécurité</h2>
            <p>L'Application met en œuvre les mesures techniques suivantes :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Chiffrement des données en transit (HTTPS/TLS)</li>
              <li>Stockage des fichiers dans un bucket privé avec URLs signées (valides 1h)</li>
              <li>Politiques RLS (Row Level Security) sur toutes les tables de la base de données</li>
              <li>Suppression automatique des métadonnées EXIF (GPS) des photos uploadées</li>
              <li>Mots de passe hachés (jamais stockés en clair)</li>
              <li>Validation des tailles de fichiers (10 Mo images, 100 Mo vidéos)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">8. Vos droits</h2>
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Droit d'accès</strong> : consulter vos données personnelles</li>
              <li><strong>Droit de rectification</strong> : modifier vos données (depuis les paramètres du compte)</li>
              <li><strong>Droit à l'effacement</strong> : supprimer votre compte et toutes vos données</li>
              <li><strong>Droit à la limitation du traitement</strong></li>
              <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
              <li><strong>Droit d'opposition</strong> au traitement</li>
            </ul>
            <p>Pour exercer ces droits, contactez : contact@histoire.app</p>
            <p>Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).</p>
          </section>

          <section>
            <h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">9. Cookies et stockage local</h2>
            <p>L'Application utilise le stockage local du navigateur (localStorage) pour :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>La session d'authentification (token Supabase)</li>
              <li>Le thème choisi par l'utilisateur</li>
              <li>La langue préférée (français/anglais)</li>
              <li>Le refus éventuel de l'invitation à installer l'app</li>
            </ul>
            <p>Aucun cookie de tracking ou publicitaire n'est utilisé. Le service worker met en cache les assets statiques pour le mode hors-ligne.</p>
          </section>

          <section>
            <h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">10. Notifications push</h2>
            <p>Si vous activez les notifications push, l'Application stocke une subscription de notification (endpoint + clés de chiffrement). Cette subscription permet d'envoyer des notifications natives quand vous recevez un message ou une note d'amour. Vous pouvez désactiver les notifications à tout moment depuis les paramètres de votre compte.</p>
          </section>

          <section>
            <h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">11. Transferts hors UE</h2>
            <p>Les données sont principalement hébergées en Europe (Supabase, AWS Frankfurt). Les notifications push utilisent les serveurs des navigateurs (Google, Mozilla, Apple) qui peuvent être situés en dehors de l'UE, dans le cadre de leur propre politique de confidentialité.</p>
          </section>
        </div>

        <div className="mt-10 flex gap-4">
          <Link to="/terms" className="text-theme-primary hover:underline text-sm">Conditions générales →</Link>
          <Link to="/" className="text-gray-500 hover:underline text-sm">Retour à l'accueil</Link>
        </div>
      </main>
    </div>
  );
}

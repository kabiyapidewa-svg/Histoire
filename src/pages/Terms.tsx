import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Terms() {
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
        <h1 className="text-3xl font-playfair font-bold text-theme-dark mb-2">Conditions Générales d'Utilisation</h1>
        <p className="text-sm text-gray-500 mb-8">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">1. Objet</h2>
            <p>Les présentes Conditions Générales d'Utilisation (« CGU ») régissent l'utilisation de l'application Histoire (« l'Application »), une plateforme de partage de souvenirs entre partenaires. En utilisant l'Application, vous acceptez les présentes CGU dans leur intégralité.</p>
          </section>

          <section>
            <h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">2. Inscription et compte</h2>
            <p>L'utilisation de l'Application nécessite la création d'un compte personnel. Vous vous engagez à fournir des informations exactes lors de l'inscription. Vous êtes responsable de la confidentialité de vos identifiants et de toutes les activités effectuées depuis votre compte.</p>
            <p>L'inscription est réservée aux personnes âgées de 16 ans et plus. En vous inscrivant, vous déclarez avoir au moins 16 ans.</p>
          </section>

          <section>
            <h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">3. Service</h2>
            <p>Histoire permet aux utilisateurs de créer une timeline de souvenirs (photos, vidéos, textes) et de la partager avec un partenaire lié par invitation. Les fonctionnalités incluent : messagerie entre partenaires, notes d'amour, calendrier d'anniversaires, statistiques de couple, et notifications.</p>
            <p>Le service est fourni gratuitement. L'éditeur se réserve le droit de modifier ou d'interrompre tout ou partie du service à tout moment, sans préavis.</p>
          </section>

          <section>
            <h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">4. Contenus</h2>
            <p>Vous restez seul propriétaire des contenus que vous publiez (photos, vidéos, textes). Vous vous engagez à ne publier que des contenus dont vous détenez les droits et qui ne portent pas atteinte aux droits de tiers.</p>
            <p>Vous accordez à Histoire une licence non exclusive, gratuite, pour stocker, afficher et traiter vos contenus dans le cadre du service. Cette licence prend fin à la suppression de votre compte.</p>
            <p>Sont interdits : les contenus illicites, diffamatoires, portant atteinte à la dignité humaine, ou violant les droits de la propriété intellectuelle de tiers.</p>
          </section>

          <section>
            <h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">5. Partage entre partenaires</h2>
            <p>Les souvenirs que vous ajoutez sont visibles par vous et votre partenaire lié. Vous pouvez à tout moment délier votre partenaire depuis les paramètres de votre compte. Les souvenirs existants restent visibles par chacun, mais les nouveaux souvenirs ne seront plus partagés.</p>
          </section>

          <section>
            <h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">6. Suppression du compte</h2>
            <p>Conformément au RGPD, vous pouvez supprimer votre compte à tout moment depuis les paramètres. La suppression entraîne l'effacement définitif de tous vos souvenirs, photos, vidéos, messages et données personnelles. Cette action est irréversible.</p>
          </section>

          <section>
            <h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">7. Responsabilité</h2>
            <p>L'éditeur de l'Application ne saurait être tenu responsable des pertes de données, dommages indirects, ou interruption de service. L'Application est fournie « telle quelle », sans garantie d'aucune sorte. L'éditeur ne contrôle pas le contenu publié par les utilisateurs.</p>
          </section>

          <section>
            <h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">8. Données personnelles</h2>
            <p>Le traitement de vos données personnelles est régi par notre <Link to="/privacy" className="text-theme-primary hover:underline">Politique de Confidentialité</Link>, conforme au Règlement Général sur la Protection des Données (RGPD).</p>
          </section>

          <section>
            <h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">9. Modification des CGU</h2>
            <p>Les présentes CGU peuvent être modifiées à tout moment. Les utilisateurs seront informés des changements importants. L'utilisation continue de l'Application après modification vaut acceptation des nouvelles CGU.</p>
          </section>

          <section>
            <h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">10. Droit applicable</h2>
            <p>Les présentes CGU sont soumises au droit français. En cas de litige, les tribunaux français seront seuls compétents.</p>
          </section>
        </div>

        <div className="mt-10 flex gap-4">
          <Link to="/privacy" className="text-theme-primary hover:underline text-sm">Politique de confidentialité →</Link>
          <Link to="/" className="text-gray-500 hover:underline text-sm">Retour à l'accueil</Link>
        </div>
      </main>
    </div>
  );
}

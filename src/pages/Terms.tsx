import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="min-h-screen bg-theme-beige">
      <nav className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/favicon.svg" alt="MemoryLine" className="w-7 h-7" />
            <h1 className="text-2xl font-playfair font-bold text-theme-dark">MemoryLine</h1>
          </Link>
        </div>
      </nav>
      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-playfair font-bold text-theme-dark mb-2">Conditions Générales d'Utilisation</h1>
        <p className="text-sm text-gray-500 mb-8">Dernière mise à day : {new Date().toLocaleDateString('fr-FR')}</p>
        <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
          <section><h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">1. Objet</h2><p>Les présentes Conditions Générales d'Utilisation (« CGU ») régissent l'utilisation de l'application MemoryLine (« l'Application »), une plateforme de partage de souvenirs entre partenaires. En utilisant l'Application, vous acceptez les présentes CGU dans leur intégralité.</p></section>
          <section><h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">2. Inscription et compte</h2><p>L'utilisation de l'Application nécessite la création d'un compte personnel. Vous vous engagez à fournir des informations exactes lors de l'inscription. Vous êtes responsable de la confidentialité de vos identifiants. L'inscription est réservée aux personnes âgées de 16 ans et plus.</p></section>
          <section><h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">3. Service</h2><p>MemoryLine permet aux utilisateurs de créer une timeline de souvenirs (photos, vidéos, textes) et de la partager avec un partenaire lié. Les fonctionnalités incluent : messagerie, notes d'amour, calendrier d'anniversaires, statistiques, et notifications. Le service est fourni gratuitement.</p></section>
          <section><h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">4. Contenus</h2><p>Vous restez seul propriétaire des contenus que vous publiez. Vous vous engagez à ne publier que des contenus dont vous détenez les droits. Sont interdits : les contenus illicites, diffamatoires, ou violant les droits de tiers.</p></section>
          <section><h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">5. Suppression du compte</h2><p>Conformément au RGPD, vous pouvez supprimer votre compte à tout moment. La suppression entraîne l'effacement définitif de toutes vos données. Cette action est irréversible.</p></section>
          <section><h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">6. Responsabilité</h2><p>L'éditeur ne saurait être tenu responsable des pertes de données ou interruptions de service. L'Application est fournie « telle quelle ».</p></section>
          <section><h2 className="text-xl font-playfair font-bold text-theme-dark mb-2">7. Droit applicable</h2><p>Les présentes CGU sont soumises au droit français.</p></section>
        </div>
        <div className="mt-10 flex gap-4">
          <Link to="/privacy" className="text-theme-primary hover:underline text-sm">Politique de confidentialité →</Link>
          <Link to="/" className="text-gray-500 hover:underline text-sm">Back to home</Link>
        </div>
      </main>
    </div>
  );
}

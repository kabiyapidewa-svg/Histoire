import { motion } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  { q: 'Mes photos et vidéos sont-elles privées ?', a: "Oui, totalement. Vos souvenirs sont visibles uniquement par vous et votre partenaire lié. Les fichiers sont stockés dans un bucket privé avec URLs signées (valides 1h). Personne d'autre ne peut y accéder, pas même les administrateurs de Histoire." },
  { q: "L'application est-elle gratuite ?", a: "Oui, Histoire est entièrement gratuite. Vous pouvez créer un compte, ajouter autant de souvenirs que vous le souhaitez, inviter votre partenaire — sans payer un centime." },
  { q: 'Puis-je supprimer mon compte et mes données ?', a: "Oui, conformément au RGPD. Allez dans Compte → Zone dangereuse → Supprimer mon compte. Tous vos souvenirs, photos, vidéos et commentaires seront définitivement effacés de nos serveurs." },
  { q: "Que se passe-t-il si mon partenaire et moi rompons ?", a: "Vous pouvez à tout moment délier votre partenaire depuis la page Compte. Vos souvenirs restent visibles par chacun de votre côté, mais vous ne verrez plus les nouveaux souvenirs de l'autre. Vous pouvez aussi supprimer votre compte entièrement." },
  { q: 'Puis-je utiliser Histoire sur mobile ?', a: "Oui, l'application est entièrement responsive et optimisée pour mobile. Vous pouvez même l'installer comme une application native sur votre écran d'accueil (fonctionnalité PWA)." },
  { q: 'Quels types de fichiers puis-je ajouter ?', a: "Vous pouvez ajouter des photos (JPG, PNG, WebP, HEIC) jusqu'à 10 Mo et des vidéos (MP4, WebM, MOV) jusqu'à 100 Mo. Les métadonnées EXIF (GPS notamment) sont automatiquement supprimées pour protéger votre vie privée." },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <section className="py-24 bg-gradient-to-b from-white to-theme-pale">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.6 }} className="text-center mb-16">
          <span className="inline-block px-4 py-1 rounded-full bg-theme-soft text-theme-primary text-sm font-medium mb-4">Questions fréquentes</span>
          <h2 className="text-4xl md:text-5xl font-playfair font-bold text-theme-dark mb-4">Tout ce que vous voulez savoir</h2>
        </motion.div>
        <div className="space-y-4">
          {FAQS.map((faq, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.4, delay: i * 0.05 }} className="bg-white rounded-2xl shadow-sm border border-theme-soft overflow-hidden">
              <button onClick={() => setOpenIndex(openIndex === i ? null : i)} className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-theme-pale transition-colors">
                <span className="font-medium text-theme-dark pr-4">{faq.q}</span>
                <motion.div animate={{ rotate: openIndex === i ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
                  <ChevronDown className="w-5 h-5 text-theme-primary" />
                </motion.div>
              </button>
              <motion.div initial={false} animate={{ height: openIndex === i ? 'auto' : 0, opacity: openIndex === i ? 1 : 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                <p className="px-6 pb-4 text-gray-600 leading-relaxed">{faq.a}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

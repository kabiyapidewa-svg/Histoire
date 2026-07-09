import { motion } from 'framer-motion';
import { UserPlus, Link2, Heart } from 'lucide-react';

const STEPS = [
  { num: '01', icon: UserPlus, title: 'Créez votre compte', desc: 'Inscrivez-vous gratuitement en 30 secondes avec votre email. Vos données sont sécurisées.' },
  { num: '02', icon: Link2, title: 'Invitez votre partenaire', desc: "Saisissez l'email de votre moitié. Un lien d'invitation lui est envoyé. Quand il/elle accepte, vos comptes sont liés." },
  { num: '03', icon: Heart, title: 'Ajoutez vos souvenirs', desc: "Photos, vidéos, lieu, date, description. Chaque souvenir est partagé instantanément entre vous deux." },
];

export default function HowItWorks() {
  return (
    <section className="py-24 bg-gradient-to-b from-theme-pale to-white">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.6 }} className="text-center mb-16">
          <span className="inline-block px-4 py-1 rounded-full bg-white text-theme-primary text-sm font-medium mb-4 shadow-sm">Comment ça marche</span>
          <h2 className="text-4xl md:text-5xl font-playfair font-bold text-theme-dark mb-4">Votre histoire en 3 étapes</h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">Simple, rapide et gratuit. Commencez votre timeline aujourd'hui.</p>
        </motion.div>
        <div className="relative">
          <div className="hidden md:block absolute top-24 left-1/2 -translate-x-1/2 w-2/3 h-0.5 bg-gradient-to-r from-transparent via-theme-medium to-transparent" />
          <div className="grid md:grid-cols-3 gap-8 relative">
            {STEPS.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.6, delay: i * 0.15 }} className="relative text-center">
                <div className="relative mx-auto mb-6 w-24 h-24">
                  <div className="absolute inset-0 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <step.icon className="w-10 h-10 text-theme-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-theme-primary text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">{step.num}</div>
                </div>
                <h3 className="text-xl font-playfair font-bold text-theme-dark mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

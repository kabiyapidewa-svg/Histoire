import { motion } from 'framer-motion';
import { Camera, Heart, MessageCircle, Lock } from 'lucide-react';

const FEATURES = [
  { icon: Camera, title: 'Photo & Video Timeline', desc: "Add your memories in seconds. Photos, videos, location, date — everything organized automatically.", color: 'from-rose-400 to-pink-500' },
  { icon: Heart, title: 'Share with your partner', desc: "Invite your other half by email. Your memories are now shared: both can add, comment, and relive.", color: 'from-pink-500 to-rose-500' },
  { icon: MessageCircle, title: 'Comment together', desc: "Exchange comments on each memory. Relive the moments and add your personal touch.", color: 'from-fuchsia-400 to-rose-500' },
  { icon: Lock, title: 'Secure & private', desc: "Your memories are visible only to you and your partner. Encrypted data, signed URLs, GDPR compliant.", color: 'from-rose-500 to-red-500' },
];

export default function Features() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.6 }} className="text-center mb-16">
          <span className="inline-block px-4 py-1 rounded-full bg-theme-soft text-theme-primary text-sm font-medium mb-4">Features</span>
          <h2 className="text-4xl md:text-5xl font-playfair font-bold text-theme-dark mb-4">Everything for your love story</h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">An app designed for couples who want to preserve their precious moments together.</p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.5, delay: i * 0.1 }} whileHover={{ y: -8, transition: { duration: 0.2 } }} className="bg-gradient-to-br from-theme-pale to-white border border-theme-soft rounded-3xl p-6 hover:shadow-xl transition-shadow">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-playfair font-bold text-theme-dark mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

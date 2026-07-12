import { motion } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  { q: 'Are my photos and videos private?', a: "Yes, completely. Your memories are visible only to you and your linked partner. Files are stored in a private bucket with signed URLs (valid for 1 hour). No one else can access them, not even MemoryLine administrators." },
  { q: 'Is the app free?', a: "Yes, MemoryLine is completely free. You can create an account, add unlimited memories, invite your partner — without paying a cent." },
  { q: 'Can I delete my account and data?', a: "Yes, in accordance with GDPR. Go to Account → Danger Zone → Delete my account. All your memories, photos, videos and comments will be permanently deleted from our servers." },
  { q: 'What happens if my partner and I break up?', a: "You can unlink your partner at any time from the Account page. Your memories remain visible to each of you, but you will no longer see each other's new memories. You can also delete your account entirely." },
  { q: 'Can I use MemoryLine on mobile?', a: "Yes, the app is fully responsive and optimized for mobile. You can even install it as a native app on your home screen (PWA feature)." },
  { q: 'What file types can I upload?', a: "You can upload photos (JPG, PNG, WebP, HEIC) up to 10 MB and videos (MP4, WebM, MOV) up to 100 MB. EXIF metadata (including GPS) is automatically removed to protect your privacy." },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <section className="py-24 bg-gradient-to-b from-white to-theme-pale">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.6 }} className="text-center mb-16">
          <span className="inline-block px-4 py-1 rounded-full bg-theme-soft text-theme-primary text-sm font-medium mb-4">FAQ</span>
          <h2 className="text-4xl md:text-5xl font-playfair font-bold text-theme-dark mb-4">Everything you want to know</h2>
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

import { motion } from 'framer-motion';
import { Calendar, MapPin, MessageSquare } from 'lucide-react';

export default function Demo() {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.6 }} className="text-center mb-16">
          <span className="inline-block px-4 py-1 rounded-full bg-theme-soft text-theme-primary text-sm font-medium mb-4">Preview</span>
          <h2 className="text-4xl md:text-5xl font-playfair font-bold text-theme-dark mb-4">A beautiful timeline</h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">Each memory is showcased in an elegant chronological timeline.</p>
        </motion.div>
        <div className="relative">
          <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.8 }} className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-theme-soft">
              <div className="relative h-72 overflow-hidden">
                <img src="/demo-paris.jpg" alt="Our first trip to Paris" className="w-full h-full object-cover" />
                <div className="absolute top-4 right-4 px-3 py-1 bg-black/40 backdrop-blur text-white text-xs rounded-full">Photo</div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-sm text-theme-primary mb-2">
                  <Calendar className="w-4 h-4" />
                  <span>June 15, 2023</span>
                </div>
                <h3 className="text-2xl font-playfair font-bold text-theme-dark mb-2">Our first trip together</h3>
                <p className="text-gray-600 mb-3">A magical day exploring the city, followed by a romantic dinner with a beautiful view.</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1"><MapPin className="w-4 h-4" />Paris, France</div>
                  <div className="flex items-center gap-1"><MessageSquare className="w-4 h-4" />3 comments</div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 50, rotate: 8 }} whileInView={{ opacity: 0.5, x: 0, rotate: 6 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3 }} className="hidden lg:block absolute top-12 -right-12 w-64 bg-white rounded-2xl shadow-lg overflow-hidden z-0">
            <img src="/demo-meeting.jpg" alt="" className="w-full h-24 object-cover" />
            <div className="p-3">
              <p className="text-sm font-medium text-theme-dark">Our first meeting</p>
              <p className="text-xs text-gray-500">May 12, 2022</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -50, rotate: -8 }} whileInView={{ opacity: 0.5, x: 0, rotate: -6 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.5 }} className="hidden lg:block absolute bottom-12 -left-12 w-64 bg-white rounded-2xl shadow-lg overflow-hidden z-0">
            <img src="/demo-proposal.jpg" alt="" className="w-full h-24 object-cover" />
            <div className="p-3">
              <p className="text-sm font-medium text-theme-dark">The proposal</p>
              <p className="text-xs text-gray-500">December 8, 2023</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

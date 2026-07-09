import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Plus, User, Calendar, MapPin, Loader2, Image as ImageIcon, Film, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchMemoriesForCurrentUser, createMemory, uploadMedia, validateMemoryDate } from '../lib/memories';
import { getCouplePhotoUrl } from '../lib/profile';
import MediaViewer, { MediaTypeBadge } from '../components/MediaViewer';
import BottomNav from '../components/BottomNav';
import { createPreviewUrl, validateFiles, formatSize, MAX_IMAGE_SIZE, MAX_VIDEO_SIZE } from '../lib/image';
import type { Memory } from '../types';
import type { UploadProgress } from '../lib/memories';

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [memories, setMemories] = useState<Memory[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMemory, setNewMemory] = useState({ title: '', description: '', date: new Date().toISOString().split('T')[0], location: '' });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState('');
  const [couplePhotoUrl, setCouplePhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.couple_photo_path) getCouplePhotoUrl(profile.couple_photo_path).then(setCouplePhotoUrl);
    else setCouplePhotoUrl(null);
  }, [profile?.couple_photo_path]);

  const load = async (p: number, append: boolean) => {
    if (p === 0) setLoadingInitial(true); else setLoadingMore(true);
    try {
      const { memories: data, hasMore: more } = await fetchMemoriesForCurrentUser(p);
      setMemories(prev => append ? [...prev, ...data] : data);
      setHasMore(more);
      setPage(p);
    } catch (err: any) { setError(err?.message || t('errorGeneric')); }
    finally { setLoadingInitial(false); setLoadingMore(false); }
  };

  useEffect(() => { load(0, false); /* eslint-disable-next-line */ }, []);

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setError('');
    const dateErr = validateMemoryDate(newMemory.date);
    if (dateErr) { setError(dateErr); return; }
    if (selectedFiles.length > 0) { const v = validateFiles(selectedFiles); if (!v.ok) { setError(v.error || 'Fichier invalide'); return; } }
    setSaving(true);
    try {
      const memory = await createMemory({ user_id: profile.id, title: newMemory.title, description: newMemory.description, date: newMemory.date, location: newMemory.location });
      if (selectedFiles.length > 0) await uploadMedia(memory.id, profile.id, selectedFiles, setUploadProgress);
      setShowAddModal(false);
      setNewMemory({ title: '', description: '', date: new Date().toISOString().split('T')[0], location: '' });
      setSelectedFiles([]); setPreviews([]); setUploadProgress(null);
      await load(0, false);
    } catch (err: any) { setError(err?.message || t('errorGeneric')); }
    finally { setSaving(false); setUploadProgress(null); }
  };

  const handleFileSelect = (files: File[]) => {
    setError('');
    const v = validateFiles(files);
    if (!v.ok) { setError(v.error || 'Fichier invalide'); return; }
    setSelectedFiles(files);
    setPreviews(files.map(f => createPreviewUrl(f)));
  };

  const removeFile = (idx: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== idx);
    setSelectedFiles(newFiles);
    setPreviews(newFiles.map(f => createPreviewUrl(f)));
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  const progressPercent = useMemo(() => {
    if (!uploadProgress) return 0;
    return Math.round((uploadProgress.current - 1) / uploadProgress.totalFiles * 100 + uploadProgress.percent / uploadProgress.totalFiles);
  }, [uploadProgress]);

  return (
    <div className="min-h-screen bg-theme-beige pb-24 md:pb-0">
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Heart className="w-7 h-7 text-theme-primary" fill="currentColor" />
            <h1 className="text-2xl font-playfair font-bold text-theme-dark">{t('appName')}</h1>
          </Link>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowAddModal(true)} className="hidden md:flex items-center gap-2 bg-theme-primary text-white px-4 py-2 rounded-full font-medium hover:bg-theme-primary-hover transition">
              <Plus className="w-5 h-5" />{t('addMemory')}
            </button>
            <Link to="/account" className="p-2 rounded-full hover:bg-theme-pale transition"><User className="w-6 h-6 text-theme-dark" /></Link>
          </div>
        </div>
      </nav>

      {couplePhotoUrl && (
        <motion.div initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="relative h-48 md:h-64 overflow-hidden bg-theme-soft">
          <img src={couplePhotoUrl} alt="Photo de couple" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-4 left-6 text-white">
            <p className="text-sm opacity-90">{profile?.name}{profile?.partner_id ? ' & partenaire' : ''}</p>
            <p className="font-playfair text-xl font-semibold">Notre histoire</p>
          </div>
        </motion.div>
      )}

      <main className="max-w-4xl mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
          <h2 className="text-3xl font-playfair font-bold text-theme-dark mb-2">{t('welcome')}, {profile?.name}!</h2>
          <p className="text-gray-600">{profile?.partner_id ? 'Voici votre timeline partagée avec votre partenaire.' : 'Voici votre timeline. Invitez votre partenaire pour partager vos souvenirs.'}</p>
        </motion.div>

        {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-6">{error}</div>}

        {loadingInitial ? (
          <div className="text-center py-20"><Loader2 className="w-10 h-10 text-theme-primary animate-spin mx-auto mb-3" /><p className="text-gray-500">{t('loadingMemories')}</p></div>
        ) : (
          <div className="space-y-10">
            <AnimatePresence>
              {memories.map((memory, index) => {
                const firstMedia = memory.media?.[0];
                return (
                  <motion.div key={memory.id} layout initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4, delay: index * 0.08 }} className="relative">
                    {index !== memories.length - 1 && <div className="absolute left-8 top-24 bottom-0 w-0.5 bg-theme-medium"></div>}
                    <div className="flex gap-6">
                      <div className="w-16 h-16 bg-theme-primary rounded-full flex items-center justify-center flex-shrink-0 shadow-lg z-10"><Heart className="w-8 h-8 text-white" fill="currentColor" /></div>
                      <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }} className="flex-1 bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden cursor-pointer" onClick={() => navigate(`/memory/${memory.id}`)}>
                        {firstMedia && (
                          <div className="w-full h-80 bg-theme-pale overflow-hidden relative">
                            <MediaViewer media={firstMedia} alt={memory.title} className="w-full h-full object-cover" />
                            <div className="absolute top-3 right-3"><MediaTypeBadge type={firstMedia.type} /></div>
                          </div>
                        )}
                        <div className="p-6">
                          <div className="flex items-center gap-2 text-sm text-theme-primary mb-2"><Calendar className="w-4 h-4" /><span>{formatDate(memory.date)}</span></div>
                          <h3 className="text-xl font-playfair font-bold text-theme-dark mb-2">{memory.title}</h3>
                          <p className="text-gray-600 line-clamp-2">{memory.description}</p>
                          {memory.location && <div className="flex items-center gap-1 text-gray-500 mt-2"><MapPin className="w-4 h-4" /><span>{memory.location}</span></div>}
                          <div className="flex items-center gap-4 mt-3">
                            {memory.media && memory.media.length > 0 && (
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                <ImageIcon className="w-4 h-4" /> {memory.media.filter(m => m.type === 'image').length}
                                {memory.media.some(m => m.type === 'video') && <><Film className="w-4 h-4 ml-2" /> {memory.media.filter(m => m.type === 'video').length}</>}
                              </span>
                            )}
                            {memory.comments && memory.comments.length > 0 && <span className="text-sm text-theme-primary">{memory.comments.length} {t('comments')}</span>}
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {memories.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl shadow-sm">
                <Heart className="w-16 h-16 text-theme-medium mx-auto mb-4" />
                <h3 className="text-xl font-playfair font-semibold text-gray-700 mb-2">{t('noMemories')}</h3>
                <p className="text-gray-500 mb-6">{t('noMemoriesDesc')}</p>
                <button onClick={() => setShowAddModal(true)} className="px-6 py-2 bg-theme-primary text-white rounded-full font-medium hover:bg-theme-primary-hover transition">{t('addMemory')}</button>
              </div>
            )}
            {hasMore && (
              <div className="text-center pt-4">
                <button onClick={() => load(page + 1, true)} disabled={loadingMore} className="px-6 py-3 bg-white text-theme-primary rounded-full font-medium hover:bg-theme-pale transition shadow-sm disabled:opacity-60 flex items-center gap-2 mx-auto">
                  {loadingMore && <Loader2 className="w-5 h-5 animate-spin" />}{loadingMore ? t('loading') : 'Charger plus'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav onAddClick={() => setShowAddModal(true)} />

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100"><h3 className="text-2xl font-playfair font-bold text-theme-dark">{t('addMemory')}</h3></div>
            <form onSubmit={handleAddMemory} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('memoryTitle')}</label><input type="text" required value={newMemory.title} onChange={(e) => setNewMemory({ ...newMemory, title: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('date')}</label><input type="date" required max={new Date().toISOString().split('T')[0]} value={newMemory.date} onChange={(e) => setNewMemory({ ...newMemory, date: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('location')}</label><input type="text" value={newMemory.location} onChange={(e) => setNewMemory({ ...newMemory, location: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label><textarea rows={3} value={newMemory.description} onChange={(e) => setNewMemory({ ...newMemory, description: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400" /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('uploadMedia')}</label>
                <input type="file" multiple accept="image/*,video/*" onChange={(e) => handleFileSelect(Array.from(e.target.files || []))} className="w-full px-4 py-3 rounded-xl border border-gray-300" />
                <p className="text-xs text-gray-400 mt-1">{t('uploadMediaHint')} · Max image {MAX_IMAGE_SIZE / 1024 / 1024} Mo · Max vidéo {MAX_VIDEO_SIZE / 1024 / 1024} Mo</p>
                {previews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {previews.map((url, i) => { const file = selectedFiles[i]; const isVideo = file.type.startsWith('video/'); return (
                      <div key={i} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        {isVideo ? <video src={url} className="w-full h-full object-cover" muted /> : <img src={url} alt="" className="w-full h-full object-cover" />}
                        <div className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">{formatSize(file.size)}</div>
                        <button type="button" onClick={() => removeFile(i)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"><X className="w-3 h-3" /></button>
                      </div>
                    ); })}
                  </div>
                )}
                {uploadProgress && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1"><span>Upload {uploadProgress.current}/{uploadProgress.totalFiles} : {uploadProgress.fileName}</span><span>{progressPercent}%</span></div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-theme-primary transition-all duration-300" style={{ width: `${progressPercent}%` }} /></div>
                  </div>
                )}
              </div>
              {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowAddModal(false); setError(''); }} className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition">{t('cancel')}</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-theme-primary text-white rounded-xl font-medium hover:bg-theme-primary-hover transition disabled:opacity-60 flex items-center justify-center gap-2">{saving && <Loader2 className="w-5 h-5 animate-spin" />}{saving ? t('saving') : t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

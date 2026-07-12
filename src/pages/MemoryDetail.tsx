import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Heart, Calendar, MapPin, ArrowLeft, MessageSquare, Sparkles,
  Trash2, Loader2, X, Send, Plus, Edit2, Check,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchMemoryById, deleteMemory,
  uploadMedia, deleteMediaItem, addComment, deleteComment,
  updateMemoryRecap, updateMemory, validateMemoryDate,
} from '../lib/memories';
import MediaViewer from '../components/MediaViewer';
import {
  createPreviewUrl, validateFiles, formatSize, MAX_IMAGE_SIZE, MAX_VIDEO_SIZE,
} from '../lib/image';
import { MEMORY_CATEGORIES } from '../types';
import type { Memory, Comment } from '../types';
import type { UploadProgress } from '../lib/memories';

export default function MemoryDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentText, setCommentText] = useState('');
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [postingComment, setPostingComment] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // Édition du recap
  const [editingRecap, setEditingRecap] = useState(false);
  const [recapDraft, setRecapDraft] = useState('');
  const [savingRecap, setSavingRecap] = useState(false);

  // Édition du souvenir (titre, date, lieu, description, catégorie)
  const [editingMemory, setEditingMemory] = useState(false);
  const [editDraft, setEditDraft] = useState({ title: '', description: '', date: '', location: '', category: 'other' });
  const [savingEdit, setSavingEdit] = useState(false);

  const load = async () => {
    if (!id) return;
    try {
      const m = await fetchMemoryById(id);
      setMemory(m);
    } catch (err: any) {
      setError(err?.message || t('errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !id || !profile) return;
    setPostingComment(true);
    try {
      const c: Comment = await addComment(id, profile.id, commentText.trim());
      setMemory(m => m ? { ...m, comments: [...(m.comments ?? []), c] } : m);
      setCommentText('');
    } catch (err: any) {
      setError(err?.message || t('errorGeneric'));
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await deleteComment(commentId);
      setMemory(m => m ? { ...m, comments: (m.comments ?? []).filter(c => c.id !== commentId) } : m);
    } catch (err: any) {
      setError(err?.message || t('errorGeneric'));
    }
  };

  const handleDeleteMemory = async () => {
    if (!memory) return;
    if (!confirm(t('deleteMemoryConfirm'))) return;
    try {
      await deleteMemory(memory.id);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || t('errorGeneric'));
    }
  };

  const handleDeleteMedia = async (_mediaId: string, index: number) => {
    if (!memory) return;
    if (!confirm(t('deleteMediaConfirm'))) return;
    const media = memory.media?.[index];
    if (!media) return;
    try {
      await deleteMediaItem(media);
      setMemory(m => {
        if (!m) return m;
        const newMedia = (m.media ?? []).filter((_, i) => i !== index);
        return { ...m, media: newMedia };
      });
      if (selectedMediaIndex >= index && selectedMediaIndex > 0) {
        setSelectedMediaIndex(selectedMediaIndex - 1);
      }
    } catch (err: any) {
      setError(err?.message || t('errorGeneric'));
    }
  };

  const handleFileSelect = (files: File[]) => {
    setError('');
    const v = validateFiles(files);
    if (!v.ok) { setError(v.error || 'Fichier invalide'); return; }
    setExtraFiles(files);
    setPreviews(files.map(f => createPreviewUrl(f)));
  };

  const handleAddMedia = async () => {
    if (!memory || !profile || extraFiles.length === 0) return;
    setUploading(true);
    setError('');
    try {
      const newMedia = await uploadMedia(memory.id, profile.id, extraFiles, setUploadProgress);
      setMemory(m => m ? { ...m, media: [...(m.media ?? []), ...newMedia] } : m);
      setExtraFiles([]);
      setPreviews([]);
    } catch (err: any) {
      setError(err?.message || t('errorGeneric'));
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleSaveRecap = async () => {
    if (!memory) return;
    setSavingRecap(true);
    setError('');
    try {
      await updateMemoryRecap(memory.id, recapDraft.trim());
      setMemory(m => m ? { ...m, recap: recapDraft.trim() } : m);
      setEditingRecap(false);
    } catch (err: any) {
      setError(err?.message || t('errorGeneric'));
    } finally {
      setSavingRecap(false);
    }
  };

  const handleStartEdit = () => {
    if (!memory) return;
    setEditDraft({
      title: memory.title,
      description: memory.description,
      date: memory.date,
      location: memory.location,
      category: (memory.category ?? 'other') as string,
    });
    setEditingMemory(true);
  };

  const handleSaveEdit = async () => {
    if (!memory) return;
    setError('');
    if (!editDraft.title.trim()) { setError('Title is required.'); return; }
    if (editDraft.title.trim().length < 2) { setError('Title must be at least 2 characters long.'); return; }
    const dateErr = validateMemoryDate(editDraft.date);
    if (dateErr) { setError(dateErr); return; }
    setSavingEdit(true);
    try {
      await updateMemory(memory.id, {
        title: editDraft.title.trim(),
        description: editDraft.description,
        date: editDraft.date,
        location: editDraft.location,
        category: editDraft.category as any,
      });
      setMemory(m => m ? { ...m, title: editDraft.title.trim(), description: editDraft.description, date: editDraft.date, location: editDraft.location, category: editDraft.category as any } : m);
      setEditingMemory(false);
    } catch (err: any) {
      setError(err?.message || t('errorGeneric'));
    } finally {
      setSavingEdit(false);
    }
  };

  // ---- États ----
  if (loading) {
    return (
      <div className="min-h-screen bg-beige flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-rose-400 animate-spin mb-3" />
        <p className="text-gray-500">{t('loading')}</p>
      </div>
    );
  }

  if (!memory) {
    return (
      <div className="min-h-screen bg-beige flex flex-col items-center justify-center p-6">
        <Heart className="w-12 h-12 text-rose-300 mb-4" />
        <p className="text-gray-600 mb-4">{t('memoryNotFound')}</p>
        <button onClick={() => navigate('/dashboard')} className="text-rose-600 font-medium hover:underline">
          {t('backToDashboard')}
        </button>
      </div>
    );
  }

  const media = memory.media ?? [];
  const comments = memory.comments ?? [];
  const isOwner = profile?.id === memory.user_id;
  const progressPercent = uploadProgress
    ? Math.round((uploadProgress.current - 1) / uploadProgress.totalFiles * 100 + uploadProgress.percent / uploadProgress.totalFiles)
    : 0;

  return (
    <div className="min-h-screen bg-beige">
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-brun-doux transition"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('backToDashboard')}
          </button>
          {isOwner && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleStartEdit}
                className="flex items-center gap-2 px-4 py-2 bg-theme-primary hover:bg-theme-primary-hover text-white rounded-full font-medium transition"
              >
                <Edit2 className="w-4 h-4" />
                <span className="hidden sm:inline">Modifier</span>
              </button>
              <button
                onClick={handleDeleteMemory}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium transition"
              >
                <Trash2 className="w-5 h-5" />
                <span className="hidden sm:inline">{t('deleteMemory')}</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-6">{error}</div>}

        <div className="bg-white rounded-3xl shadow-md overflow-hidden">
          {/* Média principal */}
          {media.length > 0 && selectedMediaIndex < media.length && (
            <div className="w-full bg-rose-pale relative">
              <MediaViewer
                media={media[selectedMediaIndex]}
                alt={memory.title}
                className="w-full max-h-[600px] object-contain mx-auto"
              />
              {isOwner && (
                <button
                  onClick={() => handleDeleteMedia(media[selectedMediaIndex].id, selectedMediaIndex)}
                  className="absolute top-3 right-3 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition"
                  title={t('deleteMedia')}
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Ajout de médias supplémentaires (owner only) */}
          {isOwner && (
            <div className="p-4 bg-rose-50 border-b border-rose-100">
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 bg-white border border-rose-300 text-rose-600 rounded-full font-medium cursor-pointer hover:bg-rose-100 transition">
                  <Plus className="w-4 h-4" />
                  {t('uploadMedia')}
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(Array.from(e.target.files || []))}
                  />
                </label>
                {extraFiles.length > 0 && (
                  <>
                    <span className="text-sm text-gray-600">{extraFiles.length} {t('filesSelected')}</span>
                    <button
                      onClick={handleAddMedia}
                      disabled={uploading}
                      className="px-4 py-2 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition disabled:opacity-60 flex items-center gap-2"
                    >
                      {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {t('save')}
                    </button>
                  </>
                )}
              </div>

              {/* Previews */}
              {previews.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-3">
                  {previews.map((url, i) => {
                    const file = extraFiles[i];
                    const isVideo = file.type.startsWith('video/');
                    return (
                      <div key={i} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        {isVideo ? (
                          <video src={url} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        )}
                        <div className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                          {formatSize(file.size)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Progress bar */}
              {uploadProgress && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Upload {uploadProgress.current}/{uploadProgress.totalFiles} : {uploadProgress.fileName}</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-400 mt-2">
                Max image {MAX_IMAGE_SIZE / 1024 / 1024} Mo · Max vidéo {MAX_VIDEO_SIZE / 1024 / 1024} Mo
              </p>
            </div>
          )}

          {/* Miniatures */}
          {media.length > 1 && (
            <div className="flex gap-3 p-4 overflow-x-auto bg-rose-50">
              {media.map((item, index) => (
                <div key={item.id} className="relative group flex-shrink-0">
                  <MediaViewer
                    media={item}
                    alt={`${memory.title} ${index + 1}`}
                    thumbnail
                    className={`w-28 h-28 object-cover rounded-xl cursor-pointer transition ${
                      selectedMediaIndex === index ? 'ring-4 ring-rose-500' : 'hover:opacity-80'
                    }`}
                  />
                  {isOwner && (
                    <button
                      onClick={() => handleDeleteMedia(item.id, index)}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition"
                      title={t('deleteMedia')}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-8 h-8 text-rose-500" />
              <h1 className="text-3xl font-playfair font-bold text-brun-doux">{memory.title}</h1>
            </div>
            <div className="flex items-center gap-4 text-gray-600 mb-6 flex-wrap">
              <div className="flex items-center gap-1">
                <Calendar className="w-5 h-5" />
                <span>{formatDate(memory.date)}</span>
              </div>
              {memory.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-5 h-5" />
                  <span>{memory.location}</span>
                </div>
              )}
            </div>
            <p className="text-gray-700 leading-relaxed mb-8 whitespace-pre-wrap">{memory.description}</p>

            {/* Récap éditable */}
            <div className="mb-8 p-6 bg-rose-pale rounded-2xl border border-rose-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-playfair font-semibold text-brun-doux flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-rose-500" />
                  {t('recapTitle')}
                </h3>
                {isOwner && !editingRecap && (
                  <button
                    onClick={() => { setRecapDraft(memory.recap || ''); setEditingRecap(true); }}
                    className="text-rose-600 hover:text-rose-700 flex items-center gap-1 text-sm font-medium"
                  >
                    <Edit2 className="w-4 h-4" />
                    {memory.recap ? 'Modifier' : 'Add'}
                  </button>
                )}
              </div>
              {editingRecap ? (
                <div>
                  <textarea
                    value={recapDraft}
                    onChange={(e) => setRecapDraft(e.target.value)}
                    placeholder="Quelques mots pour résumer ce souvenir..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleSaveRecap}
                      disabled={savingRecap}
                      className="flex items-center gap-1 px-4 py-2 bg-rose-500 text-white rounded-full text-sm font-medium hover:bg-rose-600 transition disabled:opacity-60"
                    >
                      {savingRecap ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      {t('save')}
                    </button>
                    <button
                      onClick={() => setEditingRecap(false)}
                      className="px-4 py-2 text-gray-500 hover:text-brun-doux text-sm font-medium"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </div>
              ) : memory.recap ? (
                <p className="text-gray-700 italic">{memory.recap}</p>
              ) : (
                <p className="text-gray-400 text-sm italic">
                  {isOwner ? 'Aucun résumé pour le moment. Cliquez sur « Add ».' : 'Aucun résumé.'}
                </p>
              )}
            </div>

            <div className="border-t border-gray-100 pt-8">
              <h3 className="text-xl font-playfair font-bold text-brun-doux mb-6 flex items-center gap-2">
                <MessageSquare className="w-6 h-6" />
                {t('comments')} ({comments.length})
              </h3>
              <form onSubmit={handleAddComment} className="mb-8">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={t('writeComment')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  rows={3}
                />
                <button
                  type="submit"
                  disabled={postingComment || !commentText.trim()}
                  className="mt-3 bg-rose-500 text-white px-5 py-2 rounded-full font-medium hover:bg-rose-600 transition disabled:opacity-60 flex items-center gap-2"
                >
                  {postingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {t('sendComment')}
                </button>
              </form>

              <div className="space-y-4">
                {comments.map(comment => (
                  <div key={comment.id} className="bg-rose-pale rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-gray-700 whitespace-pre-wrap">{comment.text}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {comment.author_name && <span className="font-medium">{comment.author_name} · </span>}
                          {new Date(comment.created_at).toLocaleString()}
                        </p>
                      </div>
                      {profile?.id === comment.user_id && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-gray-400 hover:text-red-500 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-gray-500 text-center py-6">{t('noComments')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal d'édition du souvenir */}
      {editingMemory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-2xl font-playfair font-bold text-theme-dark">Edit memory</h3>
              <button onClick={() => setEditingMemory(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" value={editDraft.title} onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={editDraft.date} onChange={(e) => setEditDraft({ ...editDraft, date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lieu</label>
                <input type="text" value={editDraft.location} onChange={(e) => setEditDraft({ ...editDraft, location: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={editDraft.category} onChange={(e) => setEditDraft({ ...editDraft, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400">
                  {MEMORY_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.emoji} {cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows={3} value={editDraft.description} onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400" />
              </div>
              {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingMemory(false)} className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition">Cancel</button>
                <button onClick={handleSaveEdit} disabled={savingEdit} className="flex-1 px-4 py-3 bg-theme-primary text-white rounded-xl font-medium hover:bg-theme-primary-hover transition disabled:opacity-60 flex items-center justify-center gap-2">
                  {savingEdit && <Loader2 className="w-5 h-5 animate-spin" />} Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

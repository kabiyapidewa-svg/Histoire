import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import {
  User, ArrowLeft, LogOut, Globe, Heart, Loader2,
  Mail, Check, X, UserPlus, UserMinus, Link2, Send, Copy,
  Edit2, Trash2, AlertTriangle, Camera, Palette,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, THEMES, ThemeName } from '../contexts/ThemeContext';
import { signOut, deleteAccount } from '../lib/auth';
import {
  sendInvitation, resendInvitationEmail, fetchMySentInvitations, cancelInvitation,
  acceptInvitation, rejectInvitation, unlinkPartner, fetchPartner,
} from '../lib/partners';
import {
  updateUserTheme, uploadCouplePhoto, deleteCouplePhoto, getCouplePhotoUrl,
  updateProfileName,
} from '../lib/profile';
import { validateEmail } from '../lib/auth';
import { validateFile } from '../lib/image';
import type { PartnerInvitation, Profile } from '../types';

export default function Account() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();

  const [partner, setPartner] = useState<Profile | null>(null);
  const [invitations, setInvitations] = useState<PartnerInvitation[]>([]);
  const [partnerEmail, setPartnerEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [couplePhotoUrl, setCouplePhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);

  // Édition profil
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Suppression de compte
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const [p, invs] = await Promise.all([
        profile.partner_id ? fetchPartner(profile) : Promise.resolve(null),
        fetchMySentInvitations(),
      ]);
      setPartner(p);
      setInvitations(invs);
      if (profile.couple_photo_path) { const url = await getCouplePhotoUrl(profile.couple_photo_path); setCouplePhotoUrl(url); } else setCouplePhotoUrl(null);
    } catch (err: any) {
      setError(err?.message || t('errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [profile?.id]);

  const handleUploadCouplePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    const validation = validateFile(file);
    if (!validation.ok) { setError(validation.error || 'Fichier invalide'); return; }
    setUploadingPhoto(true); setError(''); setSuccess('');
    try {
      if (profile.couple_photo_path) { try { await deleteCouplePhoto(profile.id, profile.couple_photo_path); } catch {} }
      const newPath = await uploadCouplePhoto(profile.id, file);
      const url = await getCouplePhotoUrl(newPath);
      setCouplePhotoUrl(url);
      await refreshProfile();
      setSuccess('Photo de couple mise à jour !');
    } catch (err: any) { setError(err?.message || t('errorGeneric')); }
    finally { setUploadingPhoto(false); }
  };

  const handleDeleteCouplePhoto = async () => {
    if (!profile || !profile.couple_photo_path) return;
    if (!confirm('Supprimer la photo de couple ?')) return;
    setUploadingPhoto(true); setError('');
    try {
      await deleteCouplePhoto(profile.id, profile.couple_photo_path);
      setCouplePhotoUrl(null);
      await refreshProfile();
      setSuccess('Photo de couple supprimée.');
    } catch (err: any) { setError(err?.message || t('errorGeneric')); }
    finally { setUploadingPhoto(false); }
  };

  const handleThemeChange = async (newTheme: ThemeName) => {
    if (!profile) return;
    setTheme(newTheme);
    setSavingTheme(true); setError('');
    try {
      await updateUserTheme(profile.id, newTheme);
      await refreshProfile();
      setSuccess('Thème mis à jour !');
    } catch (err: any) { setError(err?.message || t('errorGeneric')); }
    finally { setSavingTheme(false); }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleSaveName = async () => {
    if (!profile || !nameDraft.trim()) return;
    setSavingName(true); setError('');
    try {
      await updateProfileName(profile.id, nameDraft.trim());
      await refreshProfile();
      setEditingName(false);
      setSuccess('Nom mis à jour.');
    } catch (err: any) {
      setError(err?.message || t('errorGeneric'));
    } finally {
      setSavingName(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER') {
      setError('Veuillez taper SUPPRIMER pour confirmer.');
      return;
    }
    setDeleting(true); setError('');
    try {
      await deleteAccount();
      navigate('/');
    } catch (err: any) {
      setError(err?.message || t('errorGeneric'));
    } finally {
      setDeleting(false);
    }
  };

  const handleInvite = async () => {
    if (!profile) return;
    setError(''); setSuccess('');
    const emailErr = validateEmail(partnerEmail);
    if (emailErr) { setError(emailErr); return; }
    setBusy(true);
    try {
      const result = await sendInvitation(profile.id, partnerEmail);
      if (result.emailSent) {
        setSuccess(t('inviteSent', { email: partnerEmail }));
      } else {
        // L'invitation a été créée en base mais l'email n'est pas parti
        setSuccess(`Invitation créée pour ${partnerEmail}. ` +
          (result.emailError
            ? `L'email n'a pas pu être envoyé automatiquement (${result.emailError}). Vous pouvez le renvoyer ci-dessous.`
            : "L'email n'a pas pu être envoyé automatiquement. Vous pouvez le renvoyer ci-dessous."));
      }
      setPartnerEmail('');
      await load();
    } catch (err: any) {
      setError(err?.message || t('errorGeneric'));
    } finally {
      setBusy(false);
    }
  };

  const handleResendEmail = async (invId: string) => {
    setBusy(true); setError(''); setSuccess('');
    try {
      const r = await resendInvitationEmail(invId);
      if (r.success) {
        setSuccess('Email d\'invitation renvoyé !');
      } else {
        setError('Échec de l\'envoi : ' + (r.error || 'erreur inconnue'));
      }
    } finally {
      setBusy(false);
    }
  };

  const handleCopyInviteLink = (invId: string) => {
    const link = `${window.location.origin}/invite/${invId}`;
    navigator.clipboard.writeText(link).then(() => {
      setSuccess('Lien d\'invitation copié dans le presse-papier :');
      setTimeout(() => setSuccess(''), 4000);
    }).catch(() => {
      setError('Impossible de copier le lien');
    });
  };

  const handleAccept = async (id: string, name?: string) => {
    setBusy(true); setError(''); setSuccess('');
    try {
      await acceptInvitation(id);
      await refreshProfile();
      setSuccess(t('invitationAccepted', { name: name ?? '' }));
      await load();
    } catch (err: any) {
      setError(err?.message || t('errorGeneric'));
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (id: string) => {
    setBusy(true); setError('');
    try {
      await rejectInvitation(id);
      await load();
    } catch (err: any) {
      setError(err?.message || t('errorGeneric'));
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Annuler cette invitation ?')) return;
    setBusy(true); setError('');
    try {
      await cancelInvitation(id);
      await load();
    } catch (err: any) {
      setError(err?.message || t('errorGeneric'));
    } finally {
      setBusy(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm(t('unlinkConfirm'))) return;
    setBusy(true); setError(''); setSuccess('');
    try {
      await unlinkPartner();
      await refreshProfile();
      setSuccess('Partenaire délié. Vos souvenirs ne sont plus partagés.');
      await load();
    } catch (err: any) {
      setError(err?.message || t('errorGeneric'));
    } finally {
      setBusy(false);
    }
  };

  const myEmail = profile?.email ?? '';
  const received = invitations.filter(
    i => i.status === 'pending' && i.invitee_email.toLowerCase() === myEmail.toLowerCase()
  );
  const sent = invitations.filter(
    i => i.status === 'pending' && i.invitee_email.toLowerCase() !== myEmail.toLowerCase()
  );

  return (
    <div className="min-h-screen bg-beige">
      <nav className="bg-white shadow-sm sticky top-0 z-10 md:hidden">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-brun-doux transition"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('backToDashboard')}
          </button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-6">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-6">{success}</div>}

        {/* Profil */}
        <div className="bg-white rounded-3xl shadow-md p-8 mb-6">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-rose-500" />
            </div>
            <div className="flex-1">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={savingName}
                    className="p-2 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition disabled:opacity-60"
                  >
                    {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setEditingName(false)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-playfair font-bold text-brun-doux">{profile?.name}</h2>
                  <button
                    onClick={() => { setNameDraft(profile?.name ?? ''); setEditingName(true); }}
                    className="text-gray-400 hover:text-rose-500 transition"
                    title="Modifier le nom"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              <p className="text-gray-500 text-sm break-all">{profile?.email}</p>
            </div>
          </div>

          {/* Statut partenaire */}
          <div className="border-b border-gray-100 pb-6 mb-6">
            <h3 className="text-lg font-semibold text-brun-doux mb-4 flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              {t('partnerStatus')}
            </h3>

            {loading ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin" /> {t('loading')}
              </div>
            ) : partner ? (
              <div className="bg-rose-pale rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 bg-rose-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-playfair font-semibold text-brun-doux truncate">{partner.name}</p>
                    <p className="text-sm text-gray-500 break-all">{partner.email}</p>
                    <p className="text-xs text-rose-600 mt-1">{t('partnerLinked')}</p>
                  </div>
                </div>
                <button
                  onClick={handleUnlink}
                  disabled={busy}
                  className="flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 rounded-full text-sm font-medium transition disabled:opacity-60 flex-shrink-0 self-start sm:self-auto"
                >
                  <UserMinus className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('unlinkPartner')}</span>
                  <span className="sm:hidden">Délier</span>
                </button>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">{t('noPartner')}</p>
            )}
          </div>

          {/* Inviter un partenaire (si pas déjà lié) */}
          {!partner && (
            <div className="border-b border-gray-100 pb-6 mb-6">
              <h3 className="text-lg font-semibold text-brun-doux mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                {t('invitePartner')}
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                Votre partenaire devra créer un compte avec cet email, puis accepter votre invitation.
              </p>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                  placeholder={t('partnerEmail')}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
                <button
                  onClick={handleInvite}
                  disabled={busy}
                  className="px-5 py-3 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition disabled:opacity-60 flex items-center gap-2"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  {t('invitePartner')}
                </button>
              </div>
            </div>
          )}

          {/* Notifications push */}
          <PushNotificationSection />

          {/* Photo de couple */}
          <div className="border-b border-gray-100 pb-6 mb-6">
            <h3 className="text-lg font-semibold text-brun-doux mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Photo de couple
            </h3>
            <p className="text-sm text-gray-500 mb-4">Cette photo apparaîtra en couverture sur votre Dashboard.</p>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-rose-pale flex items-center justify-center border-2 border-rose-doux">
                {couplePhotoUrl ? <img src={couplePhotoUrl} alt="Photo de couple" className="w-full h-full object-cover" /> : <Heart className="w-10 h-10 text-rose-300" />}
              </div>
              <div className="flex flex-col gap-2">
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-full font-medium cursor-pointer hover:bg-rose-600 transition text-sm">
                  {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  {couplePhotoUrl ? 'Changer la photo' : 'Ajouter une photo'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleUploadCouplePhoto} disabled={uploadingPhoto} />
                </label>
                {couplePhotoUrl && <button onClick={handleDeleteCouplePhoto} disabled={uploadingPhoto} className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-full text-sm font-medium transition disabled:opacity-60">Supprimer</button>}
              </div>
            </div>
          </div>

          {/* Thème personnalisable */}
          <div className="border-b border-gray-100 pb-6 mb-6">
            <h3 className="text-lg font-semibold text-brun-doux mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Thème de l'application
              {savingTheme && <Loader2 className="w-4 h-4 animate-spin text-rose-500" />}
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
              {THEMES.map(t => (
                <button key={t.name} onClick={() => handleThemeChange(t.name)} className={`p-2 sm:p-3 rounded-2xl border-2 transition-all ${theme.name === t.name ? 'border-rose-500 shadow-md scale-105' : 'border-gray-200 hover:border-rose-300'}`}>
                  <div className="w-full h-10 sm:h-12 rounded-lg mb-1 sm:mb-2 flex items-center justify-center text-lg sm:text-xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${t.colors.pale}, ${t.colors.primary})` }}>{t.emoji}</div>
                  <p className="text-[10px] sm:text-xs font-medium text-brun-doux text-center leading-tight">{t.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Langue */}
          <div>
            <h3 className="text-lg font-semibold text-brun-doux mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Language
            </h3>
            <select value={i18n.language} onChange={(e) => i18n.changeLanguage(e.target.value)} className="px-4 py-3 rounded-xl border border-gray-300 w-full max-w-xs">
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </div>
        </div>

        {/* Invitations reçues */}
        {received.length > 0 && (
          <div className="bg-white rounded-3xl shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-brun-doux mb-4">{t('receivedInvitations')}</h3>
            <div className="space-y-3">
              {received.map(inv => (
                <div key={inv.id} className="flex items-center justify-between bg-rose-pale rounded-xl p-4">
                  <div>
                    <p className="font-medium text-brun-doux">
                      {inv.inviter_name ?? 'Un utilisateur'} vous a invité(e)
                    </p>
                    <p className="text-xs text-gray-500">{new Date(inv.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(inv.id, inv.inviter_name)}
                      disabled={busy}
                      className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded-full text-sm font-medium hover:bg-green-600 transition disabled:opacity-60"
                    >
                      <Check className="w-4 h-4" /> {t('accept')}
                    </button>
                    <button
                      onClick={() => handleReject(inv.id)}
                      disabled={busy}
                      className="flex items-center gap-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-300 transition disabled:opacity-60"
                    >
                      <X className="w-4 h-4" /> {t('reject')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invitations envoyées en attente */}
        {sent.length > 0 && !partner && (
          <div className="bg-white rounded-3xl shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-brun-doux mb-4">{t('sentInvitations')}</h3>
            <div className="space-y-3">
              {sent.map(inv => (
                <div key={inv.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-medium text-brun-doux">{inv.invitee_email}</p>
                      <p className="text-xs text-gray-500">En attente · {new Date(inv.created_at).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => handleCancel(inv.id)}
                      disabled={busy}
                      className="text-red-500 hover:bg-red-50 px-3 py-2 rounded-full text-sm font-medium transition disabled:opacity-60"
                    >
                      {t('cancelInvite')}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => handleResendEmail(inv.id)}
                      disabled={busy}
                      className="flex items-center gap-1 px-3 py-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-full text-xs font-medium transition disabled:opacity-60"
                    >
                      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      Renvoyer l'email
                    </button>
                    <button
                      onClick={() => handleCopyInviteLink(inv.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-full text-xs font-medium transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copier le lien
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Déconnexion */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-white text-red-500 py-4 rounded-2xl shadow-sm hover:bg-red-50 transition font-medium mb-6"
        >
          <LogOut className="w-5 h-5" />
          {t('logout')}
        </button>

        {/* Zone dangereuse — RGPD */}
        <div className="bg-red-50 border border-red-200 rounded-3xl p-6">
          <h3 className="text-lg font-semibold text-red-700 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Zone dangereuse
          </h3>
          <p className="text-sm text-red-600 mb-4">
            La suppression de votre compte est <strong>irréversible</strong>. Tous vos
            souvenirs, photos, vidéos et commentaires seront définitivement effacés.
            Cette action respecte le RGPD (droit à l'oubli).
          </p>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-red-300 text-red-600 rounded-full text-sm font-medium hover:bg-red-100 transition"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer mon compte
            </button>
          ) : (
            <div className="bg-white rounded-2xl p-4 border border-red-200">
              <p className="text-sm text-gray-700 mb-3">
                Pour confirmer, tapez <strong className="text-red-600">SUPPRIMER</strong> ci-dessous :
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="SUPPRIMER"
                className="w-full px-3 py-2 rounded-lg border border-red-300 focus:outline-none focus:ring-2 focus:ring-red-400 mb-3"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting || deleteConfirmText !== 'SUPPRIMER'}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full text-sm font-medium hover:bg-red-700 transition disabled:opacity-60"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {deleting ? 'Suppression…' : 'Confirmer la suppression'}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Section notifications push native — permet à l'utilisateur d'activer les
// notifications push (qui apparaissent même quand l'app est fermée).
import { useState as useState2 } from 'react';
import { Bell, BellOff, Loader2 as Loader2_2, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  getVapidStatus, subscribeToPush, unsubscribeFromPush, isSubscribedToPush,
} from '../lib/pushNotifications';

function PushNotificationSection() {
  const [status, setStatus] = useState2<{ supported: boolean; vapidConfigured: boolean; reason?: string }>({ supported: false, vapidConfigured: false, reason: '' });
  const [subscribed, setSubscribed] = useState2(false);
  const [loading, setLoading] = useState2(true);
  const [error, setError] = useState2('');
  const [success, setSuccess] = useState2('');

  useEffect(() => {
    setStatus(getVapidStatus());
    isSubscribedToPush().then(setSubscribed).finally(() => setLoading(false));
  }, []);

  const handleToggle = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      if (subscribed) {
        await unsubscribeFromPush();
        setSubscribed(false);
        setSuccess('Notifications push désactivées.');
      } else {
        const result = await subscribeToPush();
        if (result.success) {
          setSubscribed(true);
          setSuccess('Notifications push activées ! Vous recevrez les messages même quand l\'app est fermée.');
        } else {
          setError(result.error || 'Impossible d\'activer les notifications.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-b border-gray-100 pb-6 mb-6">
      <h3 className="text-lg font-semibold text-brun-doux mb-4 flex items-center gap-2">
        <Bell className="w-5 h-5" />
        Notifications push
      </h3>

      {/* Cas 1 : navigateur non supporté */}
      {!status.supported && (
        <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-700">Notifications push non supportées</p>
            <p className="text-sm text-gray-500 mt-1">
              Votre navigateur ne supporte pas les notifications push natives.
              Utilisez Chrome, Edge ou Firefox (pas Safari iOS pour l'instant).
              Vous recevrez quand même les notifications in-app (toasts + badges).
            </p>
          </div>
        </div>
      )}

      {/* Cas 2 et 3 : navigateur OK → bouton Activer (la clé VAPID est hardcodée, plus de souci de config) */}
      {status.supported && (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Recevez les nouveaux messages et notes d'amour même quand l'app est fermée.
          </p>
          {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-3 text-sm">{error}</div>}
          {success && (
            <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-3 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {success}
            </div>
          )}
          <button
            onClick={handleToggle}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition text-sm disabled:opacity-60 ${
              subscribed
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-rose-500 text-white hover:bg-rose-600'
            }`}
          >
            {loading ? <Loader2_2 className="w-4 h-4 animate-spin" /> : subscribed ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            {subscribed ? 'Désactiver les notifications' : 'Activer les notifications push'}
          </button>
        </>
      )}
    </div>
  );
}

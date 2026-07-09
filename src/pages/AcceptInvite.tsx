import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, Loader2, CheckCircle2, XCircle, UserCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { acceptInvitation } from '../lib/partners';
import type { PartnerInvitation } from '../types';

export default function AcceptInvite() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session, profile, loading: authLoading, refreshProfile } = useAuth();

  const [invitation, setInvitation] = useState<PartnerInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) { setError(t('invitationInvalid')); setLoading(false); return; }
      const { data, error } = await supabase
        .from('partner_invitations')
        .select('*, inviter:profiles!partner_invitations_inviter_id_fkey(name, email)')
        .eq('id', id)
        .maybeSingle();
      if (error) { setError(error.message); setLoading(false); return; }
      if (!data) { setError(t('invitationInvalid')); setLoading(false); return; }
      setInvitation({
        id: data.id,
        inviter_id: data.inviter_id,
        invitee_email: data.invitee_email,
        status: data.status,
        created_at: data.created_at,
        inviter_name: data.inviter?.name,
      });
      setLoading(false);
    })();
  }, [id, t]);

  const handleAccept = async () => {
    if (!id) return;
    setAccepting(true);
    setError('');
    try {
      await acceptInvitation(id);
      await refreshProfile();
      setAccepted(true);
      setTimeout(() => navigate('/dashboard'), 2500);
    } catch (err: any) {
      setError(err?.message || t('errorGeneric'));
    } finally {
      setAccepting(false);
    }
  };

  // ---- États d'affichage ----

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-rose-pale flex flex-col items-center justify-center">
        <Heart className="w-12 h-12 text-rose-500 animate-pulse mb-4" />
        <p className="text-brun-doux font-medium">{t('checkingInvitation')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <CenteredCard>
        <XCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-playfair font-bold text-brun-doux mb-2">{t('invitationInvalid')}</h2>
        <p className="text-gray-600 text-sm mb-6">{error}</p>
        <Link to="/auth/login" className="text-rose-600 font-medium hover:underline">{t('backToLogin')}</Link>
      </CenteredCard>
    );
  }

  if (accepted) {
    return (
      <CenteredCard>
        <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-playfair font-bold text-brun-doux mb-2">
          {t('invitationAccepted', { name: invitation?.inviter_name ?? '' })}
        </h2>
        <p className="text-gray-600 text-sm mb-6">Redirection vers votre timeline…</p>
      </CenteredCard>
    );
  }

  // Invitation déjà traitée
  if (invitation?.status === 'accepted') {
    return (
      <CenteredCard>
        <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-playfair font-bold text-brun-doux mb-2">{t('invitationAlreadyAccepted')}</h2>
        <Link to="/dashboard" className="text-rose-600 font-medium hover:underline">{t('backToDashboard')}</Link>
      </CenteredCard>
    );
  }
  if (invitation?.status === 'rejected' || invitation?.status === 'cancelled') {
    return (
      <CenteredCard>
        <XCircle className="w-14 h-14 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-playfair font-bold text-brun-doux mb-2">{t('invitationAlreadyAccepted')}</h2>
        <Link to="/dashboard" className="text-rose-600 font-medium hover:underline">{t('backToDashboard')}</Link>
      </CenteredCard>
    );
  }

  // Utilisateur non connecté
  if (!session || !profile) {
    return (
      <CenteredCard>
        <UserCheck className="w-14 h-14 text-rose-500 mx-auto mb-4" />
        <h2 className="text-2xl font-playfair font-bold text-brun-doux mb-2">{t('acceptInvitation')}</h2>
        <p className="text-gray-600 mb-6">
          {t('acceptInvitationDesc', { name: invitation?.inviter_name ?? '' })}
        </p>
        <p className="text-gray-500 text-sm mb-6">{t('loginToAccept')}</p>
        <div className="flex flex-col gap-3">
          <Link
            to={`/auth/login?redirect=/invite/${id}`}
            className="px-6 py-3 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition text-center"
          >
            {t('login')}
          </Link>
          <Link
            to={`/auth/register?email=${encodeURIComponent(invitation?.invitee_email ?? '')}`}
            className="px-6 py-3 border border-rose-300 text-rose-600 rounded-xl font-medium hover:bg-rose-50 transition text-center"
          >
            {t('register')}
          </Link>
        </div>
      </CenteredCard>
    );
  }

  // Utilisateur connecté mais ce n'est pas son email
  if (profile.email.toLowerCase() !== invitation!.invitee_email.toLowerCase()) {
    return (
      <CenteredCard>
        <XCircle className="w-14 h-14 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-playfair font-bold text-brun-doux mb-2">Email différent</h2>
        <p className="text-gray-600 text-sm mb-2">
          Cette invitation a été envoyée à <strong>{invitation!.invitee_email}</strong>,
          mais vous êtes connecté(e) avec <strong>{profile.email}</strong>.
        </p>
        <p className="text-gray-500 text-sm mb-6">
          Déconnectez-vous puis créez un compte avec l'email invité.
        </p>
        <Link to="/auth/login" className="text-rose-600 font-medium hover:underline">{t('backToLogin')}</Link>
      </CenteredCard>
    );
  }

  // Cas nominal : invitation pending + utilisateur connecté + bon email
  return (
    <CenteredCard>
      <Heart className="w-12 h-12 text-rose-500 mx-auto mb-4" />
      <h2 className="text-2xl font-playfair font-bold text-brun-doux mb-3 text-center">{t('acceptInvitation')}</h2>
      <div className="bg-rose-pale rounded-2xl p-4 mb-6 text-center">
        <p className="text-gray-700">
          {t('acceptInvitationDesc', { name: invitation?.inviter_name ?? invitation?.inviter_id ?? '' })}
        </p>
      </div>
      {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleAccept}
          disabled={accepting}
          className="px-6 py-3 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {accepting && <Loader2 className="w-5 h-5 animate-spin" />}
          {accepting ? t('saving') : t('accept')}
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-3 text-gray-500 hover:text-brun-doux font-medium"
        >
          {t('cancel')}
        </button>
      </div>
    </CenteredCard>
  );
}

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-rose-pale flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">{children}</div>
    </div>
  );
}

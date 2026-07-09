import { supabase } from './supabase';
import type { Profile, PartnerInvitation } from '../types';

// ----------------------------------------------------------------------------
// PROFIL PARTENAIRE
// ----------------------------------------------------------------------------

export async function fetchPartner(profile: Profile): Promise<Profile | null> {
  if (!profile.partner_id) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profile.partner_id)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

// ----------------------------------------------------------------------------
// INVITATIONS
// ----------------------------------------------------------------------------

export async function sendInvitation(
  inviterId: string,
  inviteeEmail: string,
  options?: { sendEmail?: boolean }
): Promise<{ invitationId: string; emailSent: boolean; emailError?: string }> {
  // On refuse d'inviter soi-même
  const { data: me } = await supabase.auth.getUser();
  if (me?.user?.email?.toLowerCase() === inviteeEmail.toLowerCase().trim()) {
    throw new Error("Vous ne pouvez pas vous inviter vous-même.");
  }

  // 1. Insère la ligne (avec .select() pour récupérer l'id)
  const { data, error } = await supabase
    .from('partner_invitations')
    .insert({
      inviter_id: inviterId,
      invitee_email: inviteeEmail.toLowerCase().trim(),
      status: 'pending',
    })
    .select('id')
    .single();
  if (error) {
    if (error.code === '23505') {
      throw new Error('Une invitation est déjà en attente pour cet email.');
    }
    throw error;
  }
  const invitationId = data.id;

  // 2. Déclenche l'Edge Function d'envoi d'email (sauf si désactivé explicitement)
  const shouldSendEmail = options?.sendEmail ?? true;
  if (!shouldSendEmail) {
    return { invitationId, emailSent: false };
  }

  let emailSent = false;
  let emailError: string | undefined;
  try {
    const { error: fnErr } = await supabase.functions.invoke(
      'send-invitation-email',
      { body: { invitation_id: invitationId } }
    );
    if (fnErr) {
      emailError = fnErr.message;
    } else {
      emailSent = true;
    }
  } catch (e: any) {
    emailError = e?.message || 'Erreur inconnue';
  }

  return { invitationId, emailSent, emailError };
}

/** Renvoie l'email d'invitation (utile si le premier envoi a échoué). */
export async function resendInvitationEmail(invitationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.functions.invoke(
      'send-invitation-email',
      { body: { invitation_id: invitationId } }
    );
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Erreur inconnue' };
  }
}

export async function fetchMySentInvitations(): Promise<PartnerInvitation[]> {
  const { data, error } = await supabase
    .from('partner_invitations')
    .select('*, inviter:profiles!partner_invitations_inviter_id_fkey(name)')
    .order('created_at', { ascending: false });
  if (error) throw error;

  // RLS ne renvoie que mes invitations (envoyées + reçues)
  return (data ?? []).map((row: any) => ({
    id: row.id,
    inviter_id: row.inviter_id,
    invitee_email: row.invitee_email,
    status: row.status,
    created_at: row.created_at,
    inviter_name: row.inviter?.name,
  })) as PartnerInvitation[];
}

export async function acceptInvitation(invitationId: string): Promise<void> {
  const { error } = await supabase.rpc('accept_partner_invitation', {
    p_invitation_id: invitationId,
  });
  if (error) throw error;
}

export async function rejectInvitation(invitationId: string): Promise<void> {
  const { error } = await supabase
    .from('partner_invitations')
    .update({ status: 'rejected' })
    .eq('id', invitationId);
  if (error) throw error;
}

export async function cancelInvitation(invitationId: string): Promise<void> {
  const { error } = await supabase
    .from('partner_invitations')
    .delete()
    .eq('id', invitationId);
  if (error) throw error;
}

export async function unlinkPartner(): Promise<void> {
  const { error } = await supabase.rpc('unlink_partner');
  if (error) throw error;
}

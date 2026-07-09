import { supabase } from './supabase';

// Redirige après Google OAuth vers le dashboard.
const GOOGLE_REDIRECT_TO = `${window.location.origin}/auth/callback`;

export async function signUpWithEmail(email: string, password: string, name: string) {
  // Supabase crée l'utilisateur dans auth.users, et le trigger
  // handle_new_user (cf. schema.sql) crée automatiquement la ligne profiles.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },                 // stocké dans raw_user_meta_data
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: GOOGLE_REDIRECT_TO },
  });
  if (error) throw error;
  return data;
}

export async function sendPasswordReset(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  if (error) throw error;
  return data;
}

export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

/**
 * Supprime définitivement le compte (RGPD) via l'Edge Function delete-account.
 * L'Edge Function supprime : fichiers Storage → données SQL → auth.users.
 * Au retour, on signout côté client pour vider la session.
 */
export async function deleteAccount(): Promise<{ deletedFiles: number }> {
  const { data, error } = await supabase.functions.invoke('delete-account', {
    body: {},
  });
  if (error) {
    throw new Error(error.message || 'Échec de la suppression du compte');
  }
  if (!data?.success) {
    throw new Error(data?.error || 'Échec de la suppression du compte');
  }
  // Sign out local (la session n'est plus valide côté serveur)
  await supabase.auth.signOut();
  return { deletedFiles: data.deleted_files ?? 0 };
}

// Validation côté client (vrais emails + vrais mots de passe)
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email requis';
  if (!EMAIL_REGEX.test(email)) return 'Adresse email invalide';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Mot de passe requis';
  if (password.length < 8) return 'Le mot de passe doit faire au moins 8 caractères';
  if (!/[a-z]/.test(password)) return 'Le mot de passe doit contenir une lettre minuscule';
  if (!/[A-Z]/.test(password)) return 'Le mot de passe doit contenir une lettre majuscule';
  if (!/[0-9]/.test(password)) return 'Le mot de passe doit contenir un chiffre';
  return null;
}

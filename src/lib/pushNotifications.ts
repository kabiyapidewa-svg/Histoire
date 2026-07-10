import { supabase } from './supabase';

// VAPID public key — injectée par Vercel au build via VITE_VAPID_PUBLIC_KEY
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** Vérifie si le navigateur supporte techniquement les notifications push. */
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && window.isSecureContext;
}

/** Vérifie si la clé VAPID est configurée côté serveur. */
export function isVapidConfigured(): boolean {
  return Boolean(VAPID_PUBLIC_KEY) && VAPID_PUBLIC_KEY!.length > 10;
}

/** Renvoie la clé VAPID publique (pour debug). */
export function getVapidStatus(): { supported: boolean; vapidConfigured: boolean; reason?: string } {
  if (!isPushSupported()) {
    return { supported: false, vapidConfigured: false, reason: 'browser' };
  }
  if (!isVapidConfigured()) {
    return { supported: true, vapidConfigured: false, reason: 'vapid' };
  }
  return { supported: true, vapidConfigured: true };
}

/** Demande la permission d'envoyer des notifications. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/** Vérifie si la permission a déjà été accordée. */
export function hasNotificationPermission(): boolean {
  return 'Notification' in window && Notification.permission === 'granted';
}

/** Souscrit l'utilisateur aux notifications push. */
export async function subscribeToPush(): Promise<{ success: boolean; error?: string }> {
  if (!isPushSupported()) {
    return { success: false, error: 'Votre navigateur ne supporte pas les notifications push.' };
  }
  if (!isVapidConfigured()) {
    return { success: false, error: 'La clé VAPID n\'est pas configurée sur le serveur. Vérifiez que VITE_VAPID_PUBLIC_KEY est bien définie dans Vercel (Environment Variables) et que Vercel a redéployé.' };
  }

  if (!hasNotificationPermission()) {
    const granted = await requestNotificationPermission();
    if (!granted) return { success: false, error: 'Permission de notification refusée.' };
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      const key = urlBase64ToUint8Array(VAPID_PUBLIC_KEY!);
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key.buffer as ArrayBuffer,
      });
    }

    // Envoie la subscription au serveur
    const sub = subscription.toJSON();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return { success: false, error: 'Non connecté.' };

    // Supprime les anciennes subscriptions de cet user sur ce device
    await supabase.from('push_subscriptions').delete().eq('user_id', userData.user.id);

    const { error: insertErr } = await supabase.from('push_subscriptions').insert({
      user_id: userData.user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys?.p256dh ?? '',
      auth: sub.keys?.auth ?? '',
      user_agent: navigator.userAgent,
    });

    if (insertErr) return { success: false, error: 'Erreur base de données: ' + insertErr.message };

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erreur inconnue lors de la souscription.' };
  }
}

/** Désouscrit l'utilisateur des notifications push. */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) await subscription.unsubscribe();

    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      await supabase.from('push_subscriptions').delete().eq('user_id', userData.user.id);
    }
    return true;
  } catch (err) {
    return false;
  }
}

/** Vérifie si l'utilisateur est déjà souscrit. */
export async function isSubscribedToPush(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    return Boolean(subscription);
  } catch {
    return false;
  }
}

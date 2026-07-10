import { supabase } from './supabase';

// VAPID public key — à définir dans les secrets Supabase
// Pour l'instant on lit depuis une variable d'env (coté serveur via Edge Function)
// Côté client, on a juste besoin de la clé publique.

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

/** Vérifie si les notifications push sont supportées par le navigateur. */
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && Boolean(VAPID_PUBLIC_KEY);
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
export async function subscribeToPush(): Promise<boolean> {
  if (!isPushSupported()) return false;
  if (!hasNotificationPermission()) {
    const granted = await requestNotificationPermission();
    if (!granted) return false;
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
    if (!userData.user) return false;

    // Supprime les anciennes subscriptions de cet user sur ce device
    await supabase.from('push_subscriptions').delete().eq('user_id', userData.user.id);

    await supabase.from('push_subscriptions').insert({
      user_id: userData.user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys?.p256dh ?? '',
      auth: sub.keys?.auth ?? '',
      user_agent: navigator.userAgent,
    });

    return true;
  } catch (err) {
    console.error('[push] subscribe error:', err);
    return false;
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
    console.error('[push] unsubscribe error:', err);
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

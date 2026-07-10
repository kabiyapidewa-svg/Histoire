// ============================================================================
//  Edge Function : send-push-notification
//
//  Envoie une notification push native à un utilisateur via Web Push API.
//  Utilise la bibliothèque web-push (chargée dynamiquement).
//
//  Secrets requis :
//    - VAPID_PUBLIC_KEY
//    - VAPID_PRIVATE_KEY
//    - VAPID_SUBJECT   (mailto: ou https://)
//    - SUPABASE_URL
//    - SUPABASE_SERVICE_ROLE_KEY
// ============================================================================

// @ts-nocheck (Deno runtime)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:contact@histoire.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return json({ error: "Server misconfigured (VAPID keys missing)" }, 500);
  }

  // Auth : JWT utilisateur obligatoire
  const authHeader = req.headers.get("Authorization") ?? "";
  const userJwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!userJwt) return json({ error: "Unauthorized" }, 401);

  let body: { target_user_id?: string; title?: string; body?: string; url?: string } = {};
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  if (!body.target_user_id) return json({ error: "target_user_id required" }, 400);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Vérifie le JWT
  const { data: userData, error: userErr } = await admin.auth.getUser(userJwt);
  if (userErr || !userData?.user) return json({ error: "Invalid token" }, 401);
  const callerId = userData.user.id;

  // Vérifie que target_user_id est bien le partenaire du caller
  const { data: callerProfile } = await admin.from("profiles").select("partner_id").eq("id", callerId).maybeSingle();
  if (!callerProfile?.partner_id || callerProfile.partner_id !== body.target_user_id) {
    return json({ error: "Forbidden — target must be your partner" }, 403);
  }

  // Récupère les subscriptions du target
  const { data: subs, error: subsErr } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", body.target_user_id);
  if (subsErr || !subs || subs.length === 0) {
    return json({ error: "Target has no push subscription", sent: 0 }, 200);
  }

  // Charge web-push dynamiquement
  const webpush = await import("https://esm.sh/web-push@3.6.7");

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const payload = JSON.stringify({
    title: body.title ?? "Histoire",
    body: body.body ?? "",
    url: body.url ?? "/dashboard",
  });

  let sent = 0;
  let failed = 0;

  for (const sub of subs) {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    };
    try {
      await webpush.sendNotification(pushSubscription, payload);
      sent++;
    } catch (err: any) {
      console.warn("[push] send error:", err?.message);
      failed++;
      // Si 404/410, l'endpoint n'est plus valide → on le supprime
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await admin.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      }
    }
  }

  return json({ success: true, sent, failed }, 200);
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

// ============================================================================
//  Edge Function : send-invitation-email
//
//  Déclenchée par l'app (src/lib/partners.ts) juste après insertion d'une
//  ligne partner_invitations. Envoie un vrai email à l'invité via Resend.
//
//  Secrets à définir (cf. EDGE_FUNCTION.md) :
//    - RESEND_API_KEY            : clé API Resend
//    - RESEND_FROM_EMAIL         : ex. "Histoire <invitation@histoire.app>"
//    - APP_BASE_URL              : ex. "https://histoire.vercel.app"
//    - SUPABASE_URL              : https://VOTRE-PROJET.supabase.co
//    - SUPABASE_SERVICE_ROLE_KEY : clé service_role (UNIQUEMENT côté serveur)
//
//  Déploiement :
//    supabase functions deploy send-invitation-email --no-verify-jwt
// ============================================================================

// @ts-nocheck (Deno runtime — TS ignore pour les imports npm:)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM_EMAIL =
  Deno.env.get("RESEND_FROM_EMAIL") ?? "Histoire <no-reply@histoire.app>";
const APP_BASE_URL = (Deno.env.get("APP_BASE_URL") ?? "").replace(/\/+$/, "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------- HTML email
function buildEmailHtml(opts: {
  inviterName: string;
  inviteeEmail: string;
  invitationUrl: string;
  hasAccount: boolean;
}): string {
  const { inviterName, invitationUrl, hasAccount } = opts;

  const primaryActionText = hasAccount
    ? "Accepter l'invitation"
    : "Créer mon compte & accepter";

  const secondaryLine = hasAccount
    ? "Connectez-vous avec votre compte existant pour accepter."
    : "Vous créerez votre compte avec cet email, puis l'invitation sera automatiquement disponible.";

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Invitation Histoire</title>
</head>
<body style="margin:0;padding:0;background-color:#fdf2f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#3f2a2a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf2f4;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 16px rgba(225,90,107,0.10);">
          <!-- Header -->
          <tr>
            <td align="center" style="padding:40px 32px 24px;background-color:#ffe4e6;">
              <div style="width:64px;height:64px;background-color:#e11d48;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
                <span style="font-size:32px;line-height:1;">&#10084;</span>
              </div>
              <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#3f2a2a;font-family:'Playfair Display',Georgia,serif;">Histoire</h1>
              <p style="margin:0;font-size:14px;color:#9f7a7a;">Votre timeline d'amour</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 32px;">
              <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#3f2a2a;font-family:'Playfair Display',Georgia,serif;">
                ${escapeHtml(inviterName)} vous invite à partager vos souvenirs
              </h2>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#6b5555;">
                ${escapeHtml(inviterName)} aimerait lier son compte Histoire au vôtre pour
                partager votre timeline commune : photos, vidéos et souvenirs
                apparaîtront pour vous deux.
              </p>
              <p style="margin:0 0 32px;font-size:13px;color:#9f7a7a;font-style:italic;">
                ${escapeHtml(secondaryLine)}
              </p>
              <!-- CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${escapeAttr(invitationUrl)}"
                       style="display:inline-block;background-color:#e11d48;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:9999px;font-size:16px;font-weight:600;letter-spacing:0.3px;">
                      ${escapeHtml(primaryActionText)}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:32px 0 0;font-size:13px;line-height:1.6;color:#9f7a7a;">
                Ou copiez ce lien dans votre navigateur :<br />
                <span style="word-break:break-all;color:#e11d48;">${escapeHtml(invitationUrl)}</span>
              </p>
              <hr style="margin:32px 0;border:none;border-top:1px solid #fce7e9;" />
              <p style="margin:0;font-size:12px;color:#b89a9a;line-height:1.6;">
                Si vous n'attendiez pas cet email, vous pouvez l'ignorer en toute sécurité.<br />
                Cet email a été envoyé par l'application Histoire.
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:24px 0 0;font-size:12px;color:#b89a9a;">
          © ${new Date().getFullYear()} Histoire — Fait avec amour.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildEmailText(opts: {
  inviterName: string;
  invitationUrl: string;
  hasAccount: boolean;
}): string {
  const { inviterName, invitationUrl, hasAccount } = opts;
  const action = hasAccount
    ? "Connectez-vous pour accepter."
    : "Créez un compte avec cet email, l'invitation sera automatiquement disponible.";
  return [
    `Histoire — Invitation de ${inviterName}`,
    ``,
    `${inviterName} aimerait lier son compte Histoire au vôtre pour`,
    `partager votre timeline commune (photos, vidéos, souvenirs).`,
    ``,
    `${action}`,
    ``,
    `Cliquez sur le lien suivant pour accepter :`,
    invitationUrl,
    ``,
    `Si vous n'attendiez pas cet email, vous pouvez l'ignorer.`,
    ``,
    `— L'équipe Histoire`,
  ].join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function escapeAttr(s: string): string {
  return escapeHtml(s);
}

// ------------------------------------------------------------------ Handler
Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // Vérif config serveur
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("[send-invitation-email] SUPABASE_URL / SERVICE_ROLE_KEY manquants");
    return json({ error: "Server misconfigured" }, 500);
  }
  if (!RESEND_API_KEY) {
    console.error("[send-invitation-email] RESEND_API_KEY manquant");
    return json({ error: "Email service not configured" }, 500);
  }
  if (!APP_BASE_URL) {
    console.error("[send-invitation-email] APP_BASE_URL manquant");
    return json({ error: "APP_BASE_URL not configured" }, 500);
  }

  // Lecture du body
  let body: { invitation_id?: string } = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const invitationId = body.invitation_id;
  if (!invitationId || typeof invitationId !== "string") {
    return json({ error: "invitation_id required" }, 400);
  }

  // Auth : on exige le JWT de l'utilisateur appelant (Authorization: Bearer ...)
  const authHeader = req.headers.get("Authorization") ?? "";
  const userJwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!userJwt) {
    return json({ error: "Unauthorized — missing Bearer token" }, 401);
  }

  // Client Supabase avec la clé service_role (passe les RLS)
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Vérifier le JWT utilisateur et récupérer son id
  const { data: userData, error: userErr } = await admin.auth.getUser(userJwt);
  if (userErr || !userData?.user) {
    return json({ error: "Invalid token" }, 401);
  }
  const callerId = userData.user.id;
  const callerEmail = userData.user.email ?? "";

  // 2. Charger l'invitation (avec service_role pour by-passer RLS)
  const { data: invitation, error: invErr } = await admin
    .from("partner_invitations")
    .select("id, inviter_id, invitee_email, status, created_at")
    .eq("id", invitationId)
    .maybeSingle();
  if (invErr || !invitation) {
    return json({ error: "Invitation not found" }, 404);
  }

  // 3. Sécurité : seul l'inviteur peut déclencher l'email
  if (invitation.inviter_id !== callerId) {
    return json({ error: "Forbidden — only the inviter can send the email" }, 403);
  }

  // 4. Ne pas renvoyer si déjà traitée
  if (invitation.status !== "pending") {
    return json({ error: `Invitation already ${invitation.status}`, status: invitation.status }, 409);
  }

  // 4bis. RATE LIMITING : 1 email max par heure par invitation
  const RATE_LIMIT_WINDOW_SEC = 3600;     // 1h
  if (invitation.last_email_sent_at) {
    const lastSentMs = new Date(invitation.last_email_sent_at).getTime();
    const elapsedSec = (Date.now() - lastSentMs) / 1000;
    if (elapsedSec < RATE_LIMIT_WINDOW_SEC) {
      const waitSec = Math.ceil(RATE_LIMIT_WINDOW_SEC - elapsedSec);
      return json(
        { error: `Trop d'emails envoyés. Réessayez dans ${waitSec}s.`, retry_after_sec: waitSec },
        429
      );
    }
  }
  // Note : on pourrait faire un compteur plus précis, mais 1 email/heures
  // par invitation est largement suffisant pour un usage normal
  // (renvoi manuel via le bouton "Renvoyer l'email").

  // 5. Charger le profil de l'inviteur (pour le nom)
  const { data: inviterProfile, error: profErr } = await admin
    .from("profiles")
    .select("name, partner_id")
    .eq("id", callerId)
    .maybeSingle();
  if (profErr || !inviterProfile) {
    return json({ error: "Inviter profile not found" }, 500);
  }
  if (inviterProfile.partner_id) {
    return json({ error: "Inviter already has a partner" }, 409);
  }
  const inviterName = inviterProfile.name || callerEmail.split("@")[0] || "Quelqu'un";

  // 6. Vérifier si l'invité a déjà un compte (pour personnaliser le message)
  const { data: inviteeUser } = await admin.auth.admin.getUserByEmail(
    invitation.invitee_email
  ).catch(() => ({ data: { user: null } }));
  const hasAccount = Boolean(inviteeUser?.user);

  // 7. Construire le lien
  const invitationUrl = `${APP_BASE_URL}/invite/${invitation.id}`;

  // 8. Envoyer l'email via Resend
  const emailPayload = {
    from: RESEND_FROM_EMAIL,
    to: invitation.invitee_email,
    subject: `${inviterName} vous invite sur Histoire`,
    html: buildEmailHtml({
      inviterName,
      inviteeEmail: invitation.invitee_email,
      invitationUrl,
      hasAccount,
    }),
    text: buildEmailText({ inviterName, invitationUrl, hasAccount }),
  };

  const resendResp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(emailPayload),
  });

  if (!resendResp.ok) {
    const errText = await resendResp.text();
    console.error("[send-invitation-email] Resend error:", resendResp.status, errText);
    return json({ error: "Failed to send email", detail: errText }, 502);
  }
  const resendData = await resendResp.json();

  // 9. Mettre à jour last_email_sent_at pour le rate limiting
  await admin
    .from("partner_invitations")
    .update({ last_email_sent_at: new Date().toISOString() })
    .eq("id", invitationId);

  // 10. Réponse OK
  return json({
    success: true,
    sent_to: invitation.invitee_email,
    invitee_has_account: hasAccount,
    message_id: resendData?.id ?? null,
  }, 200);
});

// ----------------------------------------------------------------- Helper
function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

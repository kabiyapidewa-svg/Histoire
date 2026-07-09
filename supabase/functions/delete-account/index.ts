// ============================================================================
//  Edge Function : delete-account
//
//  Supprime définitivement le compte de l'utilisateur connecté (RGPD).
//  Étapes :
//    1. Vérifie le JWT utilisateur
//    2. Liste tous les fichiers Storage du dossier {user_id}/...
//    3. Supprime ces fichiers du bucket
//    4. Appelle la RPC purge_my_account() (cascade SQL supprimera profile,
//       memories, media, comments, partner_invitations)
//    5. Supprime l'utilisateur dans auth.users (admin.deleteUser)
//
//  Secrets nécessaires (auto-injectés par Supabase) :
//    - SUPABASE_URL
//    - SUPABASE_SERVICE_ROLE_KEY
//
//  Déploiement :
//    supabase functions deploy delete-account --no-verify-jwt
// ============================================================================

// @ts-nocheck (Deno runtime)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json({ error: "Server misconfigured" }, 500);
  }

  // Auth : JWT utilisateur obligatoire
  const authHeader = req.headers.get("Authorization") ?? "";
  const userJwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!userJwt) {
    return json({ error: "Unauthorized — missing Bearer token" }, 401);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Vérifier le JWT et récupérer l'id utilisateur
  const { data: userData, error: userErr } = await admin.auth.getUser(userJwt);
  if (userErr || !userData?.user) {
    return json({ error: "Invalid token" }, 401);
  }
  const userId = userData.user.id;

  // 2. Lister tous les fichiers Storage du dossier {userId}/
  //    On doit paginer car list() retourne max 1000 objets par appel.
  let allPaths: string[] = [];
  let offset = 0;
  const PAGE_SIZE = 1000;
  while (true) {
    const { data, error } = await admin.storage
      .from("memories")
      .list(userId, { limit: PAGE_SIZE, offset });
    if (error) {
      // Si le dossier n'existe pas, on continue
      break;
    }
    if (!data || data.length === 0) break;
    // list() retourne les objets directement dans le dossier userId (1er niveau)
    // mais nos fichiers sont dans userId/{memory_id}/{filename} (2 niveaux).
    // Il faut donc lister chaque sous-dossier.
    for (const item of data) {
      if (item.metadata === null) {
        // c'est un "dossier" (memory_id)
        const sub = await admin.storage
          .from("memories")
          .list(`${userId}/${item.name}`, { limit: PAGE_SIZE });
        if (sub.data) {
          for (const f of sub.data) {
            if (f.metadata !== null) {
              allPaths.push(`${userId}/${item.name}/${f.name}`);
            }
          }
        }
      } else {
        allPaths.push(`${userId}/${item.name}`);
      }
    }
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  // 3. Supprimer tous les fichiers Storage (par batch de 100)
  if (allPaths.length > 0) {
    for (let i = 0; i < allPaths.length; i += 100) {
      const batch = allPaths.slice(i, i + 100);
      const { error: rmErr } = await admin.storage.from("memories").remove(batch);
      if (rmErr) {
        console.warn("[delete-account] Storage remove error:", rmErr.message);
      }
    }
  }

  // 4. Supprimer les données SQL (cascade : memories, media, comments, invitations)
  const { error: purgeErr } = await admin.rpc("purge_my_account", {});
  if (purgeErr) {
    // Cette RPC utilise auth.uid() qui ne marche qu'avec le JWT user, pas service_role.
    // On appelle donc directement la suppression via admin.
    await admin.from("profiles").delete().eq("id", userId);
  }

  // 5. Supprimer l'utilisateur auth.users (admin API)
  const { error: delUserErr } = await admin.auth.admin.deleteUser(userId);
  if (delUserErr) {
    console.error("[delete-account] deleteUser error:", delUserErr.message);
    return json({ error: "Failed to delete auth user", detail: delUserErr.message }, 500);
  }

  return json({
    success: true,
    deleted_files: allPaths.length,
    user_id: userId,
  }, 200);
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

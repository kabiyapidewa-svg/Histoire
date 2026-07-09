# Edge Function : envoi d'email d'invitation partenaire

Ce document explique comment déployer et configurer l'Edge Function Supabase
qui envoie un **vrai email** à la personne invitée (B) avec un lien
`/invite/{id}` pour accepter.

---

## Aperçu du flux

```
A saisit l'email de B dans Compte → Inviter
        ↓
App insère une ligne partner_invitations (status=pending)
        ↓
App appelle l'Edge Function "send-invitation-email" (POST, auth requise)
        ↓
Edge Function (Deno) :
  - vérifie le JWT de A
  - charge l'invitation + le profil de A (via service_role)
  - vérifie que A est bien l'inviteur
  - détecte si B a déjà un compte (pour adapter le message)
  - envoie l'email via Resend
        ↓
B reçoit l'email → clique sur "Accepter l'invitation"
        ↓
B atterrit sur /invite/{id} → se connecte (ou crée son compte) → accepte
        ↓
Les comptes sont liés, ils voient leurs souvenirs mutuels
```

---

## 1. Prérequis

- **Supabase CLI** installé (v2+)
- Un compte **Resend** (https://resend.com — 3000 emails/mois gratuits, sans
  carte bancaire)
- Un **domaine vérifié** dans Resend pour l'expéditeur (le domaine
  `onresend.com` est fourni par défaut pour les tests, mais il vaut mieux
  vérifier le tien en production)

### 1.1 Installer la Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Windows (scoop)
scoop install supabase

# Linux / autre (npm)
npm install -g supabase

# Vérifier
supabase --version
```

### 1.2 Lier le CLI à ton projet Supabase

```bash
cd Histoire
supabase login
supabase link --project-ref TON-PROJECT-REF
```

> Le `project-ref` se trouve dans Supabase Dashboard → Project Settings →
> General → "Reference ID".

---

## 2. Créer un compte Resend

1. Va sur https://resend.com → **Sign up** (gratuit).
2. Récupère ta **API key** : Dashboard → API Keys → **Create API Key** →
   permissions "Sending access" → copie la clé `re_...`.
3. **(Optionnel mais recommandé)** Vérifie ton domaine d'envoi :
   Dashboard → Domains → Add domain → suis les instructions DNS.
   - En attendant, tu peux utiliser l'expéditeur de test
     `Histoire <onboarding@resend.dev>` mais **les emails n'arriveront qu'à
     ton propre email** (pas à tes vrais utilisateurs).

---

## 3. Définir les secrets Supabase

Exécute ces commandes une seule fois (les secrets sont stockés chiffrés
côté Supabase) :

```bash
# Clé API Resend (commence par re_)
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx

# Expéditeur affiché dans l'email
# - Sans domaine vérifié : "Histoire <onboarding@resend.dev>" (tests seulement)
# - Avec ton domaine vérifié : "Histoire <invitation@ton-domaine.com>"
supabase secrets set RESEND_FROM_EMAIL="Histoire <onboarding@resend.dev>"

# URL publique de ton app (sans slash final)
# - En dev : http://localhost:5173
# - En prod : https://histoire.vercel.app
supabase secrets set APP_BASE_URL=https://histoire.vercel.app
```

> **Note** : `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont
> automatiquement injectés par Supabase dans l'environnement de l'Edge
> Function — tu n'as pas à les définir.

Pour lister les secrets et vérifier :
```bash
supabase secrets list
```

---

## 4. Déployer l'Edge Function

```bash
cd Histoire
supabase functions deploy send-invitation-email --no-verify-jwt
```

> `--no-verify-jwt` n'est PAS une faille : l'Edge Function vérifie elle-même
> le JWT de l'utilisateur appelant dans son code (cf. `index.ts`, lignes
> `auth.getUser(userJwt)`). Ce flag est nécessaire parce qu'on appelle la
> fonction avec le token utilisateur (pas avec la clé service_role).

Vérifier le déploiement :
```bash
supabase functions list
# Tu dois voir "send-invitation-email" avec status "deployed"
```

L'URL publique de la fonction sera :
```
https://TON-PROJECT-REF.functions.supabase.co/send-invitation-email
```

Le client Supabase JS (`supabase.functions.invoke(...)`) la trouve
automatiquement — tu n'as rien à configurer côté front.

---

## 5. Tester

### 5.1 Test local avec `curl`

```bash
# Récupère d'abord un access_token JWT valide en te connectant
# (remplace par les credentials d'un utilisateur A existant)
TOKEN=$(curl -s -X POST \
  "https://TON-PROJECT-REF.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: TON-ANON-KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"a@example.com","password":"MotDePasseA"}' \
  | jq -r .access_token)

# Appelle l'Edge Function avec un ID d'invitation valide
curl -X POST \
  "https://TON-PROJECT-REF.functions.supabase.co/send-invitation-email" \
  -H "Authorization: Bearer $TOKEN" \
  -H "apikey: TON-ANON-KEY" \
  -H "Content-Type: application/json" \
  -d '{"invitation_id":"UUID-DE-L-INVITATION"}'
```

Réponse attendue (200) :
```json
{
  "success": true,
  "sent_to": "b@example.com",
  "invitee_has_account": false,
  "message_id": "re_xxx..."
}
```

### 5.2 Test end-to-end depuis l'app

1. Connecte-toi en tant que A
2. Page Compte → invite `b@example.com`
3. Vérifie la boîte mail de `b@example.com` (et les spams)
4. Clique sur le bouton "Accepter l'invitation" dans l'email
5. Tu atterris sur `/invite/{id}` → crée le compte B (ou connecte-toi)
6. Clique Accepter → les comptes sont liés

---

## 6. Cas particuliers gérés par la fonction

| Situation | Comportement |
|---|---|
| B n'a pas encore de compte | L'email dit "Créer mon compte & accepter" + le bouton pointe vers `/invite/{id}` qui propose la création de compte |
| B a déjà un compte | L'email dit "Accepter l'invitation" + le bouton pointe vers `/invite/{id}` qui demande la connexion |
| A a déjà un partenaire | Réponse 409, email non envoyé |
| L'invitation est déjà accepted/rejected/cancelled | Réponse 409, email non renvoyé |
| L'appelant n'est pas l'inviteur | Réponse 403 |
| JWT invalide ou absent | Réponse 401 |
| `RESEND_API_KEY` non configuré | Réponse 500 + log serveur |
| Email B refusé par Resend (bounce, syntaxe) | Réponse 502 avec le détail |

---

## 7. Logs et débogage

```bash
# Voir les logs en temps réel
supabase functions logs send-invitation-email

# Voir les 100 derniers logs
supabase functions logs send-invitation-email --limit 100
```

Erreurs courantes :
- `RESEND_API_KEY manquant` → tu as oublié l'étape 3
- `401 Invalid token` → le JWT utilisateur est expiré ou absent
- `403 Forbidden` → tu essaies d'envoyer l'email pour une invitation dont
  tu n'es pas l'auteur
- `502 Failed to send email` → Resend a refusé (vérifie le domaine
  d'expéditeur dans Resend dashboard)

---

## 8. Limites et bonnes pratiques

- **Quotas Resend gratuit** : 3000 emails/mois, 100/jour. Suffisant pour
  une app en lancement. Au-delà, passe au plan payant (~20$/mois pour 50k
  emails).
- **Anti-spam** : vérifie ton domaine dans Resend (SPF, DKIM, DMARC) sinon
  tes emails iront dans les spams.
- **Idempotence** : la fonction n'envoie pas l'email si l'invitation n'est
  plus `pending`. Le bouton "Renvoyer l'email" dans l'UI permet de
  relancer manuellement.
- **Rate limiting** : pour éviter le spam, tu peux ajouter un check dans
  l'Edge Function (ex: refuser si une invitation a été envoyée il y a moins
  de 60s pour le même `invitation_id`).

---

## 9. Désactivation / rollback

Si tu veux temporairement couper l'envoi d'emails (sans retirer la
fonctionnalité d'invitation) :

```bash
supabase secrets unset RESEND_API_KEY
```

L'app créera toujours les invitations en base, et le bouton "Copier le
lien" restera fonctionnel — il faudra juste partager le lien
`/invite/{id}` manuellement (WhatsApp, etc.).

Pour supprimer complètement la fonction :
```bash
supabase functions delete send-invitation-email
```

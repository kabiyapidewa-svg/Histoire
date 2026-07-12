# MemoryLine — Timeline d'amour pour couples

Application web (Vite + React + TypeScript + Tailwind) qui permet à deux
partenaires de partager une timeline de souvenirs (photos + vidéos + texte)
avec authentification réelle (email/password + Google OAuth) et un système
d'invitation partenaire.

Backend : **Supabase** (PostgreSQL + Auth + Storage + Row Level Security).

---

## Ce qui a été corrigé dans cette version

| Problème | Cause | Solution |
|---|---|---|
| Les photos ne s'affichaient pas chez l'autre personne | `URL.createObjectURL()` = blob valide seulement dans l'onglet courant, stocké dans `localStorage` | Upload vers **Supabase Storage**, URL publique persistante |
| Les souvenirs du compte A apparaissaient dans le tableau de bord du compte B | `Dashboard.tsx` affichait **tous** les souvenirs sans filtrer par user | Filtrage par **RLS** côté base + queries Supabase |
| Connexion impossible depuis un autre téléphone | Comptes stockés dans `localStorage` du téléphone A | Auth **Supabase** (session partagée sur tous les appareils) |
| Vidéos cassées | Rendu via `<img>` | Composant `MediaViewer` qui choisit `<img>` ou `<video>` selon le type |
| Suppression d'un média ne supprimait rien | Juste un splice d'URL | Suppression réelle dans **Storage** + ligne en base |
| Faille commentaires (n'importe qui pouvait commenter) | Pas de backend | **RLS** : commentaire uniquement sur un souvenir visible (own + partner) |
| Bouton « Inviter votre partenaire » ne faisait rien | Pas de handler | Système complet d'invitation par email (A invite → B accepte → comptes liés) |
| Pas de mot de passe oublié | Pas d'auth réelle | Page `/auth/forgot-password` + reset via Supabase |
| Email de confirmation bloquant | — | Configurable dans Supabase (voir ci-dessous) |
| Connexion Google | Pas d'OAuth | **Google OAuth** via Supabase |

---

## 1. Prérequis

- Node.js 18+
- Un compte [Supabase](https://supabase.com) (gratuit)
- Un compte Google Cloud Console (pour Google OAuth, optionnel)

---

## 2. Configuration Supabase

### 2.1 Créer le projet

1. Allez sur https://supabase.com → **New project**
2. Nommez-le `histoire`, choisissez une région proche de vos utilisateurs.
3. Notez le **Project URL** et la **anon public key** (Settings → API).

### 2.2 Créer le schéma + les politiques RLS

1. Dans le dashboard Supabase → **SQL Editor** → **New query**.
2. Copiez-collez **tout** le contenu de [`supabase/schema.sql`](./supabase/schema.sql).
3. Cliquez **Run**. Vous devriez voir "Success. No rows returned."
4. Vérifiez dans **Table Editor** que les 5 tables existent :
   `profiles`, `memories`, `media`, `comments`, `partner_invitations`.

### 2.3 Configurer l'Auth

#### Email/Password
- **Authentication → Providers → Email** : activé.
- **Authentication → Sign In / Providers → Email → Confirm email** :
  - **Désactivez** "Confirm email" si vous ne voulez pas que vos testeurs
    cliquent sur un lien avant de pouvoir se connecter (recommandé en phase
    de test). Réactivez-le pour la production.
- **Authentication → URL Configuration → Site URL** : `https://VOTRE-DOMAINE-VERCEL.app`
- **Authentication → URL Configuration → Redirect URLs** : ajoutez
  `https://VOTRE-DOMAINE-VERCEL.app/auth/callback`

#### Google OAuth
1. Suivez le guide officiel Supabase :
   https://supabase.com/docs/guides/auth/social-login/auth-google
2. En résumé :
   - Créez un projet Google Cloud → APIs & Services → Credentials →
     Create OAuth client ID → Web application.
   - **Authorized JavaScript origins** :
     - `https://VOTRE-PROJET.supabase.co`
     - `https://VOTRE-DOMAINE-VERCEL.app`
   - **Authorized redirect URIs** :
     - `https://VOTRE-PROJET.supabase.co/auth/v1/callback`
   - Copiez le **Client ID** et **Client Secret**.
3. Dans Supabase → Authentication → Providers → Google → activez et
   collez Client ID + Client Secret.

### 2.4 Vérifier le bucket Storage

Le script SQL crée automatiquement un bucket `memories` **public** en lecture
(vos URLs `<img>`/`<video>` s'afficheront sans token) avec une politique RLS
d'écriture qui restreint chaque utilisateur à son propre dossier.

Vérifiez : **Storage** → vous devez voir un bucket `memories` (Public).

---

## 3. Installation locale

```bash
git clone https://github.com/kabiyapidewa-svg/MemoryLine.git
cd MemoryLine
npm install

# Variables d'environnement
cp .env.example .env
# Éditez .env et mettez VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY

npm run dev
```

Ouvrez http://localhost:5173

---

## 4. Déploiement Vercel

### 4.1 Variables d'environnement Vercel

Vercel → votre projet → **Settings → Environment Variables**. Ajoutez :

| Key | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://VOTRE-PROJET.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` (clé anon publique) |

> **Important** : cochez bien **Production**, **Preview** et **Development**.

### 4.2 Redéployer

Si Vercel est connecté à GitHub, chaque `git push` déclenchera un build.
Pour un déploiement manuel : `vercel --prod`.

### 4.3 URLs de redirection

Une fois le domaine Vercel définitif connu, mettez à jour dans Supabase :
- Authentication → URL Configuration → Site URL
- Authentication → URL Configuration → Redirect URLs

---

## 5. Système d'invitation partenaire

Flux complet :

1. **A** va dans **Compte → Inviter votre partenaire**, saisit l'email de **B**.
2. Une ligne `partner_invitations` est créée avec le statut `pending`.
3. **B** crée un compte avec **exactement le même email** (ou se connecte s'il
   en a déjà un).
4. Sur la page **Compte** de B, une carte « Invitations reçues » apparaît
   avec un bouton **Accepter**.
5. B clique → la fonction RPC `accept_partner_invitation` lie les deux profils
   (`partner_id` mutuel).
6. À partir de là, B voit les souvenirs de A (et inversement), grâce à la RLS :
   `memories.user_id = auth.uid() OR memories.user_id = my_partner_id()`.
7. Chacun peut **délier** le partenaire depuis la page Compte → les deux
   `partner_id` repassent à `null`.

> 💡 **Envoi d'email réel** : une Edge Function Supabase (avec Resend) est
> incluse pour envoyer automatiquement un vrai email à B avec le lien
> `/invite/{id}`. Voir la doc dédiée **[`supabase/EDGE_FUNCTION.md`](./supabase/EDGE_FUNCTION.md)**
> pour le déploiement (10 min).
>
> Sans cette Edge Function déployée, l'app fonctionne quand même : B verra
> l'invitation sur sa page Compte en se connectant, et A peut copier le lien
> d'invitation manuellement (bouton "Copier le lien").

---

## 6. Architecture du code

```
src/
├── contexts/AuthContext.tsx    # état session + profile Supabase
├── lib/
│   ├── supabase.ts             # client Supabase
│   ├── auth.ts                 # signUp / signIn / Google / resetPassword
│   ├── memories.ts             # CRUD memories + media + comments
│   └── partners.ts             # invitation / accept / unlink
├── components/
│   ├── MediaViewer.tsx         # <img> vs <video> selon type
│   └── ProtectedRoute.tsx      # garde de route
├── pages/
│   ├── Landing.tsx
│   ├── Register.tsx            # email/password + Google
│   ├── Login.tsx               # email/password + Google + forgot
│   ├── ForgotPassword.tsx
│   ├── ResetPassword.tsx
│   ├── AuthCallback.tsx        # redirect OAuth + confirmation email
│   ├── AcceptInvite.tsx        # /invite/:id — B accepte
│   ├── Dashboard.tsx
│   ├── MemoryDetail.tsx
│   └── Account.tsx             # profil + invitation partenaire
├── store/index.ts              # store UI éphémère (notice)
└── types.ts

supabase/
├── schema.sql                          # schéma + RLS + RPC + bucket
├── config.toml                         # config CLI Supabase
├── EDGE_FUNCTION.md                    # doc déploiement Edge Function email
└── functions/
    └── send-invitation-email/index.ts  # Edge Function (Deno + Resend)
```

---

## 7. Sécurité (RLS en résumé)

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | self + partner | (trigger auto) | self only | (cascade) |
| `memories` | own + partner | own only | own only | own only |
| `media` | via memory visible | own memory only | — | own memory only |
| `comments` | via memory visible | self + memory visible | — | self only |
| `partner_invitations` | sent OR received | self only | received only (accept/reject) | own sent only |

**Storage** `memories` : lecture publique, écriture/suppression uniquement
dans le dossier `{user_id}/...`.

---

## 8. FAQ

**« Mes testeurs voient "Email not confirmed" au login »**
→ Supabase Dashboard → Authentication → Providers → Email → décochez
"Confirm email" → Save. Les nouveaux comptes pourront se connecter immédiatement.

**« Les images ne s'affichent toujours pas en production »**
→ Vérifiez que les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
sont bien définies dans Vercel (Settings → Environment Variables) pour les 3
environnements, puis redéployez.

**« Vercel me met une page blanche sur /dashboard après refresh »**
→ C'est le SPA routing. Le `vercel.json` inclus contient un rewrite qui force
toutes les URLs vers `index.html`. Si ça ne marche pas, supprimez le build
cache Vercel et redéployez.

**« Je veux limiter la taille des vidéos »**
→ Ajoutez un check dans `Dashboard.tsx` avant `uploadMedia` :
`if (file.size > 50 * 1024 * 1024) { ... }`. Côté Supabase, vous pouvez aussi
configurer un quota par bucket.

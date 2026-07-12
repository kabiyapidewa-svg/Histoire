# Guide de mise en production — MemoryLine

Ce guide te conduit pas à pas depuis un repo GitHub vide jusqu'à une app
**fonctionnelle et professionnelle** déployée sur Vercel + Supabase.

Durée totale : ~45 minutes (dont 15 min d'attente DNS).

---

## Pré-requis

- [ ] Un compte GitHub (gratuit)
- [ ] Un compte Vercel (gratuit, connecté à GitHub)
- [ ] Un compte Supabase (gratuit, https://supabase.com)
- [ ] Un compte Resend (gratuit, https://resend.com) — pour l'email d'invitation
- [ ] Node.js 18+ installé sur ta machine (pour la CLI Supabase)
- [ ] Le code de l'app (archive `MemoryLine-supabase.zip`)

---

## Étape 1 — Pousser le code sur GitHub (5 min)

1. Crée un nouveau repo sur GitHub : `MemoryLine` (privé ou public, peu importe).
2. Extrais l'archive `MemoryLine-supabase.zip` localement :
   ```bash
   unzip MemoryLine-supabase.zip -d MemoryLine
   cd MemoryLine
   ```
3. Initialise git et pousse :
   ```bash
   git init
   git add .
   git commit -m "Initial commit — MemoryLine app with Supabase backend"
   git branch -M main
   git remote add origin https://github.com/<TON-USER>/MemoryLine.git
   git push -u origin main
   ```

---

## Étape 2 — Créer le projet Supabase (5 min)

1. Va sur https://supabase.com → **New project**
2. Nom : `histoire`
3. Choisis une région proche de tes utilisateurs (ex: `Frankfurt` pour l'Europe, `Ohio` pour l'Afrique de l'Ouest)
4. Génère un mot de passe DB (note-le dans un gestionnaire de mots de passe)
5. **Create project** → patiente 2-3 min (Supabase provisionne la DB)

### Récupérer les credentials
- Dashboard Supabase → **Project Settings** (engrenage en bas à gauche) → **API**
- Note les 2 valeurs :
  - `Project URL` (ex: `https://abcxyz.supabase.co`)
  - `anon public` key (commence par `eyJ...`)

---

## Étape 3 — Créer le schéma de base de données (3 min)

1. Dashboard Supabase → **SQL Editor** → **New query**
2. Ouvre le fichier `supabase/schema.sql` (depuis l'archive extraite)
3. Copie **tout** son contenu → colle dans SQL Editor → **Run**
4. Tu dois voir `Success. No rows returned.`
5. Vérifie dans **Table Editor** : tu dois voir 5 tables :
   `profiles`, `memories`, `media`, `comments`, `partner_invitations`

---

## Étape 4 — Configurer l'authentification (10 min)

### 4.1 Email / password
1. Dashboard Supabase → **Authentication** → **Providers** → **Email**
2. Vérifie que le provider Email est **activé**
3. **Confirm email** :
   - Si tu es en phase de test → **désactive** cette option (tes testeurs pourront se connecter immédiatement)
   - Pour la production → **active** cette option (sécurité supplémentaire)

### 4.2 URLs de redirection
1. Dashboard Supabase → **Authentication** → **URL Configuration**
2. **Site URL** : pour l'instant `http://localhost:5173` (on mettra à jour après déploiement Vercel)
3. **Redirect URLs** : ajoute
   - `http://localhost:5173/auth/callback`
   - `https://*-histoire.vercel.app/auth/callback` (pattern pour les preview Vercel)

### 4.3 Google OAuth (optionnel mais recommandé)
1. Suis https://supabase.com/docs/guides/auth/social-login/auth-google
2. En résumé :
   - Google Cloud Console → APIs & Services → Credentials → **Create credentials** → **OAuth client ID** → **Web application**
   - **Authorized JavaScript origins** :
     - `https://VOTRE-PROJET.supabase.co` (remplace par ton URL Supabase)
   - **Authorized redirect URIs** :
     - `https://VOTRE-PROJET.supabase.co/auth/v1/callback`
   - Copie le **Client ID** et **Client Secret**
3. Retour dans Supabase → Authentication → Providers → **Google** → activate
4. Colle Client ID + Client Secret → **Save**

---

## Étape 5 — Configurer le compte Resend (5 min)

1. Va sur https://resend.com → **Sign up** (gratuit, 3000 emails/mois)
2. Dashboard → **API Keys** → **Create API Key** → permissions "Sending access"
3. Copie la clé `re_...`
4. **(Production)** Vérifie ton domaine : Dashboard → **Domains** → **Add domain**
   - Suis les instructions DNS (SPF, DKIM, DMARC)
   - En attendant, utilise `onboarding@resend.dev` (mais les emails n'arrivent qu'à ton propre email)

---

## Étape 6 — Installer la CLI Supabase et déployer les Edge Functions (10 min)

### 6.1 Installer la CLI
```bash
npm install -g supabase
supabase --version   # doit afficher >= 1.100
```

### 6.2 Lier le CLI à ton projet
```bash
cd MemoryLine   # le dossier de ton code
supabase login
supabase link --project-ref TON-PROJECT-REF
```
> Le `project-ref` se trouve dans Supabase Dashboard → Project Settings → General → "Reference ID"

### 6.3 Définir les secrets
```bash
# Clé Resend
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx

# Expéditeur (sans domaine vérifié : onboarding@resend.dev)
supabase secrets set RESEND_FROM_EMAIL="MemoryLine <onboarding@resend.dev>"

# URL de l'app (pour l'instant localhost, on mettra à jour après Vercel)
supabase secrets set APP_BASE_URL=http://localhost:5173
```

### 6.4 Déployer les 2 Edge Functions
```bash
supabase functions deploy send-invitation-email --no-verify-jwt
supabase functions deploy delete-account --no-verify-jwt
```

Vérifie :
```bash
supabase functions list
# Tu dois voir les 2 fonctions avec status "deployed"
```

---

## Étape 7 — Déployer sur Vercel (10 min)

### 7.1 Connecter le repo à Vercel
1. Va sur https://vercel.com → **Add New** → **Project**
2. Importe ton repo `MemoryLine`
3. Framework preset : **Vite** (auto-détecté)
4. **Root Directory** : laisse vide (le code est à la racine)
5. **NE clique pas encore sur Deploy** — on va d'abord ajouter les variables d'env

### 7.2 Variables d'environnement
Dans la page de config Vercel, va dans **Environment Variables** et ajoute :

| Key | Value | Environments |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://VOTRE-PROJET.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` (anon key) | Production, Preview, Development |

### 7.3 Déployer
- Clique **Deploy**
- Patiente 1-2 min (Vercel build + déploie)
- Note ton URL : `https://histoire-<xxx>.vercel.app`

### 7.4 Mettre à jour les URLs de redirection
Maintenant que tu as ton URL Vercel définitive, mets à jour :

**Dans Supabase** :
- Authentication → URL Configuration → **Site URL** → `https://histoire-<xxx>.vercel.app`
- Authentication → URL Configuration → **Redirect URLs** → ajoute
  - `https://histoire-<xxx>.vercel.app/auth/callback`

**Dans les secrets Supabase** (CLI) :
```bash
supabase secrets set APP_BASE_URL=https://histoire-<xxx>.vercel.app
```

**Dans Google Cloud Console** (si Google OAuth activé) :
- Ajoute `https://histoire-<xxx>.vercel.app` dans Authorized JavaScript origins

### 7.5 Redéployer
Push un commit vide pour redéclencher un build Vercel :
```bash
git commit --allow-empty -m "Trigger redeploy with new env vars" && git push
```

---

## Étape 8 — Tests de validation (10 min)

Ouvre ton app Vercel et teste ces scénarios :

### 8.1 Inscription + connexion
- [ ] Crée un compte A avec un vrai email + vrai mot de passe
- [ ] Vérifie que tu es connecté et redirigé vers `/dashboard`
- [ ] Déconnecte-toi → reconnecte-toi → OK
- [ ] Teste Google OAuth si activé

### 8.2 Ajout de souvenir
- [ ] Crée un souvenir avec une photo
- [ ] Vérifie que la photo s'affiche dans le Dashboard
- [ ] Crée un souvenir avec une vidéo
- [ ] Vérifie que la vidéo se lit (pas une image cassée)
- [ ] Ouvre le souvenir → vérifie médias + commentaires

### 8.3 Invitation partenaire
- [ ] Depuis le compte A, va dans **Compte → Inviter votre partenaire**
- [ ] Saisis l'email d'un(e) ami(e) B (qui n'a pas encore de compte)
- [ ] B doit recevoir un email d'invitation
- [ ] B clique sur le bouton dans l'email → atterrit sur `/invite/{id}`
- [ ] B crée son compte (avec le même email)
- [ ] B accepte l'invitation
- [ ] Vérifie que A et B voient maintenant leurs souvenirs mutuels

### 8.4 Cross-device
- [ ] Connecte-toi au compte A depuis un autre téléphone
- [ ] Vérifie que tu vois les mêmes souvenirs (la DB est partagée)

### 8.5 RGPD
- [ ] Va dans Compte → Zone dangereuse → Supprimer mon compte
- [ ] Tape `SUPPRIMER` → confirme
- [ ] Vérifie que tu es déconnecté et que le compte n'existe plus

---

## Étape 9 — Points de surveillance (post-lancement)

### Quotas Supabase (plan gratuit)
- **Database** : 500 MB
- **Storage** : 1 GB
- **Auth** : 50 000 MAU (Monthly Active Users)
- **Edge Functions** : 500 000 invocations/mois
Surveille : Dashboard Supabase → Project Settings → Usage

### Quotas Resend (plan gratuit)
- 3000 emails/mois, 100/jour
Surveille : Dashboard Resend → Logs

### Quotas Vercel (plan gratuit)
- 100 GB de bande passante/mois
- 1000 builds/mois
Surveille : Dashboard Vercel → Usage

---

## Dépannage

| Problème | Solution |
|---|---|
| "Email not confirmed" au login | Supabase → Authentication → Providers → Email → désactive "Confirm email" |
| Photos ne s'affichent pas | Vérifie les variables Vercel + le bucket Storage est privé (RLS) |
| Email d'invitation non reçu | Vérifie spam, logs Resend, secrets Supabase |
| Google OAuth redirige mal | URLs Redirect mal configurées côté Supabase + Google Console |
| Erreur 404 sur refresh | Vercel.json doit contenir le rewrite vers `/index.html` (déjà inclus) |
| Edge Function non déployée | `supabase functions list` puis vérifie le status |
| Compte supprimé mais session active | Déconnecte-toi manuellement, le session persiste côté client |

---

## Checklist finale de professionnalisme

Avant de partager ton app publiquement, vérifie :

- [ ] Les 5 tests de l'étape 8 passent
- [ ] Tu as testé sur **mobile** (Chrome Android + Safari iOS)
- [ ] Tu as testé le **cross-device** (compte créé sur mobile, login sur desktop)
- [ ] Le domaine Resend est vérifié (sinon emails en spam)
- [ ] "Confirm email" est activé en production
- [ ] Tu as un message légal minimum (mentions légales, politique de confidentialité) — obligatoire en Europe
- [ ] Tu as testé la suppression de compte RGPD
- [ ] Tu surveilles les logs Supabase + Vercel pendant les premiers jours

---

Félicitations — ton app est en production, sécurisée, conforme RGPD, et
prête pour un vrai lancement public. 🎉

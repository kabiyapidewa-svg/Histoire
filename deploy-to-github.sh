#!/usr/bin/env bash
# ============================================================================
#  Histoire — Script de déploiement vers GitHub
#  Remplace le contenu du repo distant par la version corrigée (Supabase).
#
#  Usage :
#    1. Rends ce script exécutable :  chmod +x deploy-to-github.sh
#    2. Place-toi dans le dossier qui contient Histoire-supabase.zip
#    3. Lance :  ./deploy-to-github.sh
#
#  Prérequis : git installé + authentifié à GitHub (HTTPS ou SSH).
# ============================================================================

set -euo pipefail

# ---------- Couleurs ----------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
echo_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
echo_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
echo_err()   { echo -e "${RED}[ERR]${NC} $1"; }

# ---------- Vérifs préalables ----------
echo_info "Vérification des prérequis..."

if ! command -v git &> /dev/null; then
  echo_err "git n'est pas installé. Installe-le d'abord : https://git-scm.com/downloads"
  exit 1
fi

if ! command -v unzip &> /dev/null; then
  echo_err "unzip n'est pas installé. Installe-le d'abord."
  exit 1
fi

# ---------- Localiser l'archive ----------
ARCHIVE=""
for candidate in \
  "Histoire-supabase.zip" \
  "/home/z/my-project/download/Histoire-supabase.zip" \
  "./download/Histoire-supabase.zip"; do
  if [ -f "$candidate" ]; then
    ARCHIVE="$candidate"
    break
  fi
done

if [ -z "$ARCHIVE" ]; then
  echo_err "Archive Histoire-supabase.zip introuvable."
  echo_err "Place ce script à côté de l'archive, ou modifie la variable ARCHIVE."
  exit 1
fi
echo_ok "Archive trouvée : $ARCHIVE"

# ---------- Demander l'URL du repo ----------
echo ""
echo_info "Quel est l'URL de ton repo GitHub ?"
echo_info "  Exemples :"
echo_info "    https://github.com/kabiyapidewa-svg/Histoire.git"
echo_info "    git@github.com:kabiyapidewa-svg/Histoire.git"
echo ""
read -rp "URL du repo : " REPO_URL

if [ -z "$REPO_URL" ]; then
  echo_err "URL vide. Abandon."
  exit 1
fi

# Validation basique du format
if [[ ! "$REPO_URL" =~ (github\.com|gitlab\.com|bitbucket\.org) ]]; then
  echo_warn "L'URL ne ressemble pas à une URL GitHub/GitLab/Bitbucket. On continue quand même."
fi

# ---------- Option : backup de l'ancien repo ----------
echo ""
echo_info "Avant d'écraser, veux-tu faire une sauvegarde locale de l'ancien repo distant ?"
echo_info "  (recommandé — clonera l'ancien code dans un dossier Histoire-backup-YYYYMMDD)"
read -rp "Sauvegarde ? [O/n] : " DO_BACKUP
DO_BACKUP=${DO_BACKUP:-O}

BACKUP_DIR=""
if [[ "$DO_BACKUP" =~ ^[OoYy]$ ]] || [ -z "$DO_BACKUP" ]; then
  BACKUP_DIR="Histoire-backup-$(date +%Y%m%d-%H%M%S)"
  echo_info "Clonage de l'ancien repo dans $BACKUP_DIR/..."
  if git clone "$REPO_URL" "$BACKUP_DIR" 2>/dev/null; then
    echo_ok "Sauvegarde créée : $BACKUP_DIR/"
  else
    echo_warn "Impossible de cloner l'ancien repo (peut-être vide ?). On continue sans sauvegarde."
    BACKUP_DIR=""
  fi
fi

# ---------- Préparer le dossier de travail ----------
WORKDIR="Histoire-deploy-$(date +%Y%m%d-%H%M%S)"
echo ""
echo_info "Extraction de l'archive dans $WORKDIR/..."
mkdir -p "$WORKDIR"
unzip -q "$ARCHIVE" -d "$WORKDIR"
echo_ok "Extraction terminée."

cd "$WORKDIR"

# ---------- Vérifs de sécurité critiques ----------
echo_info "Vérifications de sécurité..."

# 1. .env ne doit pas être présent
if [ -f ".env" ]; then
  echo_err ".env trouvé dans l'archive ! ABANDON — ne jamais committer de .env."
  echo_err "Supprime-le et re-crée l'archive."
  exit 1
fi
echo_ok "Aucun .env dans l'archive (parfait)."

# 2. .gitignore doit exclure .env
if ! grep -qE "^\.env$" .gitignore 2>/dev/null; then
  echo_warn ".gitignore n'exclut pas .env. Ajout..."
  echo "" >> .gitignore
  echo "# Secrets" >> .gitignore
  echo ".env" >> .gitignore
  echo ".env.local" >> .gitignore
  echo ".env.*.local" >> .gitignore
  echo_ok ".gitignore mis à jour."
else
  echo_ok ".gitignore exclut déjà .env."
fi

# 3. Pas de node_modules
if [ -d "node_modules" ]; then
  echo_warn "node_modules détecté. Suppression..."
  rm -rf node_modules
  echo_ok "node_modules supprimé."
fi

# 4. Pas de dist
if [ -d "dist" ]; then
  echo_warn "dist détecté. Suppression..."
  rm -rf dist
  echo_ok "dist supprimé."
fi

# ---------- Récapitulatif avant action ----------
echo ""
echo "================================================"
echo_info "RÉCAPITULATIF"
echo "================================================"
echo "  Archive source    : $ARCHIVE"
echo "  Dossier de travail: $WORKDIR/"
[ -n "$BACKUP_DIR" ] && echo "  Sauvegarde ancien : $BACKUP_DIR/"
echo "  Repo distant      : $REPO_URL"
echo "  Action            : ÉCRASE le contenu distant avec le nouveau code"
echo "================================================"
echo ""
echo_warn "Cette opération est IRRÉVERSIBLE pour le contenu distant actuel."
read -rp "Confirmer le push --force ? [taper OUI pour confirmer] : " CONFIRM

if [ "$CONFIRM" != "OUI" ]; then
  echo_warn "Abandon. Rien n'a été poussé."
  echo_warn "Le dossier local $WORKDIR/ a été créé, tu peux le supprimer."
  exit 0
fi

# ---------- Git init + commit ----------
echo ""
echo_info "Initialisation du dépôt git local..."
git init -q
git add -A

# Vérif qu'on ne va pas committer un .env
if git diff --cached --name-only | grep -q "^\.env"; then
  echo_err ".env est sur le point d'être committé ! ABANDON."
  exit 1
fi

git commit -q -m "Histoire — Migration vers Supabase

- Auth réelle (email/password + Google OAuth) via Supabase
- Base PostgreSQL avec Row Level Security
- Storage privé avec URLs signées (1h)
- Système d'invitation partenaire (A invite -> B accepte -> comptes liés)
- Edge Functions : envoi email (Resend) + suppression compte RGPD
- Composant MediaViewer (img vs video selon type)
- Strip EXIF automatique des images
- Validation taille fichiers (10 Mo image, 100 Mo vidéo)
- Pagination + thumbnails + barre de progression upload
- ErrorBoundary + page 404 + meta SEO/OpenGraph
- i18n FR/EN persisté

Corrige : photos invisibles cross-device, comptes partagés par erreur,
mots de passe en clair, vidéos cassées, suppression fantaisiste,
invitation partenaire inopérante."

echo_ok "Commit local créé."

# ---------- Branch + remote ----------
git branch -M main
git remote add origin "$REPO_URL"

# ---------- Push force ----------
echo ""
echo_info "Push vers GitHub (avec --force pour écraser l'ancien)..."
echo_warn "Si on te demande tes identifiants GitHub, utilise un Personal Access Token (PAT)"
echo_warn "comme mot de passe (pas ton mot de passe GitHub)."
echo_warn "Créer un PAT : https://github.com/settings/tokens (scope : repo)"
echo ""

if git push -u origin main --force; then
  echo ""
  echo "================================================"
  echo_ok "DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !"
  echo "================================================"
  echo ""
  echo_info "Ton code est maintenant sur GitHub : $REPO_URL"
  echo ""
  echo_info "Prochaines étapes (voir Histoire-GUIDE.md) :"
  echo "  1. Crée le projet Supabase + exécute schema.sql"
  echo "  2. Configure Google OAuth (optionnel)"
  echo "  3. Crée un compte Resend + déploie les Edge Functions"
  echo "  4. Connecte Vercel au repo + ajoute les variables d'env"
  echo "  5. Teste selon la checklist de l'étape 8 du GUIDE.md"
  echo ""
  if [ -n "$BACKUP_DIR" ]; then
    echo_info "Sauvegarde de l'ancien repo conservée dans : $BACKUP_DIR/"
    echo_info "Tu peux la supprimer quand tu seras sûr que tout marche : rm -rf $BACKUP_DIR"
  fi
  echo ""
  echo_ok "Bonne mise en production !"
else
  echo ""
  echo_err "Le push a échoué. Causes possibles :"
  echo_err "  - Authentification GitHub incorrecte (utilise un PAT, pas ton mot de passe)"
  echo_err "  - Pas les droits sur le repo (vérifie que tu es owner/collaborator)"
  echo_err "  - Réseau / pare-feu"
  echo ""
  echo_warn "Le dossier local $WORKDIR/ est conservé. Tu peux réessayer manuellement :"
  echo_warn "  cd $WORKDIR"
  echo_warn "  git push -u origin main --force"
  exit 1
fi

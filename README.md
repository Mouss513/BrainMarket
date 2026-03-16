# BrainMarket

> Ad intelligence SaaS — propulsé par Next.js 14

## Stack technique

- **Framework** : Next.js 14 (App Router)
- **Langage** : TypeScript
- **Style** : Tailwind CSS
- **Auth** : Clerk (à configurer)
- **Base de données** : Supabase (à configurer)

## Installation

### 1. Cloner le dépôt

```bash
git clone <url-du-repo>
cd BrainMarket
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

Copier `.env.local` et renseigner les valeurs :

```bash
cp .env.local .env.local.example
```

Remplir dans `.env.local` :

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clé publique Clerk (tableau de bord Clerk) |
| `CLERK_SECRET_KEY` | Clé secrète Clerk |
| `NEXT_PUBLIC_SUPABASE_URL` | URL de votre projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anonyme Supabase |

### 4. Lancer le serveur de développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans le navigateur.

## Structure du projet

```
BrainMarket/
├── app/                  # Pages et layouts (App Router)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/           # Composants réutilisables
├── lib/                  # Utilitaires et helpers
├── types/                # Types TypeScript partagés
├── public/               # Assets statiques
├── .env.local            # Variables d'environnement (non versionné)
└── README.md
```

## Scripts disponibles

```bash
npm run dev      # Serveur de développement
npm run build    # Build de production
npm run start    # Serveur de production
npm run lint     # Linter ESLint
```

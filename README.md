# Security System avec ABAC et Permit.io

Système de sécurité complet avec contrôle d'accès basé sur les attributs (ABAC), utilisant Node.js, React, SQLite et Permit.io.

## 🎯 Fonctionnalités

- **Authentification JWT** - Inscription et connexion sécurisées
- **Contrôle d'accès ABAC** - Gestion des permissions avec Permit.io
- **Gestion des ressources** - CRUD avec différents niveaux de sensibilité
- **Dashboard temps réel** - Statistiques et monitoring via WebSocket
- **Audit logging** - Traçabilité complète des accès
- **Scanner de vulnérabilités** - Simulation de scans périodiques
- **Gestion des utilisateurs** - Administration des comptes et rôles

## 🏗️ Architecture

### Backend
- **Framework**: Express.js
- **Base de données**: SQLite avec Prisma ORM
- **Authentification**: JWT + bcryptjs
- **Permissions**: Permit.io SDK
- **WebSocket**: Socket.io
- **Sécurité**: Helmet, CORS, Rate limiting

### Frontend
- **Framework**: React.js
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **WebSocket**: Socket.io-client
- **Styles**: CSS personnalisé

## 📦 Installation

### Prérequis
- Node.js (v16 ou supérieur)
- npm ou yarn

### Backend

```bash
# 1. Aller dans le dossier backend
cd backend

# 2. Installer les dépendances
npm install

# 3. Configurer Prisma et créer la base de données
npx prisma migrate dev --name init
npx prisma generate

# 4. (Optionnel) Peupler la base avec des données de test
npm run prisma:seed

# 5. Démarrer le serveur
npm run dev
```

Le serveur backend sera accessible sur `http://localhost:5000`

### Frontend

```bash
# 1. Aller dans le dossier frontend
cd frontend

# 2. Installer les dépendances
npm install

# 3. Démarrer l'application React
npm start
```

L'application frontend sera accessible sur `http://localhost:3000`

## 🔑 Comptes de Test

Après avoir exécuté le seed, vous pouvez vous connecter avec :

- **Stagiaire**: `intern@company.com` / `password123`
- **Analyste**: `analyst@company.com` / `password123`
- **Manager**: `manager@company.com` / `password123`
- **Admin**: `admin@company.com` / `password123`

## 🗂️ Structure du Projet

```
.
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Modèles de données
│   │   ├── dev.db             # Base SQLite (généré)
│   │   └── seed.js            # Données de test
│   ├── src/
│   │   ├── config/            # Configuration (Prisma, Permit, constantes)
│   │   ├── middleware/        # Middlewares (auth, permissions, etc.)
│   │   ├── controllers/       # Logique métier
│   │   ├── routes/           # Routes API
│   │   ├── services/         # Services (Permit, Audit, Scanner)
│   │   └── server.js         # Point d'entrée
│   ├── .env                  # Variables d'environnement
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/       # Composants réutilisables
    │   ├── pages/           # Pages de l'application
    │   ├── services/        # API client
    │   ├── contexts/        # Contextes React (Auth)
    │   ├── App.js          # Composant principal
    │   └── index.js        # Point d'entrée
    ├── public/
    ├── .env                # Variables d'environnement
    └── package.json

```

## 🔐 Modèle de Permissions (ABAC)

### Rôles

1. **INTERN** - Stagiaire
   - Accès limité aux ressources publiques
   - Lecture uniquement

2. **SECURITY_ANALYST** - Analyste de sécurité
   - Création de ressources
   - Lecture et modification de ses ressources
   - Lecture des ressources internes

3. **SECURITY_MANAGER** - Manager de sécurité
   - Toutes les permissions d'analyste
   - Accès au dashboard complet
   - Accès aux ressources confidentielles

4. **DEPARTMENT_HEAD** - Chef de département
   - Toutes les permissions
   - Gestion des utilisateurs
   - Suppression de toutes les ressources

### Niveaux de Sensibilité

- **PUBLIC** - Accessible à tous
- **INTERNAL** - Interne à l'organisation
- **CONFIDENTIAL** - Confidentiel
- **SECRET** - Secret (accès très restreint)

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion

### Users
- `GET /api/users/profile` - Profil utilisateur
- `GET /api/users` - Liste des utilisateurs (managers+)
- `PUT /api/users/:id` - Modifier un utilisateur (admin)

### Resources
- `POST /api/resources` - Créer une ressource
- `GET /api/resources` - Lister les ressources
- `GET /api/resources/:id` - Récupérer une ressource
- `PUT /api/resources/:id` - Modifier une ressource
- `DELETE /api/resources/:id` - Supprimer une ressource

### Dashboard
- `GET /api/dashboard/stats` - Statistiques (managers+)
- `GET /api/dashboard/audit-logs` - Logs d'audit

## 🛠️ Commandes Utiles

### Backend

```bash
# Démarrer en mode développement
npm run dev

# Démarrer en production
npm start

# Créer une migration Prisma
npm run prisma:migrate

# Ouvrir Prisma Studio (interface graphique)
npm run prisma:studio

# Peupler la base de données
npm run prisma:seed
```

### Frontend

```bash
# Démarrer en développement
npm start

# Build pour production
npm run build
```

## 🔧 Configuration

### Backend (.env)

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
JWT_SECRET=votre_secret_jwt
JWT_EXPIRE=24h
PERMIT_API_KEY=votre_clé_permit
COMPANY_IP_RANGES=192.168.1,10.0.0
WORK_HOURS_START=8
WORK_HOURS_END=18
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WS_URL=http://localhost:5000
```

## 🚀 Déploiement

### Backend
Le backend peut être déployé sur n'importe quelle plateforme Node.js (Heroku, Railway, Render, etc.)

### Frontend
Le frontend peut être déployé sur Vercel, Netlify, ou tout hébergeur de fichiers statiques.

## 📊 Scanner de Vulnérabilités

Le système inclut un scanner de vulnérabilités automatique qui :
- S'exécute toutes les 5 minutes
- Génère des résultats aléatoires (simulation)
- Envoie des mises à jour temps réel via WebSocket
- Stocke les résultats dans SQLite

## 🔍 Audit Logging

Tous les accès aux ressources sont enregistrés avec :
- Utilisateur
- Ressource
- Action (read/write/delete)
- Résultat (autorisé/refusé)
- IP et Device ID
- Horodatage

## 📝 License

MIT

## 👨‍💻 Auteur

Système développé avec Node.js, React et Permit.io

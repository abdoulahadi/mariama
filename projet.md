## Architecture Node.js + React.js + Permit.io + **SQLite** 🚀

### **Pourquoi SQLite ? Excellent choix !** ✨
- ✅ **Zéro configuration** - Pas de serveur à installer
- ✅ **Un seul fichier** - `database.sqlite`
- ✅ **Parfait pour dev/demo** - Léger et rapide
- ✅ **Facile à backup** - Copier le fichier = backup complet
- ✅ **Pas de dépendances** - Inclus avec Node.js

---

## **Stack Technique Mise à Jour** 📚

### **Backend**
- **Framework** : Express.js
- **ORM** : **Prisma** (moderne, type-safe) ou Sequelize
- **Base de données** : **SQLite** (fichier local)
- **Reste identique** : JWT, Permit, Socket.io, etc.

---

## **Installation Backend avec SQLite** 🛠️

```bash
mkdir security-system
cd security-system
mkdir backend frontend
cd backend

npm init -y

# Dépendances principales
npm install express dotenv bcryptjs jsonwebtoken cors helmet express-rate-limit joi socket.io winston

# Permit SDK
npm install @permitio/permit-js

# PRISMA pour SQLite (RECOMMANDÉ)
npm install prisma @prisma/client

# OU Sequelize (alternative)
# npm install sequelize sqlite3

# Dev dependencies
npm install --save-dev nodemon
```

---

## **Setup Prisma avec SQLite** 🗄️

```bash
# Initialiser Prisma
npx prisma init --datasource-provider sqlite

# Cela crée:
# - prisma/schema.prisma (modèles)
# - .env (avec DATABASE_URL)
```

---

## **Schema Prisma - Tous les Modèles** 📋

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// ===== MODÈLE USER =====
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  
  // Attributs ABAC
  role      Role     @default(INTERN)
  department String  @default("cybersecurity")
  
  // Attributs environnement
  authorizedIPs String? // JSON string array
  deviceId      String?
  
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  ownedResources Resource[] @relation("ResourceOwner")
  auditLogs      AuditLog[]
}

enum Role {
  INTERN
  SECURITY_ANALYST
  SECURITY_MANAGER
  DEPARTMENT_HEAD
}

// ===== MODÈLE RESOURCE =====
model Resource {
  id        String   @id @default(uuid())
  name      String
  
  // Attributs ABAC
  ownerId         String
  owner           User            @relation("ResourceOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  sensitivityLevel SensitivityLevel
  dataType        DataType
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  auditLogs AuditLog[]
}

enum SensitivityLevel {
  PUBLIC
  INTERNAL
  CONFIDENTIAL
  SECRET
}

enum DataType {
  DOCUMENT
  CODE
  CONFIGURATION
  CREDENTIALS
}

// ===== MODÈLE AUDIT LOG =====
model AuditLog {
  id         String   @id @default(uuid())
  
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  resourceId String?
  resource   Resource? @relation(fields: [resourceId], references: [id], onDelete: SetNull)
  
  action     String   // "read", "write", "delete"
  allowed    Boolean
  
  // Contexte
  ipAddress  String?
  deviceId   String?
  
  timestamp  DateTime @default(now())
  
  @@index([userId])
  @@index([resourceId])
  @@index([timestamp])
}

// ===== MODÈLE VULNERABILITY SCAN =====
model VulnerabilityScan {
  id          String   @id @default(uuid())
  
  targetSystem String
  
  // Compteurs par niveau
  critical    Int      @default(0)
  high        Int      @default(0)
  medium      Int      @default(0)
  low         Int      @default(0)
  
  scanDate    DateTime @default(now())
  
  @@index([scanDate])
}
```

---

## **Commandes Prisma**

```bash
# Créer la base de données SQLite et les tables
npx prisma migrate dev --name init

# Générer le client Prisma
npx prisma generate

# (Optionnel) Interface graphique pour visualiser la DB
npx prisma studio
```

**Résultat** : Un fichier `prisma/dev.db` est créé avec toutes les tables !

---

## **Structure Backend Mise à Jour** 📁

```
backend/
├── prisma/
│   ├── schema.prisma       # Modèles de données
│   └── dev.db             # Base SQLite (créée auto)
│
├── src/
│   ├── config/
│   │   ├── prisma.js      # ← Client Prisma
│   │   ├── permit.config.js
│   │   └── constants.js
│   │
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── permitCheck.js
│   │   ├── ipWhitelist.js
│   │   ├── workingHours.js
│   │   └── errorHandler.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── resourceController.js
│   │   └── dashboardController.js
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── resources.js
│   │   └── dashboard.js
│   │
│   ├── services/
│   │   ├── permitService.js
│   │   ├── auditService.js
│   │   └── scannerService.js
│   │
│   └── server.js
│
├── .env
├── .gitignore
└── package.json
```

---

## **Code Backend - Fichiers Clés avec SQLite/Prisma** 💻

### **1. Configuration Prisma Client**

```javascript
// src/config/prisma.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'], // Logs SQL (optionnel)
});

// Gestion propre de la déconnexion
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
```

---

### **2. Controller Auth avec Prisma**

```javascript
// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const permitService = require('../services/permitService');

exports.register = async (req, res) => {
  try {
    const { email, password, role, department } = req.body;
    
    // Vérifier si user existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Email déjà utilisé' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Créer user dans SQLite
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role || 'INTERN',
        department: department || 'cybersecurity'
      }
    });
    
    // Synchroniser avec Permit Cloud
    await permitService.syncUser(user);
    
    // Générer token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );
    
    res.status(201).json({
      message: 'Utilisateur créé',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
    
  } catch (error) {
    console.error('Erreur register:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Trouver user
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }
    
    // Vérifier password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }
    
    // Vérifier que user est actif
    if (!user.isActive) {
      return res.status(403).json({ error: 'Compte désactivé' });
    }
    
    // Générer token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );
    
    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
    
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
```

---

### **3. Controller Resources avec Prisma**

```javascript
// src/controllers/resourceController.js
const prisma = require('../config/prisma');
const permitService = require('../services/permitService');

exports.createResource = async (req, res) => {
  try {
    const { name, sensitivityLevel, dataType } = req.body;
    
    const resource = await prisma.resource.create({
      data: {
        name,
        sensitivityLevel,
        dataType,
        ownerId: req.user.id
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      }
    });
    
    res.status(201).json({
      message: 'Ressource créée',
      resource
    });
    
  } catch (error) {
    console.error('Erreur création ressource:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getResource = async (req, res) => {
  try {
    // req.resource est défini par le middleware permitCheck
    res.json({ resource: req.resource });
  } catch (error) {
    console.error('Erreur lecture ressource:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.updateResource = async (req, res) => {
  try {
    const { name, sensitivityLevel, dataType } = req.body;
    
    const updatedResource = await prisma.resource.update({
      where: { id: req.params.id },
      data: {
        name,
        sensitivityLevel,
        dataType,
        updatedAt: new Date()
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      }
    });
    
    res.json({
      message: 'Ressource mise à jour',
      resource: updatedResource
    });
    
  } catch (error) {
    console.error('Erreur mise à jour ressource:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.deleteResource = async (req, res) => {
  try {
    await prisma.resource.delete({
      where: { id: req.params.id }
    });
    
    res.json({ message: 'Ressource supprimée' });
    
  } catch (error) {
    console.error('Erreur suppression ressource:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.listResources = async (req, res) => {
  try {
    const resources = await prisma.resource.findMany({
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json({ resources });
    
  } catch (error) {
    console.error('Erreur liste ressources:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
```

---

### **4. Service Permit avec Prisma**

```javascript
// src/services/permitService.js
const permit = require('../config/permit.config');
const prisma = require('../config/prisma');

class PermitService {
  
  // Synchroniser un user avec Permit Cloud
  async syncUser(user) {
    try {
      await permit.api.syncUser({
        key: user.id,
        email: user.email,
        attributes: {
          role: user.role,
          department: user.department
        }
      });
      console.log(`✅ User ${user.email} synchronisé avec Permit`);
    } catch (error) {
      console.error('❌ Erreur sync Permit:', error.message);
    }
  }
  
  // Vérifier une permission
  async checkPermission(userId, action, resource) {
    try {
      const allowed = await permit.check(
        userId,
        action, // 'read', 'write', 'delete'
        {
          type: 'resource',
          tenant: 'default',
          attributes: {
            owner: resource.ownerId,
            sensitivity: resource.sensitivityLevel,
            dataType: resource.dataType
          }
        }
      );
      
      // Log audit dans SQLite
      await this.logAccess(userId, action, resource.id, allowed);
      
      return allowed;
      
    } catch (error) {
      console.error('❌ Erreur check Permit:', error.message);
      return false;
    }
  }
  
  // Logger l'accès dans SQLite
  async logAccess(userId, action, resourceId, allowed, ipAddress = null, deviceId = null) {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          resourceId,
          allowed,
          ipAddress,
          deviceId,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('❌ Erreur log audit:', error.message);
    }
  }
  
}

module.exports = new PermitService();
```

---

### **5. Middleware Permit Check avec SQLite**

```javascript
// src/middleware/permitCheck.js
const permitService = require('../services/permitService');
const prisma = require('../config/prisma');

const checkPermission = (action) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      
      // Récupérer la ressource depuis SQLite
      const resource = await prisma.resource.findUnique({
        where: { id: resourceId },
        include: {
          owner: true
        }
      });
      
      if (!resource) {
        return res.status(404).json({ error: 'Ressource introuvable' });
      }
      
      // Cas spécial: suppression requiert propriétaire OU department_head
      if (action === 'delete') {
        const isOwner = resource.ownerId === req.user.id;
        const isDeptHead = req.user.role === 'DEPARTMENT_HEAD';
        
        if (!isOwner && !isDeptHead) {
          await permitService.logAccess(
            req.user.id, 
            action, 
            resource.id, 
            false,
            req.ip,
            req.headers['x-device-id']
          );
          
          return res.status(403).json({ 
            error: 'Seul le propriétaire ou le Department Head peut supprimer' 
          });
        }
      }
      
      // Vérifier via Permit.io
      const allowed = await permitService.checkPermission(
        req.user.id,
        action,
        resource
      );
      
      if (!allowed) {
        return res.status(403).json({ error: 'Permission refusée par la politique ABAC' });
      }
      
      // Attacher la ressource à la requête pour utilisation dans le controller
      req.resource = resource;
      next();
      
    } catch (error) {
      console.error('Erreur vérification permission:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  };
};

module.exports = checkPermission;
```

---

### **6. Controller Dashboard avec Stats SQLite**

```javascript
// src/controllers/dashboardController.js
const prisma = require('../config/prisma');

exports.getStats = async (req, res) => {
  try {
    // Vérifier que user peut accéder au dashboard
    if (!['SECURITY_MANAGER', 'DEPARTMENT_HEAD'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé au dashboard' });
    }
    
    // Stats utilisateurs
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: { isActive: true }
    });
    
    // Stats ressources
    const totalResources = await prisma.resource.count();
    const resourcesByType = await prisma.resource.groupBy({
      by: ['dataType'],
      _count: true
    });
    
    // Stats accès (dernières 24h)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const accessLogs = await prisma.auditLog.count({
      where: {
        timestamp: { gte: yesterday }
      }
    });
    
    const deniedAccess = await prisma.auditLog.count({
      where: {
        timestamp: { gte: yesterday },
        allowed: false
      }
    });
    
    // Derniers scans de vulnérabilités
    const recentScans = await prisma.vulnerabilityScan.findMany({
      take: 20,
      orderBy: { scanDate: 'desc' }
    });
    
    res.json({
      users: {
        total: totalUsers,
        active: activeUsers
      },
      resources: {
        total: totalResources,
        byType: resourcesByType
      },
      access: {
        last24h: accessLogs,
        denied: deniedAccess
      },
      vulnerabilities: recentScans
    });
    
  } catch (error) {
    console.error('Erreur stats dashboard:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const logs = await prisma.auditLog.findMany({
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      include: {
        user: {
          select: {
            email: true,
            role: true
          }
        },
        resource: {
          select: {
            name: true,
            sensitivityLevel: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });
    
    const total = await prisma.auditLog.count();
    
    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Erreur audit logs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
```

---

### **7. Service Scanner de Vulnérabilités (Simulation)**

```javascript
// src/services/scannerService.js
const prisma = require('../config/prisma');

class ScannerService {
  
  constructor(io) {
    this.io = io;
  }
  
  // Simuler un scan de vulnérabilités
  async runScan() {
    try {
      // Simuler des résultats aléatoires
      const scanResult = {
        targetSystem: 'Production Server',
        critical: Math.floor(Math.random() * 5),
        high: Math.floor(Math.random() * 10),
        medium: Math.floor(Math.random() * 20),
        low: Math.floor(Math.random() * 30),
      };
      
      // Enregistrer dans SQLite
      const scan = await prisma.vulnerabilityScan.create({
        data: scanResult
      });
      
      // Émettre via WebSocket pour le dashboard
      if (this.io) {
        this.io.to('dashboard-room').emit('vulnerability-update', {
          ...scan,
          timestamp: scan.scanDate.toISOString()
        });
      }
      
      console.log('✅ Scan de vulnérabilités effectué:', scan.id);
      return scan;
      
    } catch (error) {
      console.error('❌ Erreur scan:', error);
    }
  }
  
  // Lancer des scans périodiques
  startPeriodicScans(intervalMinutes = 5) {
    console.log(`🔄 Scans périodiques démarrés (toutes les ${intervalMinutes} min)`);
    
    // Premier scan immédiat
    this.runScan();
    
    // Puis scans périodiques
    setInterval(() => {
      this.runScan();
    }, intervalMinutes * 60 * 1000);
  }
  
}

module.exports = ScannerService;
```

---

### **8. Server.js avec Scanner Automatique**

```javascript
// src/server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const prisma = require('./config/prisma');
const ScannerService = require('./services/scannerService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { 
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Middleware global
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/dashboard', require('./routes/dashboard'));

// WebSocket pour dashboard temps réel
io.on('connection', (socket) => {
  console.log('🔌 Client connecté:', socket.id);
  
  socket.on('join-dashboard', (userData) => {
    if (['SECURITY_MANAGER', 'DEPARTMENT_HEAD'].includes(userData.role)) {
      socket.join('dashboard-room');
      console.log(`✅ ${userData.email} a rejoint le dashboard`);
    } else {
      socket.emit('error', { message: 'Accès dashboard refusé' });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Client déconnecté:', socket.id);
  });
});

// Initialiser le scanner de vulnérabilités
const scanner = new ScannerService(io);
scanner.startPeriodicScans(5); // Scan toutes les 5 minutes

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
  console.log(`📊 Database SQLite: prisma/dev.db`);
});

// Gestion propre de l'arrêt
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt du serveur...');
  await prisma.$disconnect();
  process.exit(0);
});
```

---

## **Fichier .env Backend**

```env
# Server
PORT=5000
NODE_ENV=development

# SQLite Database
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET=ton_super_secret_jwt_ultra_securise_ici_change_moi
JWT_EXPIRE=24h

# Permit.io
PERMIT_API_KEY=permit_key_xxxxxxxxxxxxxxxx

# Contraintes environnement
COMPANY_IP_RANGES=192.168.1,10.0.0
WORK_HOURS_START=8
WORK_HOURS_END=18

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

---

## **Package.json Backend**

```json
{
  "name": "security-backend-sqlite",
  "version": "1.0.0",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "prisma:migrate": "npx prisma migrate dev",
    "prisma:generate": "npx prisma generate",
    "prisma:studio": "npx prisma studio",
    "prisma:seed": "node prisma/seed.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "@prisma/client": "^5.7.0",
    "dotenv": "^16.3.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "joi": "^17.11.0",
    "socket.io": "^4.6.0",
    "winston": "^3.11.0",
    "@permitio/permit-js": "^2.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "prisma": "^5.7.0"
  }
}
```

---

## **Script de Seed (Données Initiales)** 🌱

```javascript
// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  
  // Créer des utilisateurs de test
  const users = [
    {
      email: 'intern@company.com',
      password: await bcrypt.hash('password123', 10),
      role: 'INTERN',
      department: 'cybersecurity'
    },
    {
      email: 'analyst@company.com',
      password: await bcrypt.hash('password123', 10),
      role: 'SECURITY_ANALYST',
      department: 'cybersecurity'
    },
    {
      email: 'manager@company.com',
      password: await bcrypt.hash('password123', 10),
      role: 'SECURITY_MANAGER',
      department: 'cybersecurity'
    },
    {
      email: 'admin@company.com',
      password: await bcrypt.hash('password123', 10),
      role: 'DEPARTMENT_HEAD',
      department: 'cybersecurity'
    }
  ];
  
  for (const userData of users) {
    const user = await prisma.user.create({
      data: userData
    });
    console.log(`✅ Created user: ${user.email}`);
  }
  
  // Créer des ressources de test
  const analyst = await prisma.user.findUnique({
    where: { email: 'analyst@company.com' }
  });
  
  const resources = [
    {
      name: 'Security Policy Document',
      ownerId: analyst.id,
      sensitivityLevel: 'CONFIDENTIAL',
      dataType: 'DOCUMENT'
    },
    {
      name: 'API Keys Configuration',
      ownerId: analyst.id,
      sensitivityLevel: 'SECRET',
      dataType: 'CREDENTIALS'
    },
    {
      name: 'Firewall Rules',
      ownerId: analyst.id,
      sensitivityLevel: 'INTERNAL',
      dataType: 'CONFIGURATION'
    }
  ];
  
  for (const resourceData of resources) {
    const resource = await prisma.resource.create({
      data: resourceData
    });
    console.log(`✅ Created resource: ${resource.name}`);
  }
  
  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Exécuter le seed** :
```bash
npm run prisma:seed
```

---

## **Démarrage Complet** 🚀

```bash
# 1. Installation
cd backend
npm install

# 2. Setup Prisma + SQLite
npx prisma migrate dev --name init
npx prisma generate

# 3. (Optionnel) Données de test
npm run prisma:seed

# 4. Démarrer le serveur
npm run dev

# 5. (Optionnel) Ouvrir Prisma Studio pour visualiser la DB
npm run prisma:studio
```

---

## **Avantages de SQLite avec Prisma** ✨

1. **Zéro configuration** - Pas de serveur DB à installer
2. **Fichier unique** - `prisma/dev.db` = toute la base
3. **Prisma Studio** - Interface graphique gratuite pour voir les données
4. **Type-safety** - Prisma génère des types TypeScript (si tu migres)
5. **Migrations** - Historique des changements de schéma
6. **Performance** - Parfait pour <100k requêtes/jour
7. **Backup facile** - Copier `dev.db` = backup complet
8. **Portable** - Fonctionne partout (Windows, Mac, Linux)

---

## **Commandes Utiles SQLite/Prisma**

```bash
# Créer une nouvelle migration
npx prisma migrate dev --name add_new_field

# Réinitialiser la DB (ATTENTION: supprime toutes les données)
npx prisma migrate reset

# Visualiser la DB en mode graphique
npx prisma studio

# Générer le client Prisma après modif du schema
npx prisma generate

# Voir les requêtes SQL en direct
# → Dans prisma.js, ajouter: log: ['query']
```

---

## **Frontend - Aucun Changement !** ⚛️

Le frontend reste exactement identique, car l'API REST est la même. SQLite est transparent côté client.

---

## **Structure Finale du Projet**

```
security-system/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── dev.db          ← Base SQLite
│   │   └── seed.js
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.js
│   ├── .env
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   └── App.jsx
    ├── .env
    └── package.json
```


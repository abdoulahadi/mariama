// src/server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const prisma = require('./config/prisma');
const ScannerService = require('./services/scannerService');
const permitService = require('./services/permitService');
const permitSetupService = require('./services/permitSetupService');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Connecter permitService à Socket.io pour notifications temps réel
permitService.setSocketIo(io);

// Middleware global
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'Security System API is running' });
});

// Webhook Permit.io pour recevoir les changements de permissions en temps réel
app.post('/api/webhooks/permit', async (req, res) => {
  try {
    console.log('[Webhook Permit.io] Reçu:', JSON.stringify(req.body, null, 2));

    const { action, data } = req.body;

    // Quand une permission/policy change, notifier tous les utilisateurs concernés
    if (action === 'policy_updated' || action === 'role_updated' || action === 'user_updated') {
      // Rafraîchir les permissions de tous les utilisateurs connectés
      const users = await prisma.user.findMany({ where: { isActive: true } });

      for (const user of users) {
        const permissions = await permitService.getUserPermissions(user);
        io.to(`user-${user.id}`).emit('permission-update', {
          permissions,
          timestamp: new Date().toISOString(),
          source: 'permit-webhook'
        });
      }

      console.log('[Webhook Permit.io] Permissions mises à jour pour', users.length, 'utilisateurs');
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Webhook Permit.io] Erreur:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Error handler (doit être en dernier)
app.use(errorHandler);

// WebSocket pour dashboard et permissions temps réel
io.on('connection', (socket) => {
  console.log('🔌 Client connecté:', socket.id);

  // Rejoindre la room personnelle pour les notifications de permissions
  socket.on('join-user-room', (userData) => {
    if (userData.id) {
      socket.join(`user-${userData.id}`);
      console.log(`✅ ${userData.email} a rejoint sa room personnelle`);
    }
  });

  // Rejoindre le dashboard (managers only)
  socket.on('join-dashboard', (userData) => {
    if (['SECURITY_MANAGER', 'DEPARTMENT_HEAD'].includes(userData.role)) {
      socket.join('dashboard-room');
      console.log(`✅ ${userData.email} a rejoint le dashboard`);
    } else {
      socket.emit('error', { message: 'Accès dashboard refusé' });
    }
  });

  // Demander un rafraîchissement des permissions
  socket.on('refresh-permissions', async (userData) => {
    if (userData.id) {
      const permissions = await permitService.getUserPermissions(userData.id);
      socket.emit('permission-update', {
        permissions,
        timestamp: new Date().toISOString()
      });
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

server.listen(PORT, async () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
  console.log(`📊 Database SQLite: prisma/dev.db`);
  console.log(`🔐 Permit.io connecté pour ABAC`);

  // Initialiser la configuration Permit.io (ressources, rôles, permissions)
  await permitSetupService.initializePermitConfig();

  // Synchroniser tous les utilisateurs existants avec Permit.io
  console.log('🔄 Synchronisation des utilisateurs avec Permit.io...');
  await permitService.syncAllUsers();
});

// Gestion propre de l'arrêt
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt du serveur...');
  await prisma.$disconnect();
  process.exit(0);
});

// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const auth = async (req, res, next) => {
  try {
    // Récupérer le token du header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const token = authHeader.substring(7);

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupérer l'utilisateur complet depuis la DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Compte désactivé' });
    }

    // Attacher l'utilisateur à la requête
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token invalide' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré' });
    }
    console.error('Erreur auth middleware:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = auth;

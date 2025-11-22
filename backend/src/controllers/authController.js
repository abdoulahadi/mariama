// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const permitService = require('../services/permitService');

// Register - Admin only (DEPARTMENT_HEAD)
exports.register = async (req, res) => {
  try {
    // Vérifier que l'utilisateur connecté est admin
    if (req.user.role !== 'DEPARTMENT_HEAD') {
      return res.status(403).json({ error: 'Seul le Chef de Département peut créer des utilisateurs' });
    }

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

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
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

    // Récupérer les permissions depuis Permit (passer l'objet user complet)
    const permissions = await permitService.getUserPermissions(user);

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
      },
      permissions
    });

  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer les permissions de l'utilisateur connecté
exports.getPermissions = async (req, res) => {
  try {
    // req.user est l'objet user complet (attaché par le middleware auth)
    const permissions = await permitService.getUserPermissions(req.user);
    res.json({ permissions });
  } catch (error) {
    console.error('Erreur getPermissions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Rafraîchir les permissions (force refresh depuis Permit.io)
exports.refreshPermissions = async (req, res) => {
  try {
    const permissions = await permitService.getUserPermissions(req.user);
    res.json({
      message: 'Permissions rafraîchies',
      permissions
    });
  } catch (error) {
    console.error('Erreur refreshPermissions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

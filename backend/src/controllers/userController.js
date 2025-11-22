// src/controllers/userController.js
const prisma = require('../config/prisma');

exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({ user });
  } catch (error) {
    console.error('Erreur getProfile:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.listUsers = async (req, res) => {
  try {
    // Vérifier que le user a les droits (manager ou department head)
    if (!['SECURITY_MANAGER', 'DEPARTMENT_HEAD'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ users });
  } catch (error) {
    console.error('Erreur listUsers:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, department, isActive } = req.body;

    // Vérifier que le user a les droits
    if (req.user.role !== 'DEPARTMENT_HEAD') {
      return res.status(403).json({ error: 'Seul le Department Head peut modifier les utilisateurs' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        role,
        department,
        isActive
      },
      select: {
        id: true,
        email: true,
        role: true,
        department: true,
        isActive: true
      }
    });

    res.json({
      message: 'Utilisateur mis à jour',
      user: updatedUser
    });
  } catch (error) {
    console.error('Erreur updateUser:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

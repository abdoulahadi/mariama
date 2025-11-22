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

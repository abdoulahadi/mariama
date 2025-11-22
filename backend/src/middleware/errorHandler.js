// src/middleware/errorHandler.js

const errorHandler = (err, req, res, next) => {
  console.error('❌ Erreur:', err);

  // Erreur Prisma
  if (err.code && err.code.startsWith('P')) {
    return res.status(400).json({
      error: 'Erreur de base de données',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Erreur de validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Erreur de validation',
      details: err.message
    });
  }

  // Erreur par défaut
  res.status(err.status || 500).json({
    error: err.message || 'Erreur serveur interne',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;

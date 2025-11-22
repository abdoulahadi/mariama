// src/middleware/ipWhitelist.js
const { COMPANY_IP_RANGES } = require('../config/constants');

const ipWhitelist = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;

  // Vérifier si l'IP commence par l'un des préfixes autorisés
  const isAllowed = COMPANY_IP_RANGES.some(prefix =>
    clientIP.includes(prefix)
  );

  if (!isAllowed && process.env.NODE_ENV === 'production') {
    console.warn(`🚫 IP non autorisée: ${clientIP}`);
    return res.status(403).json({
      error: 'Accès refusé: IP non autorisée',
      ip: clientIP
    });
  }

  next();
};

module.exports = ipWhitelist;

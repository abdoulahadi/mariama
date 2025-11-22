// src/middleware/workingHours.js
const { WORK_HOURS } = require('../config/constants');

const workingHours = (req, res, next) => {
  const currentHour = new Date().getHours();

  // Vérifier si on est dans les heures de travail
  if (currentHour < WORK_HOURS.START || currentHour >= WORK_HOURS.END) {
    // Autoriser quand même les managers et department heads
    if (!['SECURITY_MANAGER', 'DEPARTMENT_HEAD'].includes(req.user.role)) {
      return res.status(403).json({
        error: `Accès autorisé uniquement entre ${WORK_HOURS.START}h et ${WORK_HOURS.END}h`,
        currentHour
      });
    }
  }

  next();
};

module.exports = workingHours;

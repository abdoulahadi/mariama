// src/config/constants.js

module.exports = {
  ROLES: {
    INTERN: 'INTERN',
    SECURITY_ANALYST: 'SECURITY_ANALYST',
    SECURITY_MANAGER: 'SECURITY_MANAGER',
    DEPARTMENT_HEAD: 'DEPARTMENT_HEAD'
  },

  SENSITIVITY_LEVELS: {
    PUBLIC: 'PUBLIC',
    INTERNAL: 'INTERNAL',
    CONFIDENTIAL: 'CONFIDENTIAL',
    SECRET: 'SECRET'
  },

  DATA_TYPES: {
    DOCUMENT: 'DOCUMENT',
    CODE: 'CODE',
    CONFIGURATION: 'CONFIGURATION',
    CREDENTIALS: 'CREDENTIALS'
  },

  ACTIONS: {
    READ: 'read',
    WRITE: 'write',
    DELETE: 'delete'
  },

  WORK_HOURS: {
    START: parseInt(process.env.WORK_HOURS_START) || 8,
    END: parseInt(process.env.WORK_HOURS_END) || 18
  },

  COMPANY_IP_RANGES: (process.env.COMPANY_IP_RANGES || '192.168.1,10.0.0').split(',')
};

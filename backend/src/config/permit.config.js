// src/config/permit.config.js
const Permit = require('permitio').Permit;

const permit = new Permit({
  token: process.env.PERMIT_API_KEY,
  pdp: 'https://cloudpdp.api.permit.io',
  log: {
    level: 'debug'
  }
});

module.exports = permit;

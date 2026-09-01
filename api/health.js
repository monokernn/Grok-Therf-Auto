'use strict';

module.exports = function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.status(200).json({ ok: true, service: 'grok-therf-auto', now: Date.now() });
};


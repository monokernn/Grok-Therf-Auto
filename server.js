'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { getState } = require('./src/engine');

const root = __dirname;
const port = Number(process.env.PORT) || 8790;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8'
};

function sendJson(response, payload) {
  response.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  });
  response.end(JSON.stringify(payload));
}

http.createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost');
  if (url.pathname === '/api/state') return sendJson(response, getState(Date.now()));
  if (url.pathname === '/api/health') return sendJson(response, { ok: true, service: 'grok-therf-auto', now: Date.now() });

  const safePath = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\/+/, '');
  const filePath = path.resolve(root, safePath);
  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return response.end('Not found');
  }

  response.writeHead(200, {
    'Content-Type': types[path.extname(filePath)] || 'application/octet-stream',
    'Cache-Control': path.extname(filePath) === '.html' ? 'no-cache' : 'public, max-age=300'
  });
  fs.createReadStream(filePath).pipe(response);
}).listen(port, () => console.log(`Grok Therf Auto running at http://localhost:${port}`));


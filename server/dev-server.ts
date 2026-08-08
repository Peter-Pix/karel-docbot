// Local dev server for Vercel-style API routes.
// Usage: node --import tsx server/dev-server.ts
// Serves /api/* endpoints from ../api/*.ts handlers.

import http from 'node:http';
import url from 'node:url';

// @ts-ignore dynamic import ESM from TS files
const handlers: Record<string, (req: any, res: any) => void | Promise<void>> = {};

async function loadHandler(route: string) {
  if (handlers[route]) return handlers[route];
  try {
    const mod = await import(`../api/${route}.ts`);
    handlers[route] = mod.default;
    return mod.default;
  } catch (err) {
    console.error(`[dev-server] Failed to load handler /api/${route}:`, err);
    return null;
  }
}

function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf-8');
        if (!raw) return resolve({});
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function setCORS(res: http.ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

const server = http.createServer(async (req, res) => {
  setCORS(res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsed = url.parse(req.url || '/', true);
  const match = parsed.pathname?.match(/^\/api\/([^/]+)$/);
  if (!match) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  const route = match[1];
  const handler = await loadHandler(route);
  if (!handler) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `Handler /api/${route} not found` }));
    return;
  }

  const body = await parseBody(req);
  const vercelReq = Object.assign(req, {
    query: parsed.query,
    body,
    cookies: {},
  });
  const vercelRes: any = res;
  vercelRes.status = (code: number) => {
    res.statusCode = code;
    return vercelRes;
  };
  vercelRes.json = (data: any) => {
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    }
  };
  vercelRes.send = (data: any) => {
    if (!res.headersSent) {
      res.end(data);
    }
  };

  try {
    await handler(vercelReq, vercelRes);
  } catch (err) {
    console.error(`[dev-server] Handler /api/${route} error:`, err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`[dev-server] API server running at http://localhost:${PORT}/api`);
});

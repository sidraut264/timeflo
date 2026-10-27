// Local server for the static site and its Gemini function. Node 20+.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
for (const name of ['.env.local', '.env']) {
  const file = path.join(root, name);
  if (fs.existsSync(file)) for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z_][A-Z_0-9]*)\s*=\s*(.*)$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, '$2');
  }
}
const handler = require('../api/tarot.js');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json' };
http.createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/api/tarot' || pathname === '/api/gemini') {
    res.status = status => { res.statusCode = status; return res; };
    res.json = value => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(value)); };
    try {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (Buffer.byteLength(body) > 16384) return res.status(413).json({ error: 'Request too large.' });
      }
      req.body = body || '{}';
      await handler(req, res);
    } catch {
      res.status(500).json({ error: 'Local server error.' });
    }
    return;
  }
  let relative;
  try { relative = decodeURIComponent(pathname); } catch { res.writeHead(400).end(); return; }
  if (relative === '/') relative = '/tarot-and-tea.html';
  if (!path.extname(relative)) relative += '.html';
  const file = path.resolve(root, '.' + relative);
  const segments = path.relative(root, file).split(path.sep);
  if (!file.startsWith(root + path.sep) || segments.some(p => p.startsWith('.') || p === 'node_modules') || ['api', 'scripts'].includes(segments[0])) {
    res.writeHead(403).end(); return;
  }
  try {
    const data = await fs.promises.readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(data);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(Number(process.env.PORT) || 8765, '127.0.0.1', () => console.log('Tarot & Tea: http://127.0.0.1:' + (process.env.PORT || 8765)));

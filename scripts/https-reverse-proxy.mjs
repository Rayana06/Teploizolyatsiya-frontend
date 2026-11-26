import { createServer } from 'node:https'
import { request as httpRequest } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { createReadStream, readFileSync } from 'node:fs'
import { extname, join, resolve, sep } from 'node:path'

const root = resolve('dist')
const port = Number(process.env.HTTPS_PORT || 8443)
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp4': 'video/mp4' }

function proxy(req, res, port, pathname) {
  const upstream = httpRequest({ hostname: '127.0.0.1', port, path: pathname, method: req.method, headers: { ...req.headers, host: `127.0.0.1:${port}` } }, (response) => {
    res.writeHead(response.statusCode || 502, response.headers)
    response.pipe(res)
  })
  upstream.on('error', () => { if (!res.headersSent) res.writeHead(502); res.end('Upstream unavailable') })
  req.pipe(upstream)
}

createServer({ key: readFileSync('certs/server.key'), cert: readFileSync('certs/server.crt') }, async (req, res) => {
  const url = new URL(req.url || '/', `https://${req.headers.host || 'localhost'}`)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/insulation-materials-assets/')) return proxy(req, res, 3001, url.pathname + url.search)
  if (url.pathname.startsWith('/silo/')) return proxy(req, res, 9022, url.pathname.slice('/silo'.length) + url.search)
  let file = resolve(root, '.' + decodeURIComponent(url.pathname))
  if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403); res.end(); return }
  try {
    const info = await stat(file)
    if (info.isDirectory()) file = join(file, 'index.html')
    else if (!info.isFile()) throw new Error('Not a file')
  } catch {
    if (extname(file)) { res.writeHead(404); res.end(); return }
    file = join(root, 'index.html')
  }
  try {
    await readFile(file)
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': file.endsWith('sw.js') ? 'no-cache' : 'public, max-age=3600' })
    createReadStream(file).pipe(res)
  } catch { res.writeHead(404); res.end() }
}).listen(port, '0.0.0.0', () => console.log(`HTTPS reverse proxy listening on port ${port}`))

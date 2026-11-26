import { readdir, writeFile } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const base = process.env.VITE_DEPLOY_TARGET === 'pages' ? '/Teploizolyatsiya-frontend/' : '/'

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const file = join(directory, entry.name)
    return entry.isDirectory() ? filesIn(file) : [file]
  }))
  return nested.flat()
}

const files = (await filesIn(dist))
  .map((file) => relative(dist, file).split(sep).join('/'))
  .filter((file) => !file.endsWith('.mp4') && file !== 'sw.js')
const precache = [base, ...files.map((file) => base + file)]
const script = `const CACHE = 'teploshchit-${process.env.VITE_DEPLOY_TARGET === 'pages' ? 'pages' : 'local'}-v1';
const BASE = ${JSON.stringify(base)};
const PRECACHE = ${JSON.stringify(precache)};
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('teploshchit-') && key !== CACHE).map((key) => caches.delete(key)))), self.clients.claim()]));
});
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || /\\/(api|silo|insulation-materials-assets)\\//.test(url.pathname)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match(BASE)));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
`
await writeFile(join(dist, 'sw.js'), script)
console.log(`PWA: ${precache.length} static files cached under ${base}`)

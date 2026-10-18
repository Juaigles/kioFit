// Sirve el build estático de `nuxt generate` (.output/public) para Playwright.
// `nuxt preview` no sirve salidas estáticas, y así no hace falta otra dependencia.
// Las rutas sin archivo caen en 200.html, como en Cloudflare Pages con una SPA.
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve, sep } from 'node:path'

const root = resolve('.output/public')
const port = Number(process.env.PORT ?? 3000)

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

async function resolveFile(urlPath) {
  const candidate = normalize(join(root, decodeURIComponent(urlPath)))
  if (candidate !== root && !candidate.startsWith(root + sep)) return null
  const info = await stat(candidate).catch(() => null)
  if (info?.isFile()) return candidate
  if (info?.isDirectory()) {
    const index = join(candidate, 'index.html')
    if ((await stat(index).catch(() => null))?.isFile()) return index
  }
  return null
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost')
  const file = (await resolveFile(pathname)) ?? join(root, '200.html')
  res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' })
  createReadStream(file).pipe(res)
}).listen(port, () => {
  console.log(`Sirviendo ${root} en http://localhost:${port}`)
})

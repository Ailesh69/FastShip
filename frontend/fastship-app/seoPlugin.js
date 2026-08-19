import fs from 'node:fs'
import path from 'node:path'
import {
  PLACEHOLDER_ORIGIN,
  PRIVATE_ROUTES,
  PUBLIC_ROUTES,
  titleFor,
} from './src/config/pageTitles.js'

// Build-time SEO for a client-rendered app.
//
// THE PROBLEM THIS SOLVES
// The per-route <title> and description are set by React once it has booted.
// Google runs JS so search is fine, but the scrapers that build link previews
// — Slack, iMessage, WhatsApp, Facebook, X — do not. They read the HTML the
// server returned and stop there. With one index.html serving every route,
// sharing a link to /track previewed as the homepage, whatever page you were
// actually on.
//
// WHAT IT DOES
// 1. Writes one real HTML file per PUBLIC route (`/track` -> `track/index.html`),
//    cloned from the built index.html with that route's title, description,
//    og:title, og:description, og:url and canonical swapped in. Each still boots
//    the same SPA, so behaviour is identical — only the bytes a scraper reads
//    before any JS runs are different.
// 2. Generates robots.txt and sitemap.xml from the same route list, so they
//    cannot drift from the app's real routes.
// 3. Replaces the placeholder host everywhere with VITE_SITE_URL, and makes
//    og:image absolute (relative ones are ignored by most scrapers).
//
// CONFIGURING THE DOMAIN
//   VITE_SITE_URL=https://fastship.example.com npm run build
// or put it in frontend/fastship-app/.env. Leave it unset and everything keeps
// the visible PLACEHOLDER_ORIGIN — wrong, but obviously wrong.
//
// WHY transformIndexHtml + closeBundle RATHER THAN generateBundle
// The first version of this hooked generateBundle and read bundle['index.html'].
// That silently emitted nothing: Vite's own HTML plugin adds index.html to the
// bundle in ITS generateBundle, which had not run yet. transformIndexHtml with
// order:'post' is the documented point at which the HTML is final, and
// closeBundle is the point at which outDir is guaranteed written.
//
// NOTE ON HOSTING: the per-route files assume a static host that serves
// `/track/index.html` for `/track` — Netlify, Vercel, Cloudflare Pages, GitHub
// Pages and nginx `try_files` all do. Keep the SPA fallback to index.html for
// everything else so unknown paths still reach the in-app 404.

const trimSlash = (s) => s.replace(/\/+$/, '')

const escapeAttr = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

// Swap a <meta>'s content by name= or property=, leaving formatting alone.
function setMeta(html, attr, key, value) {
  const re = new RegExp(`(<meta[^>]*${attr}="${key}"[^>]*content=")[^"]*(")`, 'i')
  return re.test(html) ? html.replace(re, `$1${escapeAttr(value)}$2`) : html
}

function routeHtml(baseHtml, origin, route) {
  const url = route.path === '/' ? `${origin}/` : `${origin}${route.path}`
  let html = baseHtml
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${titleFor(route.path)}</title>`)
  html = setMeta(html, 'name', 'description', route.description)
  html = setMeta(html, 'property', 'og:title', titleFor(route.path))
  html = setMeta(html, 'property', 'og:description', route.description)
  html = setMeta(html, 'property', 'og:url', url)
  html = html.replace(/(<link[^>]*rel="canonical"[^>]*href=")[^"]*(")/i, `$1${escapeAttr(url)}$2`)
  return html
}

export function seo() {
  let siteOrigin = PLACEHOLDER_ORIGIN
  let outDir = null
  let isBuild = false
  let builtHtml = null

  const robotsTxt = () =>
    [
      'User-agent: *',
      'Allow: /',
      '',
      '# Signed-in areas. Client-side routes behind an auth check, so they render',
      '# nothing useful to a crawler — disallowed so they never surface as thin',
      '# or empty results.',
      ...PRIVATE_ROUTES.map((p) => `Disallow: ${p}`),
      '',
      `Sitemap: ${siteOrigin}/sitemap.xml`,
      '',
    ].join('\n')

  const sitemapXml = () =>
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<!-- Generated at build time by seoPlugin.js from PUBLIC_ROUTES in',
      '     src/config/pageTitles.js. Do not edit by hand. -->',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...PUBLIC_ROUTES.map(
        (r) =>
          `  <url>\n    <loc>${siteOrigin}${r.path}</loc>\n` +
          `    <priority>${r.priority}</priority>\n  </url>`,
      ),
      '</urlset>',
      '',
    ].join('\n')

  return {
    name: 'fastship-seo',
    // After Vite's own HTML handling, so the captured markup already has its
    // <script>/<link> tags.
    enforce: 'post',

    configResolved(config) {
      // Vite's `config.env` already merges VITE_-prefixed vars from .env files
      // AND from the shell, so there is no need to touch process.env here.
      const configured = config.env?.VITE_SITE_URL
      if (configured) siteOrigin = trimSlash(configured)
      isBuild = config.command === 'build'
      outDir = path.resolve(config.root, config.build.outDir)
    },

    // Serve the generated robots.txt / sitemap.xml in dev too, so what you see
    // on localhost is what ships. They are no longer static files in public/.
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '').split('?')[0]
        if (url === '/robots.txt') {
          res.setHeader('content-type', 'text/plain')
          return res.end(robotsTxt())
        }
        if (url === '/sitemap.xml') {
          res.setHeader('content-type', 'application/xml')
          return res.end(sitemapXml())
        }
        return next()
      })
    },

    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const withOrigin = html
          .split(PLACEHOLDER_ORIGIN)
          .join(siteOrigin)
          // Absolute og:image — relative paths are ignored by most scrapers.
          .replace(
            /(<meta[^>]*property="og:image"[^>]*content=")\/([^"]*)(")/i,
            `$1${siteOrigin}/$2$3`,
          )
        builtHtml = withOrigin
        // index.html itself is the "/" route.
        const root = PUBLIC_ROUTES.find((r) => r.path === '/')
        return root ? routeHtml(withOrigin, siteOrigin, root) : withOrigin
      },
    },

    closeBundle() {
      if (!isBuild || !builtHtml || !outDir) return

      fs.writeFileSync(path.join(outDir, 'robots.txt'), robotsTxt())
      fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sitemapXml())

      for (const route of PUBLIC_ROUTES) {
        if (route.path === '/') continue
        const dir = path.join(outDir, route.path.replace(/^\//, ''))
        fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(path.join(dir, 'index.html'), routeHtml(builtHtml, siteOrigin, route))
      }
    },
  }
}

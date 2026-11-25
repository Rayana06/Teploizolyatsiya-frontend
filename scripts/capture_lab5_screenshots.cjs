const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright')

const root = path.resolve(__dirname, '..')
const outputDir = path.join(root, 'tmp', 'lab5-screenshots')
fs.mkdirSync(outputDir, { recursive: true })

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

function readLines(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8').split('\n')
}

function pick(relativePath, ranges) {
  const lines = readLines(relativePath)
  const result = []
  for (let rangeIndex = 0; rangeIndex < ranges.length; rangeIndex += 1) {
    const [start, end] = ranges[rangeIndex]
    if (rangeIndex > 0) result.push({ number: '…', text: '…' })
    for (let number = start; number <= end; number += 1) {
      result.push({ number, text: lines[number - 1] ?? '' })
    }
  }
  return result
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function highlightCode(value) {
  let html = escapeHtml(value)
  html = html.replace(/(&quot;[^&]*?&quot;|'[^']*?'|`[^`]*?`)/g, '<span class="string">$1</span>')
  html = html.replace(/\b(import|from|export|interface|const|return|function|if|else|new|true|false|null|undefined|type|as)\b/g, '<span class="keyword">$1</span>')
  html = html.replace(/\b(useState|useEffect|useMemo|useRef|useParams|useNavigate)\b/g, '<span class="hook">$1</span>')
  return html
}

function codeDocument(title, panels) {
  const panelHtml = panels.map((panel) => {
    const highlightSet = new Set(panel.highlight ?? [])
    const linesHtml = panel.lines.map((line) => {
      const focused = highlightSet.has(line.number) ? ' focused' : ''
      return `<div class="code-line${focused}"><span class="line-number">${line.number}</span><span class="line-code">${highlightCode(line.text)}</span></div>`
    }).join('')
    return `<section class="panel">
      <div class="panel-bar"><span class="dots"><i></i><i></i><i></i></span><strong>${escapeHtml(panel.label)}</strong></div>
      <div class="code">${linesHtml}</div>
    </section>`
  }).join('')

  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><style>
    *{box-sizing:border-box} html,body{margin:0;width:100%;min-height:100%;background:#11151b;color:#d9e1ea;font-family:Menlo,Monaco,'Courier New',monospace}
    body{padding:28px 34px 34px} h1{margin:0 0 22px;font:700 27px/1.2 Arial,sans-serif;color:#fff}
    .workspace{display:grid;grid-template-columns:${panels.length > 1 ? 'repeat(2,minmax(0,1fr))' : '1fr'};gap:22px;align-items:start}
    .panel{overflow:hidden;border:1px solid #354052;border-radius:10px;background:#1b2029;box-shadow:0 12px 30px rgba(0,0,0,.28)}
    .panel-bar{display:flex;align-items:center;gap:18px;height:45px;padding:0 16px;border-bottom:1px solid #354052;background:#252c37;color:#dbe4ef;font:600 14px/1 Arial,sans-serif}
    .dots{display:flex;gap:7px}.dots i{display:block;width:11px;height:11px;border-radius:50%;background:#ff5f57}.dots i:nth-child(2){background:#febc2e}.dots i:nth-child(3){background:#28c840}
    .code{padding:12px 0 16px;font-size:${panels.length > 1 ? '14px' : '16px'};line-height:1.48}
    .code-line{display:grid;grid-template-columns:58px minmax(0,1fr);min-height:23px;padding:0 16px 0 0;white-space:pre}
    .code-line.focused{background:rgba(226,0,14,.14);box-shadow:inset 3px 0 #ef0012}
    .line-number{padding-right:14px;color:#657184;text-align:right;user-select:none}.line-code{overflow:visible;color:#d9e1ea}
    .keyword{color:#ff7ab2}.string{color:#a8d790}.hook{color:#68d4ff;font-weight:700}
  </style></head><body><h1>${escapeHtml(title)}</h1><main class="workspace">${panelHtml}</main></body></html>`
}

async function captureApplication(page, route, filename) {
  await page.goto(`http://127.0.0.1:5175${route}`, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(350)
  await page.screenshot({ path: path.join(outputDir, filename), fullPage: false })
}

async function captureCode(page, title, panels, filename) {
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.setContent(codeDocument(title, panels), { waitUntil: 'load' })
  await page.screenshot({ path: path.join(outputDir, filename), fullPage: false })
}

async function main() {
  const browser = await chromium.launch({ headless: true, executablePath: chromePath })
  const context = await browser.newContext({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1.5 })
  const page = await context.newPage()

  await captureApplication(page, '/', '01-feed.png')
  await captureApplication(page, '/catalog', '02-catalog.png')
  await captureApplication(page, '/materials/1', '03-details.png')

  await captureCode(page, 'Изображение и видео по умолчанию', [
    {
      label: 'src/components/MaterialMedia.tsx',
      lines: pick('src/components/MaterialMedia.tsx', [[1, 7], [24, 38]]),
      highlight: [3, 4, 34, 35, 36, 37],
    },
  ], '04-default-media-logic.png')

  await captureCode(page, 'Пустое поле в mock и вывод fallback', [
    {
      label: 'src/data/materials.ts',
      lines: pick('src/data/materials.ts', [[50, 63], [80, 93]]),
      highlight: [60, 90, 92],
    },
    {
      label: 'src/components/MaterialMedia.tsx',
      lines: pick('src/components/MaterialMedia.tsx', [[111, 116], [180, 182]]),
      highlight: [114, 115, 181],
    },
  ], '05-default-media-render.png')

  await captureCode(page, 'Компонент фильтра и его props', [
    {
      label: 'src/components/CatalogFilters.tsx',
      lines: pick('src/components/CatalogFilters.tsx', [[4, 20], [22, 55]]),
      highlight: [4, 5, 6, 7, 8, 9, 18, 26, 28, 33, 40, 42, 43, 47],
    },
  ], '06-filter-component.png')

  await captureCode(page, 'Фильтрация mock коллекции и передача props', [
    {
      label: 'src/pages/CatalogPage.tsx',
      lines: pick('src/pages/CatalogPage.tsx', [[7, 21], [23, 45]]),
      highlight: [11, 12, 14, 15, 16, 27, 28, 29, 30, 31, 32, 40, 42],
    },
  ], '07-filter-page.png')

  await captureCode(page, 'Хуки useState useMemo и useEffect', [
    {
      label: 'src/pages/CatalogPage.tsx',
      lines: pick('src/pages/CatalogPage.tsx', [[1, 21]]),
      highlight: [1, 11, 12, 14, 18],
    },
    {
      label: 'src/pages/FeedPage.tsx',
      lines: pick('src/pages/FeedPage.tsx', [[1, 12]]),
      highlight: [1, 6, 11],
    },
  ], '08-hooks-state-effect-memo.png')

  await captureCode(page, 'Хуки useRef useState useEffect useParams и useNavigate', [
    {
      label: 'src/components/MaterialMedia.tsx',
      lines: pick('src/components/MaterialMedia.tsx', [[1, 4], [24, 40], [55, 73]]),
      highlight: [1, 25, 26, 27, 28, 29, 30, 31, 32, 33, 40, 61, 73],
    },
    {
      label: 'src/pages/MaterialDetailsPage.tsx',
      lines: pick('src/pages/MaterialDetailsPage.tsx', [[1, 11]]),
      highlight: [2, 9, 10],
    },
  ], '09-hooks-ref-router.png')

  await browser.close()
  console.log(outputDir)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

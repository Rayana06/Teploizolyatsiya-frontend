const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { chromium } = require('playwright')

const root = path.resolve(__dirname, '..')
const workspace = path.resolve(root, '..')
const backend = path.join(workspace, 'insulation-backend-lab4')
const outputDir = path.join(root, 'report-assets')
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const frontendUrl = 'http://localhost:5176'
fs.mkdirSync(outputDir, { recursive: true })

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function readLines(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8').split('\n')
}

function pick(relativePath, ranges) {
  const lines = readLines(relativePath)
  const result = []
  ranges.forEach(([start, end], rangeIndex) => {
    if (rangeIndex > 0) result.push({ number: '…', text: '…' })
    for (let number = start; number <= end; number += 1) {
      result.push({ number, text: lines[number - 1] ?? '' })
    }
  })
  return result
}

function highlightCode(value) {
  let html = escapeHtml(value)
  html = html.replace(/(&quot;[^&]*?&quot;|'[^']*?'|`[^`]*?`)/g, '<span class="string">$1</span>')
  html = html.replace(/\b(import|from|export|interface|const|return|function|if|else|new|true|false|null|undefined|type|as|async|await|try|catch)\b/g, '<span class="keyword">$1</span>')
  html = html.replace(/\b(createAsyncThunk|createSlice|configureStore|axiosInstance|getInsulationMaterials|createInsulationMaterial|deleteInsulationMaterial|setInsulationMaterialLike)\b/g, '<span class="call">$1</span>')
  return html
}

function codeDocument(title, subtitle, panels) {
  const columns = panels.length === 3 ? 'repeat(3,minmax(0,1fr))' : panels.length === 2 ? 'repeat(2,minmax(0,1fr))' : '1fr'
  const panelHtml = panels.map((panel) => {
    const highlights = new Set(panel.highlight ?? [])
    const lines = panel.lines.map((line) => {
      const focused = highlights.has(line.number) ? ' focused' : ''
      return `<div class="code-line${focused}"><span class="line-number">${line.number}</span><span class="line-code">${highlightCode(line.text)}</span></div>`
    }).join('')
    return `<section class="panel"><div class="panel-bar"><span class="dots"><i></i><i></i><i></i></span><strong>${escapeHtml(panel.label)}</strong></div><div class="code">${lines}</div></section>`
  }).join('')
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;background:#101319;color:#dce4ee;font-family:Menlo,Monaco,'Courier New',monospace}body{padding:26px 30px 30px}
  h1{margin:0;color:#fff;font:700 29px/1.2 Arial,sans-serif}p{margin:7px 0 20px;color:#9aa8ba;font:400 18px/1.3 Arial,sans-serif}.workspace{display:grid;grid-template-columns:${columns};gap:18px;align-items:start}
  .panel{overflow:hidden;border:1px solid #354052;border-radius:9px;background:#1b2029;box-shadow:0 12px 30px rgba(0,0,0,.28)}.panel-bar{display:flex;align-items:center;gap:16px;height:43px;padding:0 14px;border-bottom:1px solid #354052;background:#252c37;color:#e4ebf4;font:600 14px/1 Arial,sans-serif}
  .dots{display:flex;gap:6px}.dots i{display:block;width:10px;height:10px;border-radius:50%;background:#ff5f57}.dots i:nth-child(2){background:#febc2e}.dots i:nth-child(3){background:#28c840}.code{padding:10px 0 14px;font-size:${panels.length === 3 ? '12px' : '14px'};line-height:1.48}.code-line{display:grid;grid-template-columns:48px minmax(0,1fr);min-height:21px;padding-right:12px;white-space:pre}.code-line.focused{background:rgba(226,0,14,.14);box-shadow:inset 3px 0 #ef0012}.line-number{padding-right:11px;color:#657184;text-align:right}.line-code{overflow:visible}.keyword{color:#ff7ab2}.string{color:#a8d790}.call{color:#68d4ff;font-weight:700}
  </style></head><body><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)}</p><main class="workspace">${panelHtml}</main></body></html>`
}

function shellDocument(title, subtitle, body) {
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;font-family:Arial,sans-serif;background:#f2f4f8;color:#1d2733}body{overflow:hidden}.top{height:72px;padding:20px 32px;background:#20242c;color:#fff;font-size:27px;font-weight:700}.sub{padding:15px 32px 12px;color:#536174;font-size:18px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;padding:0 30px 28px;height:calc(100% - 120px)}.card{overflow:hidden;border:1px solid #cfd6e1;border-radius:10px;background:#fff;box-shadow:0 8px 22px rgba(32,42,58,.09)}.card h2{margin:0;padding:13px 17px;background:#e9edf4;font-size:18px}.content{padding:16px 18px}.mono{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;font:15px/1.5 Menlo,Monaco,'Courier New',monospace;color:#263244}.dark{background:#151a22;color:#dce5ef}.dark h2{background:#252c37;color:#fff}.dark .mono{color:#dce5ef}.wide{grid-column:1/-1}.kv{display:grid;grid-template-columns:170px 1fr;border:1px solid #d9dee7;border-bottom:0}.kv b,.kv span{padding:9px 11px;border-bottom:1px solid #d9dee7}.kv b{background:#f5f7fa}.status{display:inline-block;border-radius:18px;padding:5px 11px;background:#dff5e8;color:#087f46;font-weight:700}.accent{color:#c8000d;font-weight:700}.appshot{display:block;width:100%;height:100%;object-fit:contain;background:#ddd}.json .creator{display:inline-block;background:#ffe2e4;color:#b0000b;font-weight:700}.file{display:flex;align-items:center;gap:10px;padding:9px 10px;border-bottom:1px solid #e3e7ed}.file:before{content:'▣';color:#c8000d}.small{font-size:14px;color:#657184}
  </style></head><body><div class="top">${escapeHtml(title)}</div><div class="sub">${escapeHtml(subtitle)}</div>${body}</body></html>`
}

function fileDataUri(filePath) {
  return `data:image/png;base64,${fs.readFileSync(filePath).toString('base64')}`
}

async function screenshotHtml(page, html, filename, viewport = { width: 1600, height: 1000 }) {
  await page.setViewportSize(viewport)
  await page.setContent(html, { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(outputDir, filename), fullPage: false })
}

async function screenshotApp(page, route, filename) {
  await page.setViewportSize({ width: 900, height: 900 })
  await page.goto(`${frontendUrl}${route}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(700)
  await page.screenshot({ path: path.join(outputDir, filename), fullPage: false })
}

async function openBrowser() {
  return chromium.launch({ headless: true, executablePath: chromePath })
}

async function captureMock() {
  const browser = await openBrowser()
  const context = await browser.newContext({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 1.5 })
  const page = await context.newPage()
  await screenshotApp(page, '/', '01-mock-feed.png')
  await page.getByText(/\bmock\b/).first().waitFor({ timeout: 10000 })
  await page.screenshot({ path: path.join(outputDir, '01-mock-feed.png') })
  await screenshotApp(page, '/catalog', '02-mock-catalog.png')
  await page.getByText(/mock · backend/).waitFor({ timeout: 10000 })
  await page.screenshot({ path: path.join(outputDir, '02-mock-catalog.png') })
  await browser.close()
}

async function captureBackend() {
  const browser = await openBrowser()
  const context = await browser.newContext({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 1.5 })
  const page = await context.newPage()

  await screenshotApp(page, '/', '03-backend-feed.png')
  await page.getByText(/\bweb-service\b/).first().waitFor({ timeout: 10000 })
  await page.screenshot({ path: path.join(outputDir, '03-backend-feed.png') })

  await page.goto(`${frontendUrl}/catalog`, { waitUntil: 'domcontentloaded' })
  await page.getByPlaceholder('Название').fill('Технолайт')
  await page.getByLabel('Тип утеплителя').selectOption('Минвата')
  await page.getByLabel('Максимальная толщина').fill('100')
  await Promise.all([
    page.waitForResponse((response) => response.url().includes('/api/insulation-materials?') && response.status() === 200),
    page.getByRole('button', { name: 'Подобрать' }).click(),
  ])
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(outputDir, '04-backend-catalog.png') })

  await screenshotApp(page, '/login', '05-login.png')
  await page.locator('input[type="email"]').fill('user1@teploshchit.local')
  await page.locator('input[type="password"]').fill('Teplo123!')
  await Promise.all([
    page.waitForURL('**/catalog'),
    page.getByRole('button', { name: 'Войти' }).click(),
  ])
  await page.getByRole('link', { name: 'Добавление' }).click()
  await page.waitForURL('**/add')
  const inputs = page.locator('input[type=file]')
  await inputs.nth(0).setInputFiles(path.join(backend, 'media/generated/technolight-optima-50.jpg'))
  await inputs.nth(1).setInputFiles(path.join(backend, 'media/generated/technolight-optima-50.mp4'))
  await page.locator('.image-preview').waitFor()
  await page.locator('.image-preview').scrollIntoViewIfNeeded()
  await page.waitForTimeout(250)
  await page.screenshot({ path: path.join(outputDir, '06-add-preview.png') })

  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.getByRole('link', { name: 'Вход' }).waitFor({ timeout: 10000 })
  const appAfterF5 = path.join(outputDir, '09-app-after-f5.png')
  await page.screenshot({ path: appAfterF5 })
  const cookies = await context.cookies(frontendUrl)
  const session = cookies.find((cookie) => cookie.name === 'sessionId')
  if (!session) throw new Error('sessionId cookie not found')
  const maskedCookie = `${session.value.slice(0, 10)}…${session.value.slice(-8)}`
  const appData = fileDataUri(appAfterF5)
  const cookieBody = `<main class="grid"><section class="card"><img class="appshot" src="${appData}" alt="Guest UI after F5"></section><section class="card"><h2>Application → Cookies → http://localhost:5176</h2><div class="content"><div class="kv"><b>Name</b><span>sessionId</span><b>Value</b><span class="mono">${escapeHtml(maskedCookie)}</span><b>Domain</b><span>${escapeHtml(session.domain)}</span><b>Path</b><span>${escapeHtml(session.path)}</span><b>HttpOnly</b><span class="status">true</span><b>SameSite</b><span>${escapeHtml(session.sameSite || 'Lax')}</span></div><p><b>Redux state after F5</b></p><pre class="mono">auth.user = null\nauth.status = "idle"\nменю: «Вход»\n«Добавление» недоступно</pre></div></section></main>`
  await screenshotHtml(page, shellDocument('Авторизация Redux и cookie после F5', 'Интерфейс сброшен до гостя, HttpOnly-cookie сессии сохранена', cookieBody), '09-redux-cookie-after-f5.png')

  const ownerResponse = await context.request.get('http://127.0.0.1:3001/api/insulation-materials', {
    headers: { Cookie: `sessionId=${session.value}`, Accept: 'application/json' },
  })
  const ownerJson = await ownerResponse.json()
  const responseText = JSON.stringify(ownerJson, null, 2).replace(/"isCreator": 1/g, '<span class="creator">"isCreator": 1</span>')
  const postmanBody = `<main class="grid"><section class="card"><h2>Request</h2><div class="content"><p><span class="status">GET</span> <b>http://127.0.0.1:3001/api/insulation-materials</b></p><p class="small">Headers</p><pre class="mono">Accept: application/json\nCookie: sessionId=${escapeHtml(maskedCookie)}</pre><p class="small">Collection: Лабораторная 6 — Теплощит</p><p><span class="status">Test passed</span> Есть карточка с isCreator=1</p></div></section><section class="card dark"><h2>Response · ${ownerResponse.status()} OK</h2><div class="content json"><pre class="mono">${responseText}</pre></div></section></main>`
  await screenshotHtml(page, shellDocument('Postman · плитка материалов пользователя', 'Сессия из Application передана в Cookie; isCreator=1 разрешает удаление', postmanBody), '10-postman-owner-materials.png')

  await screenshotHtml(page, codeDocument('Состояния Redux Toolkit', 'auth, filters и materials объединены в едином store', [
    { label: 'src/store/authSlice.ts', lines: pick('src/store/authSlice.ts', [[9, 19], [25, 38]]), highlight: [9, 10, 11, 12, 15, 25, 34] },
    { label: 'src/store/filtersSlice.ts', lines: pick('src/store/filtersSlice.ts', [[3, 19], [21, 28]]), highlight: [3, 4, 5, 6, 9, 10, 11, 14, 15, 27] },
    { label: 'src/store/materialsSlice.ts', lines: pick('src/store/materialsSlice.ts', [[137, 150], [169, 180]]), highlight: [137, 138, 139, 140, 141, 142, 145, 169, 176] },
  ]), '11-redux-states-code.png')

  await screenshotHtml(page, codeDocument('Axios и кодогенерация Orval', 'Общий Axios mutator и типизированный клиент из OpenAPI', [
    { label: 'src/api/axiosInstance.ts', lines: pick('src/api/axiosInstance.ts', [[1, 13]]), highlight: [1, 3, 4, 5, 10, 11] },
    { label: 'src/api/generated/insulationMaterialsApi.ts', lines: pick('src/api/generated/insulationMaterialsApi.ts', [[1, 18], [22, 47]]), highlight: [2, 3, 18, 22, 25, 26, 32, 42, 43, 44] },
  ]), '12-generated-axios.png')

  await screenshotHtml(page, codeDocument('Сгенерированный API в Redux thunk', 'loadCatalog получает фильтры из Redux и вызывает getInsulationMaterials', [
    { label: 'src/store/materialsSlice.ts · imports', lines: pick('src/store/materialsSlice.ts', [[1, 13]]), highlight: [1, 3, 4, 5, 6, 7, 8, 9] },
    { label: 'src/store/materialsSlice.ts · loadCatalog', lines: pick('src/store/materialsSlice.ts', [[56, 79]]), highlight: [56, 60, 61, 63, 64, 65, 66, 68, 70, 77] },
  ]), '13-generated-api-in-thunk.png')

  await screenshotHtml(page, codeDocument('Тематические Redux thunk', 'Названия отражают операции с теплоизоляционными материалами', [
    { label: 'src/store/materialsSlice.ts', lines: pick('src/store/materialsSlice.ts', [[81, 107], [109, 135]]), highlight: [81, 82, 93, 94, 109, 110, 112, 117, 118, 120, 125, 129, 133] },
  ]), '14-thematic-thunks.png')

  await page.setViewportSize({ width: 900, height: 900 })
  await page.goto(`${frontendUrl}/catalog`, { waitUntil: 'domcontentloaded' })
  await page.getByPlaceholder('Название').fill('Технолайт')
  await page.getByLabel('Тип утеплителя').selectOption('Минвата')
  await page.getByLabel('Максимальная толщина').fill('100')
  const responsePromise = page.waitForResponse((response) => response.url().includes('/api/insulation-materials?'))
  await page.getByRole('button', { name: 'Подобрать' }).click()
  const apiResponse = await responsePromise
  const apiUrl = apiResponse.url()
  const apiStatus = apiResponse.status()
  const appNetworkPath = path.join(outputDir, '15-app-network.png')
  await page.screenshot({ path: appNetworkPath })
  const apiBody = `<main class="grid"><section class="card"><img class="appshot" src="${fileDataUri(appNetworkPath)}"></section><section class="card"><h2>Network → Fetch/XHR → Headers</h2><div class="content"><p><span class="status">${apiStatus} OK</span></p><div class="kv"><b>Request URL</b><span class="mono">${escapeHtml(apiUrl)}</span><b>Request Method</b><span>GET</span><b>Remote target</b><span>127.0.0.1:3001</span><b>Initiator</b><span>Axios</span></div><p class="small">vite.config.ts</p><pre class="mono">'/api': {\n  target: 'http://127.0.0.1:3001',\n  changeOrigin: true,\n}</pre></div></section></main>`
  await screenshotHtml(page, shellDocument('AJAX через proxy Vite', 'Браузер видит origin frontend; Vite перенаправляет /api на backend', apiBody), '15-network-api-proxy.png')

  await page.setViewportSize({ width: 900, height: 900 })
  const imageResponsePromise = page.waitForResponse((response) => response.url().includes('/silo/insulation-materials/') && /\.(jpg|png|webp)(\?|$)/.test(response.url()))
  await page.goto(`${frontendUrl}/catalog`, { waitUntil: 'domcontentloaded' })
  const imageResponse = await imageResponsePromise
  const imageUrl = imageResponse.url()
  const appMinioPath = path.join(outputDir, '16-app-minio.png')
  await page.screenshot({ path: appMinioPath })
  const minioBody = `<main class="grid"><section class="card"><img class="appshot" src="${fileDataUri(appMinioPath)}"></section><section class="card"><h2>Network → Img · Silo MinIO</h2><div class="content"><div class="kv"><b>Request URL</b><span class="mono">${escapeHtml(imageUrl)}</span><b>Status</b><span class="status">${imageResponse.status()} OK</span><b>Bucket</b><span>insulation-materials</span><b>Object</b><span class="mono">${escapeHtml(path.basename(new URL(imageUrl).pathname))}</span></div><p><b>Объекты bucket</b></p><div class="file">technolight-optima-50.jpg</div><div class="file">technolight-optima-50.mp4</div><div class="file">logicpir-banya-50.jpg</div><div class="file">logicpir-banya-50.mp4</div><p class="small">vite.config.ts</p><pre class="mono">'/silo': {\n  target: 'http://127.0.0.1:9020',\n  rewrite: path =&gt; path.replace(/^\\/silo/, ''),\n}</pre></div></section></main>`
  await screenshotHtml(page, shellDocument('Изображения из Silo MinIO', 'Имя объекта хранится в PostgreSQL; запрос /silo проксируется на порт 9020', minioBody), '16-network-minio-proxy.png')

  await context.request.post(`${frontendUrl}/api/users/logout`).catch(() => {})
  await browser.close()
}

async function captureDatabaseChange() {
  const sql = `UPDATE insulation_materials\nSET name = 'Эковата — изменено в БД (ЛР6)',\n    thickness_mm = 175\nWHERE insulation_material_id = 9001;\n\nSELECT insulation_material_id, name, insulation_type, thickness_mm, status\nFROM insulation_materials\nWHERE insulation_material_id = 9001;`
  const output = execFileSync('docker', ['compose', 'exec', '-T', 'insulation-postgres', 'psql', '-U', 'teploshchit', '-d', 'teploshchit', '-c', sql], { cwd: backend, encoding: 'utf8' })
  const browser = await openBrowser()
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
  const body = `<main class="grid"><section class="card dark"><h2>SQL команда</h2><div class="content"><pre class="mono">${escapeHtml(sql)}</pre></div></section><section class="card dark"><h2>PostgreSQL · результат</h2><div class="content"><pre class="mono">${escapeHtml(output)}</pre></div></section></main>`
  await screenshotHtml(page, shellDocument('Изменение теплоизоляционного материала в PostgreSQL', 'UPDATE и SELECT выполнены в учебной базе teploshchit', body), '07-database-update.png')
  await browser.close()
}

async function captureAfterChange() {
  const browser = await openBrowser()
  const context = await browser.newContext({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 1.5 })
  const page = await context.newPage()
  await screenshotApp(page, '/catalog', '08-frontend-after-update.png')
  await page.getByText('Эковата — изменено в БД (ЛР6)').waitFor({ timeout: 10000 })
  await page.screenshot({ path: path.join(outputDir, '08-frontend-after-update.png') })
  await browser.close()
}

async function main() {
  const mode = process.argv[2]
  if (mode === 'mock') return captureMock()
  if (mode === 'backend') return captureBackend()
  if (mode === 'database') return captureDatabaseChange()
  if (mode === 'after') return captureAfterChange()
  throw new Error('Usage: capture_lab6_report.cjs mock|backend|database|after')
}

main().then(() => console.log(outputDir)).catch((error) => {
  console.error(error)
  process.exit(1)
})

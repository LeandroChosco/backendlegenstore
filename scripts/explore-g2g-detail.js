const { chromium } = require('playwright')

const TARGET_URL =
  'https://www.g2g.com/categories/wow-classic-era-vanilla-gold?region_id=dfced32f-2f0a-4df5-a218-1e068cfadffa&sort=recommended_v2'

const TARGETS = [
  'Nightslayer [US - Anniversary] - Horde',
  'Nightslayer [US - Anniversary] - Alliance',
  'Dreamscythe [US - Anniversary] - Alliance',
  'Dreamscythe [US - Anniversary] - Horde',
]

;(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 })
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  })

  // --- Solo exploramos el PRIMER card para entender la estructura ---
  const target = TARGETS[0]
  console.log(`\nExplorando card: "${target}"`)

  const listPage = await context.newPage()
  await listPage.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 })
  await listPage.waitForTimeout(3000)

  // Encontrar y clickear el card
  const cardLink = await listPage.evaluateHandle((targetText) => {
    const spans = [...document.querySelectorAll('span')]
    const span = spans.find(s => s.innerText?.trim() === targetText)
    if (!span) return null
    return span.closest('a') ?? span.closest('[href]')
  }, target)

  if (!cardLink) {
    console.log('No se encontró el link del card, buscando alternativa...')
    // Intentar con el texto parcial
    const allLinks = await listPage.$$('a')
    for (const link of allLinks) {
      const text = await link.innerText().catch(() => '')
      if (text.includes(target.split('[')[0].trim())) {
        console.log('Link encontrado via texto parcial:', text.slice(0, 80))
        break
      }
    }
  }

  // Clickear y abrir en nueva pestaña
  const [detailPage] = await Promise.all([
    context.waitForEvent('page'),
    listPage.evaluate((targetText) => {
      const spans = [...document.querySelectorAll('span')]
      const span = spans.find(s => s.innerText?.trim() === targetText)
      const link = span?.closest('a') ?? span?.closest('[href]')
      if (link) link.click()
    }, target),
  ]).catch(async () => {
    // Si no abre nueva pestaña, navega en la misma
    console.log('Intentando navegación directa...')
    await listPage.evaluate((targetText) => {
      const spans = [...document.querySelectorAll('span')]
      const span = spans.find(s => s.innerText?.trim() === targetText)
      const link = span?.closest('a')
      if (link) link.click()
    }, target)
    return [listPage]
  })

  const page = detailPage ?? listPage
  console.log('Esperando carga de la página de detalle (8 seg)...')
  await page.waitForTimeout(8000)
  console.log('URL actual:', page.url())

  await page.screenshot({ path: 'scripts/g2g-detail-screenshot.png' })
  console.log('Screenshot guardado: scripts/g2g-detail-screenshot.png')

  // --- Explorar estructura de la sección "Otros vendedores" ---
  console.log('\n=== BUSCANDO SECCIÓN "OTROS VENDEDORES" ===')
  const sectionInfo = await page.evaluate(() => {
    const headings = [...document.querySelectorAll('*')]
    const section = headings.find(el =>
      el.innerText?.trim().startsWith('Otros vendedores') && el.children.length <= 3
    )
    if (!section) return { found: false, allH2: [...document.querySelectorAll('h1,h2,h3,h4,div[class*="title"],div[class*="header"]')].map(e => ({ tag: e.tagName, class: e.className, text: e.innerText?.slice(0, 60) })).slice(0, 15) }

    const parent = section.parentElement
    return {
      found: true,
      sectionTag: section.tagName,
      sectionClass: section.className,
      sectionText: section.innerText?.slice(0, 80),
      parentTag: parent?.tagName,
      parentClass: parent?.className,
      parentHTML: parent?.outerHTML?.slice(0, 300),
    }
  })
  console.log(JSON.stringify(sectionInfo, null, 2))

  // --- Buscar la tabla/lista de vendedores ---
  console.log('\n=== ESTRUCTURA DE LAS ROWS DE VENDEDORES ===')
  const vendorRows = await page.evaluate(() => {
    // Buscar por texto "Otros vendedores"
    const allEls = [...document.querySelectorAll('*')]
    const header = allEls.find(el =>
      el.innerText?.trim().startsWith('Otros vendedores') && el.children.length <= 3
    )

    if (!header) {
      // Fallback: buscar contenedor con múltiples vendedores
      const containers = document.querySelectorAll('[class*="seller"], [class*="vendor"], [class*="offer"], [class*="list"]')
      return {
        found: false,
        fallbackContainers: [...containers].slice(0, 5).map(el => ({
          tag: el.tagName,
          class: el.className,
          text: el.innerText?.slice(0, 100),
        }))
      }
    }

    // Subir hasta encontrar el contenedor con las rows
    let container = header.parentElement
    for (let i = 0; i < 5; i++) {
      if (container?.children.length > 2) break
      container = container?.parentElement
    }

    const rows = [...(container?.querySelectorAll('[class*="row"], li, [class*="item"], [class*="card"]') ?? [])]
      .filter(el => el.innerText?.includes('USD') || el.innerText?.includes('vendido'))
      .slice(0, 8)

    return {
      found: true,
      containerTag: container?.tagName,
      containerClass: container?.className,
      rowCount: rows.length,
      rows: rows.slice(0, 3).map(row => ({
        tag: row.tagName,
        class: row.className,
        text: row.innerText?.replace(/\n/g, ' | ').slice(0, 200),
        html: row.outerHTML?.slice(0, 500),
      }))
    }
  })
  console.log(JSON.stringify(vendorRows, null, 2))

  // --- Intentar extraer los 5 primeros precios directamente ---
  console.log('\n=== EXTRACCIÓN DIRECTA DE PRECIOS ===')
  const prices = await page.evaluate(() => {
    const allEls = [...document.querySelectorAll('*')]

    // Buscar todos los elementos que contengan un precio USD
    const priceEls = allEls.filter(el => {
      const text = el.innerText?.trim()
      return text && /^\d+\.\d+$/.test(text) && el.children.length === 0
    })

    return priceEls.slice(0, 15).map(el => ({
      price: el.innerText?.trim(),
      class: el.className,
      parentClass: el.parentElement?.className,
      grandparentText: el.parentElement?.parentElement?.innerText?.slice(0, 100).replace(/\n/g, ' | '),
    }))
  })
  console.log(JSON.stringify(prices, null, 2))

  // --- Dump del texto completo de la página para análisis ---
  console.log('\n=== TEXTO COMPLETO DE PÁGINA (primeros 3000 chars) ===')
  const fullText = await page.evaluate(() => document.body.innerText?.slice(0, 3000))
  console.log(fullText)

  await browser.close()
  console.log('\nExploración completada.')
})()

async function logPageDebug(page, label) {
  try {
    const title = await page.title()
    const url = page.url()
    const html = await page.content()
    const snippet = html.slice(0, 3000)
    console.log(`  [DEBUG][${label}] title="${title}" url="${url}"`)
    console.log(`  [DEBUG][${label}] HTML snippet:\n${snippet}`)
  } catch (e) {
    console.log(`  [DEBUG][${label}] Error al obtener debug info: ${e.message}`)
  }
}

module.exports = { logPageDebug }

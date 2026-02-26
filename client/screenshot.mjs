import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await page.waitForTimeout(2000)

await page.screenshot({ path: 'screenshots/01-hero.png' })

await page.evaluate(() => window.scrollBy(0, 900))
await page.waitForTimeout(500)
await page.screenshot({ path: 'screenshots/02-stats-roles.png' })

await page.evaluate(() => window.scrollBy(0, 900))
await page.waitForTimeout(500)
await page.screenshot({ path: 'screenshots/03-features.png' })

await page.evaluate(() => window.scrollBy(0, 900))
await page.waitForTimeout(500)
await page.screenshot({ path: 'screenshots/04-howitworks-courses.png' })

await page.evaluate(() => window.scrollBy(0, 900))
await page.waitForTimeout(500)
await page.screenshot({ path: 'screenshots/05-courses-cta.png' })

await page.evaluate(() => window.scrollBy(0, 900))
await page.waitForTimeout(500)
await page.screenshot({ path: 'screenshots/06-footer.png' })

await page.screenshot({ path: 'screenshots/full-page.png', fullPage: true })

await browser.close()
console.log('Screenshots saved!')

import fs from 'fs'
import path from 'path'
import { chromium } from 'playwright'
import { composeHtml, CreativeDocument } from './composer.js'

async function runTest() {
  console.log('[Test] Running deterministic creative render test...')

  const sampleDoc: CreativeDocument = {
    width: 1080,
    height: 1080,
    backgroundColor: '#101828',
    brand: {
      name: 'AutoCanvas',
      primaryColor: '#6257E8',
      secondaryColor: '#24A0A8',
    },
    content: {
      headline: 'Autonomous Brand Operations for the Modern Web',
      supportingText: 'One brand. Every channel. Always in rhythm.',
      callToAction: 'Explore AutoCanvas',
    },
    templateId: 'minimal_corporate_v1',
  }

  const html = composeHtml(sampleDoc)
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({
    viewport: { width: sampleDoc.width, height: sampleDoc.height },
  })

  await page.setContent(html, { waitUntil: 'networkidle' })

  const outputDir = path.resolve('test-output')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const outputPath = path.join(outputDir, 'sample-creative.png')
  const buffer = await page.screenshot({ type: 'png' })
  fs.writeFileSync(outputPath, buffer)

  await page.close()
  await browser.close()

  console.log(`[Test Success] Rendered image saved to: ${outputPath} (${buffer.length} bytes)`)
}

runTest().catch((err) => {
  console.error('[Test Failed]', err)
  process.exit(1)
})


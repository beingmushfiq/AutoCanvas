import express, { Request, Response } from 'express'
import { chromium, Browser } from 'playwright'
import { CreativeDocumentSchema, composeHtml } from './composer.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json({ limit: '10mb' }))

let browserInstance: Browser | null = null

async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    browserInstance = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  }
  return browserInstance
}

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'AutoCanvas Creative Renderer',
    version: '1.0.0',
    port: PORT,
    timestamp: new Date().toISOString(),
  })
})

// Deterministic Render Endpoint
app.post('/render', async (req: Request, res: Response): Promise<void> => {
  const parseResult = CreativeDocumentSchema.safeParse(req.body)
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: 'Invalid creative document schema',
      details: parseResult.error.format(),
    })
    return
  }

  const doc = parseResult.data

  try {
    const browser = await getBrowser()
    const page = await browser.newPage({
      viewport: {
        width: doc.width,
        height: doc.height,
      },
      deviceScaleFactor: 2, // Crisp retina export
    })

    const html = composeHtml(doc)
    await page.setContent(html, { waitUntil: 'networkidle' })

    const buffer = await page.screenshot({
      type: 'png',
      clip: {
        x: 0,
        y: 0,
        width: doc.width,
        height: doc.height,
      },
    })

    await page.close()

    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Content-Length', buffer.length)
    res.send(buffer)
  } catch (error) {
    console.error('Render error:', error)
    res.status(500).json({
      success: false,
      error: 'Rendering execution failed',
      message: (error as Error).message,
    })
  }
})

app.listen(PORT, () => {
  console.log(`[AutoCanvas Renderer] Listening on port ${PORT}`)
})


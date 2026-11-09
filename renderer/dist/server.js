"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const playwright_1 = require("playwright");
const composer_js_1 = require("./composer.js");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use(express_1.default.json({ limit: '10mb' }));
let browserInstance = null;
async function getBrowser() {
    if (!browserInstance) {
        browserInstance = await playwright_1.chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
    }
    return browserInstance;
}
// Health check endpoint
app.get('/health', async (_req, res) => {
    res.json({
        status: 'ok',
        service: 'AutoCanvas Creative Renderer',
        version: '1.0.0',
        port: PORT,
        timestamp: new Date().toISOString(),
    });
});
// Deterministic Render Endpoint
app.post('/render', async (req, res) => {
    const parseResult = composer_js_1.CreativeDocumentSchema.safeParse(req.body);
    if (!parseResult.success) {
        res.status(400).json({
            success: false,
            error: 'Invalid creative document schema',
            details: parseResult.error.format(),
        });
        return;
    }
    const doc = parseResult.data;
    try {
        const browser = await getBrowser();
        const page = await browser.newPage({
            viewport: {
                width: doc.width,
                height: doc.height,
            },
            deviceScaleFactor: 2, // Crisp retina export
        });
        const html = (0, composer_js_1.composeHtml)(doc);
        await page.setContent(html, { waitUntil: 'networkidle' });
        const buffer = await page.screenshot({
            type: 'png',
            clip: {
                x: 0,
                y: 0,
                width: doc.width,
                height: doc.height,
            },
        });
        await page.close();
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
    }
    catch (error) {
        console.error('Render error:', error);
        res.status(500).json({
            success: false,
            error: 'Rendering execution failed',
            message: error.message,
        });
    }
});
app.listen(PORT, () => {
    console.log(`[AutoCanvas Renderer] Listening on port ${PORT}`);
});

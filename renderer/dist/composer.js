"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreativeDocumentSchema = void 0;
exports.composeHtml = composeHtml;
const zod_1 = require("zod");
exports.CreativeDocumentSchema = zod_1.z.object({
    width: zod_1.z.number().default(1080),
    height: zod_1.z.number().default(1080),
    backgroundColor: zod_1.z.string().default('#101828'),
    brand: zod_1.z.object({
        name: zod_1.z.string(),
        logoUrl: zod_1.z.string().optional(),
        primaryColor: zod_1.z.string().default('#6257E8'),
        secondaryColor: zod_1.z.string().default('#24A0A8'),
    }),
    content: zod_1.z.object({
        headline: zod_1.z.string(),
        supportingText: zod_1.z.string().optional(),
        callToAction: zod_1.z.string().optional(),
    }),
    templateId: zod_1.z.string().default('minimal_corporate_v1'),
});
function composeHtml(doc) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: ${doc.width}px;
      height: ${doc.height}px;
      background: ${doc.backgroundColor};
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 80px;
      overflow: hidden;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .brand-mark {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: ${doc.brand.primaryColor};
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 24px;
    }
    .brand-name {
      font-size: 24px;
      font-weight: 600;
      letter-spacing: -0.5px;
    }
    .main-body {
      max-width: 900px;
    }
    .headline {
      font-size: 56px;
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -1.5px;
      margin-bottom: 24px;
    }
    .supporting {
      font-size: 24px;
      color: #98A2B3;
      line-height: 1.5;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(255,255,255,0.1);
      padding-top: 32px;
    }
    .cta-pill {
      background: ${doc.brand.primaryColor};
      padding: 16px 32px;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 20px;
      display: inline-block;
    }
    .platform-watermark {
      font-size: 14px;
      color: #667085;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand-mark">${doc.brand.name.charAt(0).toUpperCase()}</div>
    <div class="brand-name">${doc.brand.name}</div>
  </div>

  <div class="main-body">
    <h1 class="headline">${doc.content.headline}</h1>
    ${doc.content.supportingText ? `<p class="supporting">${doc.content.supportingText}</p>` : ''}
  </div>

  <div class="footer">
    ${doc.content.callToAction ? `<div class="cta-pill">${doc.content.callToAction}</div>` : '<div></div>'}
    <div class="platform-watermark">AutoCanvas Verified</div>
  </div>
</body>
</html>`;
}

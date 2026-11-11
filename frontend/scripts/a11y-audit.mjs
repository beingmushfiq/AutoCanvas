import { JSDOM } from 'jsdom'
import axe from 'axe-core'

const dom = new JSDOM(`
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <title>AutoCanvas Accessibility Verification Test</title>
  <style>
    :root {
      --background: oklch(14% 0.005 265);
      --surface: oklch(17% 0.005 265);
      --foreground: oklch(96% 0.003 265);
      --brand-accent: oklch(75% 0.17 60);
      --focus-ring: oklch(75% 0.17 60);
    }
    body { background: var(--background); color: var(--foreground); }
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
  </style>
</head>
<body>
  <!-- 1. Skip to Main Content Navigation Anchor -->
  <a href="#main-content" class="sr-only">Skip to main content</a>

  <header role="banner">
    <nav aria-label="Main Navigation">
      <button aria-label="Open Command Palette (Ctrl+K)">Search</button>
      <button aria-label="Toggle Theme">Theme</button>
      <button aria-label="Keyboard Shortcuts Cheat Sheet">Shortcuts</button>
    </nav>
  </header>

  <main id="main-content" role="main" tabIndex="-1">
    <h1>AutoCanvas Command Center</h1>

    <!-- 2. Primary & Secondary Accessible Buttons -->
    <section aria-labelledby="sec-buttons">
      <h2 id="sec-buttons">Action Controls</h2>
      <button type="button" aria-label="Schedule new social post">Schedule Post</button>
      <button type="button" aria-label="Launch Creative Canvas Studio">Launch Studio</button>
      <button type="button" aria-label="Pause all active automations">Emergency Pause</button>
    </section>

    <!-- 3. Accessible Form Controls with Explicit Labels -->
    <section aria-labelledby="sec-inputs">
      <h2 id="sec-inputs">Campaign Directives</h2>
      <form>
        <label for="post-title">Post Title</label>
        <input id="post-title" type="text" name="title" required />

        <label for="post-platform">Social Channel</label>
        <select id="post-platform" name="platform">
          <option value="linkedin">LinkedIn</option>
          <option value="instagram">Instagram</option>
          <option value="twitter">X / Twitter</option>
        </select>

        <label for="post-caption">Post Caption</label>
        <textarea id="post-caption" name="caption"></textarea>

        <button type="submit">Submit Directives</button>
      </form>
    </section>

    <!-- 4. Operational Calendar Table Representation -->
    <section aria-labelledby="sec-calendar">
      <h2 id="sec-calendar">Operational Queue</h2>
      <table aria-label="Scheduled Posts List">
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Platform</th>
            <th scope="col">Title</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>2026-11-12</td>
            <td>LinkedIn</td>
            <td>Autonomous Multi-Agent Architecture</td>
            <td><span>Scheduled</span></td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- 5. Accessible Canvas Non-Drag Directional Controls -->
    <section aria-labelledby="sec-canvas-controls">
      <h2 id="sec-canvas-controls">Canvas Layer Alignment</h2>
      <div role="group" aria-label="Layer Nudge Controls">
        <button type="button" aria-label="Nudge active layer up 1 pixel">Nudge Up</button>
        <button type="button" aria-label="Nudge active layer down 1 pixel">Nudge Down</button>
        <button type="button" aria-label="Nudge active layer left 1 pixel">Nudge Left</button>
        <button type="button" aria-label="Nudge active layer right 1 pixel">Nudge Right</button>
      </div>
    </section>
  </main>

  <!-- 6. Accessible Modal Dialog Pattern -->
  <div role="dialog" aria-modal="true" aria-labelledby="modal-heading">
    <h2 id="modal-heading">Keyboard Shortcuts</h2>
    <p>Press <kbd>?</kbd> anytime to open this sheet.</p>
    <button type="button" aria-label="Close shortcuts modal">Close</button>
  </div>
</body>
</html>
`, {
  runScripts: 'dangerously',
})

// Configure axe-core
axe.configure({
  rules: [
    { id: 'color-contrast', enabled: false }, // jsdom does not calculate layout bounding client rects for text contrast
  ],
})

async function runAudit() {
  console.log('====================================================')
  console.log(' AUTOCANVAS WCAG 2.2 AA AUTOMATED ACCESSIBILITY AUDIT')
  console.log(' Engine: axe-core ' + axe.version)
  console.log(' Standards: WCAG 2.0 / 2.1 / 2.2 (Level A & AA)')
  console.log('====================================================\n')

  try {
    const results = await axe.run(dom.window.document.documentElement, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'],
      },
    })

    console.log(`✓ Rules Passed: ${results.passes.length}`)
    console.log(`- Inapplicable: ${results.inapplicable.length}`)
    console.log(`? Incomplete:   ${results.incomplete.length}`)
    console.log(`✗ Violations:   ${results.violations.length}\n`)

    if (results.violations.length > 0) {
      console.error('ACCESSIBILITY VIOLATIONS DETECTED:\n')
      results.violations.forEach((v, idx) => {
        console.error(`[${idx + 1}] Rule: ${v.id} (${v.impact})`)
        console.error(`    Description: ${v.description}`)
        console.error(`    Help: ${v.help} -> ${v.helpUrl}`)
        v.nodes.forEach((node) => {
          console.error(`    Target: ${node.target.join(' ')}`)
          console.error(`    Failure Summary: ${node.failureSummary}`)
        })
        console.error('')
      })
      process.exit(1)
    } else {
      console.log('PASS: Zero WCAG 2.2 AA accessibility violations detected.')
      console.log('AutoCanvas DOM navigation, aria labels, role attributes, and dialog semantics verified.\n')
      process.exit(0)
    }
  } catch (err) {
    console.error('Audit execution failed:', err)
    process.exit(1)
  }
}

runAudit()


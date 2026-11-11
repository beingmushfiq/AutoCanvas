import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const frontendDir = path.join(rootDir, 'frontend')
const frontendDist = path.join(frontendDir, 'dist')
const backendPublic = path.join(rootDir, 'backend', 'public')

console.log('🚀 Building AutoCanvas frontend for cPanel production...')
execSync('npm --prefix frontend run build', { stdio: 'inherit', cwd: rootDir })

if (!fs.existsSync(frontendDist)) {
  console.error('❌ Frontend build failed: frontend/dist directory not found.')
  process.exit(1)
}

console.log('📦 Merging compiled frontend assets into backend/public/ for cPanel unified deployment...')

const backendAssets = path.join(backendPublic, 'assets')
if (fs.existsSync(backendAssets)) {
  fs.rmSync(backendAssets, { recursive: true, force: true })
}

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }

  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    // Never overwrite backend's primary entry scripts
    if (entry.name === 'index.php' || entry.name === '.htaccess') {
      continue
    }

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

copyDirRecursive(frontendDist, backendPublic)

console.log('✅ Frontend compiled and merged into backend/public successfully!')
console.log('🎉 Your backend/ directory is now ready for cPanel packaging!')


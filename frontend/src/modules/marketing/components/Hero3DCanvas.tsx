import React, { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { usePreferences } from '../../../lib/theme/PreferencesContext'
import { Sparkles, Compass, Share2, Layers, RotateCcw, Zap } from 'lucide-react'

interface Hero3DCanvasProps {
  onExplore?: () => void
}

export const Hero3DCanvas: React.FC<Hero3DCanvasProps> = ({ onExplore }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { theme } = usePreferences()

  const [activeChannel, setActiveChannel] = useState<'linkedin' | 'instagram' | 'x' | 'meta'>('linkedin')
  const [isHovered, setIsHovered] = useState(false)
  const [pulseCount, setPulseCount] = useState(0)

  // WebGL 3D Scene Refs
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const coreMeshRef = useRef<THREE.Mesh | null>(null)
  const ringsRef = useRef<THREE.Group[] | null>(null)
  const pulseRingsRef = useRef<THREE.Mesh[] | null>(null)
  const particlesRef = useRef<THREE.Points | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight || 480

    // 1. Scene, Camera, Renderer Setup
    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(0, 1.2, 7.5)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const isDark = theme === 'dark' || document.documentElement.getAttribute('data-theme') === 'dark'
    const brandAccentHex = 0xf59e0b // Editorial Amber
    const coreColorHex = isDark ? 0x1e293b : 0x0f172a
    const wireColorHex = isDark ? 0xf59e0b : 0xd97706

    // 2. Lighting System
    const ambientLight = new THREE.AmbientLight(isDark ? 0xffffff : 0xf8fafc, isDark ? 1.4 : 1.8)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(brandAccentHex, 2.5)
    keyLight.position.set(5, 8, 6)
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0x60a5fa, isDark ? 1.2 : 0.8)
    fillLight.position.set(-6, -4, -4)
    scene.add(fillLight)

    const pointLight = new THREE.PointLight(brandAccentHex, 3, 15)
    pointLight.position.set(0, 0, 0)
    scene.add(pointLight)

    // 3. Central Brand Core (Multi-Faceted Icosahedron Prism)
    const coreGroup = new THREE.Group()
    scene.add(coreGroup)

    const coreGeo = new THREE.IcosahedronGeometry(1.2, 1)
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: coreColorHex,
      metalness: 0.85,
      roughness: 0.18,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      reflectivity: 0.9,
      transmission: 0.35,
      thickness: 1.2,
      emissive: isDark ? 0x1c1917 : 0x000000,
    })
    const coreMesh = new THREE.Mesh(coreGeo, coreMat)
    coreGroup.add(coreMesh)
    coreMeshRef.current = coreMesh

    // Core Wireframe Cage
    const wireGeo = new THREE.IcosahedronGeometry(1.28, 1)
    const wireMat = new THREE.MeshBasicMaterial({
      color: wireColorHex,
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.45 : 0.28,
    })
    const wireMesh = new THREE.Mesh(wireGeo, wireMat)
    coreGroup.add(wireMesh)

    // Inner Glowing Kernel
    const kernelGeo = new THREE.SphereGeometry(0.5, 32, 32)
    const kernelMat = new THREE.MeshBasicMaterial({
      color: brandAccentHex,
      transparent: true,
      opacity: 0.8,
    })
    const kernelMesh = new THREE.Mesh(kernelGeo, kernelMat)
    coreGroup.add(kernelMesh)

    // 4. Concentric Orbital Rings (Representing Multi-Channel Rhythm)
    const rings: THREE.Group[] = []
    const ringConfigs = [
      { radius: 2.1, tube: 0.016, rotX: Math.PI / 3, rotY: Math.PI / 6, speed: 0.008, color: brandAccentHex },
      { radius: 2.9, tube: 0.014, rotX: -Math.PI / 4, rotY: Math.PI / 4, speed: -0.006, color: 0x38bdf8 },
      { radius: 3.7, tube: 0.012, rotX: Math.PI / 2.3, rotY: -Math.PI / 5, speed: 0.004, color: 0xa855f7 },
    ]

    ringConfigs.forEach((cfg) => {
      const ringGroup = new THREE.Group()
      ringGroup.rotation.x = cfg.rotX
      ringGroup.rotation.y = cfg.rotY

      const torusGeo = new THREE.TorusGeometry(cfg.radius, cfg.tube, 16, 100)
      const torusMat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        metalness: 0.9,
        roughness: 0.2,
        emissive: cfg.color,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: isDark ? 0.65 : 0.5,
      })
      const torusMesh = new THREE.Mesh(torusGeo, torusMat)
      ringGroup.add(torusMesh)

      // Add a planetary channel node on the orbit
      const nodeGeo = new THREE.SphereGeometry(0.12, 16, 16)
      const nodeMat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        emissive: cfg.color,
        emissiveIntensity: 0.8,
      })
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat)
      nodeMesh.position.set(cfg.radius, 0, 0)
      ringGroup.add(nodeMesh)

      scene.add(ringGroup)
      rings.push(ringGroup)
    })
    ringsRef.current = rings

    // 5. Dynamic Pulse Waves (Expands on Click / Rhythm Pulse)
    const pulseRings: THREE.Mesh[] = []
    for (let i = 0; i < 3; i++) {
      const pGeo = new THREE.RingGeometry(1.2, 1.25, 64)
      const pMat = new THREE.MeshBasicMaterial({
        color: brandAccentHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
      })
      const pMesh = new THREE.Mesh(pGeo, pMat)
      pMesh.rotation.x = Math.PI / 2
      pMesh.visible = false
      scene.add(pMesh)
      pulseRings.push(pMesh)
    }
    pulseRingsRef.current = pulseRings

    // 6. Interactive Star Constellation / Signal Particles
    const particleCount = 280
    const particlePositions = new Float32Array(particleCount * 3)
    const particleColors = new Float32Array(particleCount * 3)

    const c1 = new THREE.Color(brandAccentHex)
    const c2 = new THREE.Color(0x38bdf8)
    const c3 = new THREE.Color(isDark ? 0xffffff : 0x475569)

    for (let i = 0; i < particleCount; i++) {
      const radius = 2.2 + Math.random() * 4.5
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)

      particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      particlePositions[i * 3 + 2] = radius * Math.cos(phi)

      const mixedColor = i % 3 === 0 ? c1 : i % 3 === 1 ? c2 : c3
      particleColors[i * 3] = mixedColor.r
      particleColors[i * 3 + 1] = mixedColor.g
      particleColors[i * 3 + 2] = mixedColor.b
    }

    const particleGeo = new THREE.BufferGeometry()
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3))

    const particleMat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.75 : 0.6,
      blending: THREE.AdditiveBlending,
    })
    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)
    particlesRef.current = particles

    // 7. Mouse / Touch Pointer Tracking & Smooth Parallax Physics
    let mouseX = 0
    let mouseY = 0
    let targetX = 0
    let targetY = 0
    let isDragging = false
    let prevPointerX = 0
    let prevPointerY = 0
    let dragVelocityX = 0
    let dragVelocityY = 0

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)

      if (isDragging) {
        const deltaX = e.clientX - prevPointerX
        const deltaY = e.clientY - prevPointerY
        dragVelocityX = deltaX * 0.005
        dragVelocityY = deltaY * 0.005
        prevPointerX = e.clientX
        prevPointerY = e.clientY
      } else {
        mouseX = x * 0.8
        mouseY = y * 0.5
      }
    }

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true
      prevPointerX = e.clientX
      prevPointerY = e.clientY
    }

    const handlePointerUp = () => {
      isDragging = false
    }

    container.addEventListener('pointermove', handlePointerMove)
    container.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointerup', handlePointerUp)

    // 8. Animation & Render Loop
    let clock = new THREE.Clock()
    let pulseProgress = 1

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate)

      const delta = clock.getDelta()
      const elapsed = clock.getElapsedTime()

      // Smooth camera interpolation (Parallax)
      targetX += (mouseX - targetX) * 0.05
      targetY += (mouseY - targetY) * 0.05
      camera.position.x = targetX * 1.5
      camera.position.y = 1.2 + targetY * 0.9
      camera.lookAt(0, 0, 0)

      // Rotate core mesh
      if (coreGroup) {
        coreGroup.rotation.y += 0.006 + dragVelocityX
        coreGroup.rotation.x += 0.004 + dragVelocityY
        // Damping on drag impulse
        dragVelocityX *= 0.94
        dragVelocityY *= 0.94

        // Gentle breathing pulsation
        const breathe = 1 + Math.sin(elapsed * 2) * 0.025
        coreMesh.scale.set(breathe, breathe, breathe)
        wireMesh.scale.set(breathe * 1.05, breathe * 1.05, breathe * 1.05)
      }

      // Rotate orbital rings
      if (ringsRef.current) {
        ringsRef.current.forEach((ring, idx) => {
          const cfg = ringConfigs[idx]
          ring.rotation.z += cfg.speed
        })
      }

      // Rotate background constellation
      if (particlesRef.current) {
        particlesRef.current.rotation.y = elapsed * 0.02
        particlesRef.current.rotation.x = Math.sin(elapsed * 0.01) * 0.1
      }

      // Animate shockwave pulse if triggered
      if (pulseProgress < 1 && pulseRingsRef.current) {
        pulseProgress += delta * 1.2
        pulseRingsRef.current.forEach((ring, idx) => {
          const delayOffset = idx * 0.15
          const currentT = Math.max(0, Math.min(1, (pulseProgress - delayOffset) / (1 - delayOffset)))
          if (currentT > 0 && currentT < 1) {
            ring.visible = true
            const scale = 1.2 + currentT * 3.5
            ring.scale.set(scale, scale, 1)
            ;(ring.material as THREE.MeshBasicMaterial).opacity = (1 - currentT) * 0.75
          } else {
            ring.visible = false
          }
        })
      }

      renderer.render(scene, camera)
    }

    animate()

    // 9. Resize Observer
    const handleResize = () => {
      if (!container || !rendererRef.current) return
      const newWidth = container.clientWidth
      const newHeight = container.clientHeight || 480
      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      rendererRef.current.setSize(newWidth, newHeight)
    }

    window.addEventListener('resize', handleResize)

    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize)
      container.removeEventListener('pointermove', handlePointerMove)
      container.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointerup', handlePointerUp)

      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (rendererRef.current && rendererRef.current.domElement) {
        container.removeChild(rendererRef.current.domElement)
        rendererRef.current.dispose()
      }
      coreGeo.dispose()
      coreMat.dispose()
      wireGeo.dispose()
      wireMat.dispose()
      kernelGeo.dispose()
      kernelMat.dispose()
      particleGeo.dispose()
      particleMat.dispose()
    }
  }, [theme])

  // Trigger pulse effect
  const handleTriggerPulse = () => {
    setPulseCount((prev) => prev + 1)
    if (coreMeshRef.current) {
      coreMeshRef.current.scale.set(1.3, 1.3, 1.3)
    }
  }

  return (
    <div
      className={`relative w-full max-w-5xl mx-auto rounded-3xl border transition-all duration-300 mt-14 shadow-2xl overflow-hidden select-none bg-gradient-to-b from-surface/80 via-surface/40 to-background/90 backdrop-blur-md ${
        isHovered ? 'border-brand-accent/50 shadow-brand-accent/10' : 'border-border'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Subtle Top Specular Lighting Highlight */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-accent/50 to-transparent" />

      {/* Interactive 3D Canvas Viewport */}
      <div
        ref={containerRef}
        onClick={handleTriggerPulse}
        className="w-full h-[440px] sm:h-[500px] cursor-grab active:cursor-grabbing relative flex items-center justify-center outline-hidden"
        title="Interactive 3D Kinetic Brand Core. Click or drag to interact."
      />

      {/* Floating Tactical Channel Chips (Top Left) */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex flex-col gap-2 z-20 pointer-events-auto">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface/90 border border-border text-[11px] font-mono text-foreground shadow-sm backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
          <span className="font-semibold tracking-wide">AUTOCANVAS KINETIC CORE</span>
          {pulseCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-brand-accent/20 text-brand-accent text-[9px] font-bold">
              +{pulseCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface/80 border border-border backdrop-blur-md">
          {[
            { id: 'linkedin', label: 'LinkedIn', icon: Share2 },
            { id: 'instagram', label: 'Instagram', icon: Sparkles },
            { id: 'x', label: 'X / Twitter', icon: Compass },
            { id: 'meta', label: 'Facebook', icon: Layers },
          ].map((channel) => (
            <button
              key={channel.id}
              onClick={(e) => {
                e.stopPropagation()
                setActiveChannel(channel.id as any)
                handleTriggerPulse()
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium transition-all ${
                activeChannel === channel.id
                  ? 'bg-brand-accent text-interactive-primary-fg font-bold shadow-2xs'
                  : 'text-foreground-secondary hover:text-foreground hover:bg-background-subtle'
              }`}
            >
              {channel.label}
            </button>
          ))}
        </div>
      </div>

      {/* Floating Live Editorial Badges (Top Right) */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex flex-col items-end gap-2 z-20 pointer-events-none">
        <div className="px-3.5 py-2 rounded-2xl bg-surface/85 border border-border text-right backdrop-blur-md shadow-sm">
          <div className="text-[10px] font-mono uppercase text-foreground-muted">Content Cadence</div>
          <div className="text-xs font-bold text-foreground flex items-center gap-1.5 justify-end mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
            <span>Always in Rhythm</span>
          </div>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-brand-accent/10 border border-brand-accent/30 text-[11px] font-mono text-brand-accent font-semibold backdrop-blur-md">
          <span>100% Originality Verified</span>
        </div>
      </div>

      {/* Bottom Center Tactical Instruction / Explore Action */}
      <div className="absolute bottom-4 inset-x-0 flex items-center justify-between px-6 z-20 pointer-events-auto">
        <div className="flex items-center gap-2 text-xs text-foreground-muted font-mono">
          <RotateCcw className="w-3.5 h-3.5 text-brand-accent animate-spin-slow" />
          <span className="hidden sm:inline">Drag to orbit in 3D • Tap core to pulse energy</span>
          <span className="sm:hidden">Drag to rotate core</span>
        </div>

        {onExplore && (
          <button
            onClick={onExplore}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-interactive-primary text-interactive-primary-fg text-xs font-semibold hover:opacity-90 active:scale-98 transition-all shadow-md"
          >
            <Zap className="w-3.5 h-3.5 text-brand-accent" />
            <span>Launch Live Workspace</span>
          </button>
        )}
      </div>
    </div>
  )
}

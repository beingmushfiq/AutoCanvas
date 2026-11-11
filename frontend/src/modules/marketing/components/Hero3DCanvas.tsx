import React, { useRef, useEffect, useState, useMemo } from 'react'
import * as THREE from 'three'
import { usePreferences } from '../../../lib/theme/PreferencesContext'
import {
  Calendar,
  Sparkles,
  Radio,
  Palette,
  Share2,
  ShieldCheck,
  RotateCcw,
  Zap,
  ChevronRight,
  Bot,
  Activity,
  Check,
} from 'lucide-react'

interface Hero3DCanvasProps {
  onExplore?: () => void
}

interface SocialOption {
  id: string
  title: string
  badge: string
  stat: string
  desc: string
  icon: React.ComponentType<{ className?: string }>
  position3D: [number, number, number] // [x, y, z] relative to mascot
  side: 'left' | 'right'
}

const SOCIAL_OPTIONS: SocialOption[] = [
  {
    id: 'cadence',
    title: 'Smart Cadence',
    badge: 'Auto-Schedule',
    stat: 'Peak-time queue active',
    desc: 'Autonomous slot scheduling based on audience engagement velocity.',
    icon: Calendar,
    position3D: [-2.6, 1.4, 0.4],
    side: 'left',
  },
  {
    id: 'hook',
    title: 'AI Hook Foundry',
    badge: 'Multi-Tone Copy',
    stat: 'Viral angles for LinkedIn & X',
    desc: 'Generates original hooks, narratives, and platform-specific formats.',
    icon: Sparkles,
    position3D: [-3.0, 0.0, 0.6],
    side: 'left',
  },
  {
    id: 'radar',
    title: 'Trend Radar',
    badge: 'Hourly Scourer',
    stat: '180-Day SimHash novelty',
    desc: 'Scours breaking industry signals and filters duplicate angles.',
    icon: Radio,
    position3D: [-2.5, -1.3, 0.4],
    side: 'left',
  },
  {
    id: 'canvas',
    title: 'Pixel Studio',
    badge: 'Deterministic SVG',
    stat: 'Zero blurry AI raster text',
    desc: 'Dynamic brand font typography rendered with crisp vector accuracy.',
    icon: Palette,
    position3D: [2.6, 1.4, 0.4],
    side: 'right',
  },
  {
    id: 'omni',
    title: 'Omni-Channel Sync',
    badge: 'Multi-Network',
    stat: 'LinkedIn, IG, X & Meta',
    desc: 'Atomic child dispatching with automated OAuth token health checks.',
    icon: Share2,
    position3D: [3.0, 0.0, 0.6],
    side: 'right',
  },
  {
    id: 'safety',
    title: 'Brand Guardrails',
    badge: 'Zero Hallucinations',
    stat: '100% Originality gate',
    desc: 'Multi-tier safety checks ensure every post aligns with brand guidelines.',
    icon: ShieldCheck,
    position3D: [2.5, -1.3, 0.4],
    side: 'right',
  },
]

const STORY_CHAPTERS = [
  {
    index: 0,
    title: '1. Autonomous Radar',
    subtitle: 'Hourly Industry Scouring',
    desc: 'Dex tracks market shifts, filters duplicate topics, and spots novel angles before competitors.',
  },
  {
    index: 1,
    title: '2. Multi-Tone Hooks',
    subtitle: 'Audience-Specific Copy',
    desc: 'Dex crafts tone-matched narratives calibrated for LinkedIn executives and X speed-readers.',
  },
  {
    index: 2,
    title: '3. Vector Creative Studio',
    subtitle: 'Pixel-Perfect Visuals',
    desc: 'Deterministic rendering engine composites brand assets with zero blurry AI text drift.',
  },
  {
    index: 3,
    title: '4. Cadence & Auto-Publish',
    subtitle: 'Always in Rhythm',
    desc: 'Safe multi-channel queue dispatches at peak engagement hours with atomic token protection.',
  },
]

export const Hero3DCanvas: React.FC<Hero3DCanvasProps> = ({ onExplore }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { theme } = usePreferences()

  const [activeOptionId, setActiveOptionId] = useState<string>('cadence')
  const [currentChapter, setCurrentChapter] = useState<number>(0)
  const [interactionCount, setInteractionCount] = useState<number>(0)
  const [mascotMood, setMascotMood] = useState<'greeting' | 'focus' | 'creative' | 'launch'>('greeting')

  // Smooth scroll sync ref
  const scrollProgressRef = useRef<number>(0)
  const targetScrollProgressRef = useRef<number>(0)

  // Mouse tracking refs
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const targetMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Active option 3D target ref
  const target3DRef = useRef<THREE.Vector3 | null>(new THREE.Vector3(-2.6, 1.4, 0.4))

  // Three.js Scene References
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const animFrameRef = useRef<number | null>(null)

  // Mascot Mesh Parts
  const mascotRootRef = useRef<THREE.Group | null>(null)
  const headGroupRef = useRef<THREE.Group | null>(null)
  const eyeLRef = useRef<THREE.Mesh | null>(null)
  const eyeRRef = useRef<THREE.Mesh | null>(null)
  const pupilLRef = useRef<THREE.Mesh | null>(null)
  const pupilRRef = useRef<THREE.Mesh | null>(null)
  const leftHandRef = useRef<THREE.Group | null>(null)
  const rightHandRef = useRef<THREE.Group | null>(null)
  const antennaOrbRef = useRef<THREE.Mesh | null>(null)
  const holographicTabletRef = useRef<THREE.Group | null>(null)
  const energyBeamRef = useRef<THREE.Line | null>(null)
  const optionNodesRef = useRef<THREE.Group[]>([])

  const activeOption = useMemo(
    () => SOCIAL_OPTIONS.find((opt) => opt.id === activeOptionId) || SOCIAL_OPTIONS[0],
    [activeOptionId]
  )

  // Handle Scroll Synchronization
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const rawProgress = docHeight > 0 ? Math.min(1, Math.max(0, scrollY / (docHeight * 0.85))) : 0
      targetScrollProgressRef.current = rawProgress

      // Sync active chapter with scroll depth
      const chapterIdx = Math.min(3, Math.floor(rawProgress * 4))
      setCurrentChapter(chapterIdx)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // WebGL Mascot Initialization
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight || 560

    // 1. Scene, Camera, High-Performance WebGL Renderer
    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.set(0, 0.6, 7.5)
    camera.lookAt(0, 0.2, 0)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.25
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const isDark = theme === 'dark' || document.documentElement.getAttribute('data-theme') === 'dark'

    // Color definitions
    const brandAccentHex = 0xf59e0b // Editorial Amber
    const cyanLightHex = 0x38bdf8 // High-tech Cyan
    const ceramicHex = isDark ? 0x1e293b : 0xf1f5f9
    const darkVisorHex = 0x050811
    const goldKernelHex = 0xfbbf24

    // 2. Dynamic Lighting System
    const ambientLight = new THREE.AmbientLight(isDark ? 0xffffff : 0xf8fafc, isDark ? 1.4 : 1.9)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(brandAccentHex, 3.2)
    keyLight.position.set(4, 7, 5)
    scene.add(keyLight)

    const rimLight = new THREE.DirectionalLight(cyanLightHex, isDark ? 2.5 : 1.6)
    rimLight.position.set(-5, -2, -3)
    scene.add(rimLight)

    const mascotGlowPoint = new THREE.PointLight(brandAccentHex, 2.8, 8)
    mascotGlowPoint.position.set(0, 0.4, 1.2)
    scene.add(mascotGlowPoint)

    // 3. Hierarchical Mascot Group Construction ("Dex")
    const mascotRoot = new THREE.Group()
    mascotRoot.position.set(0, 0, 0)
    scene.add(mascotRoot)
    mascotRootRef.current = mascotRoot

    // Mascot Common Materials
    const ceramicMat = new THREE.MeshPhysicalMaterial({
      color: ceramicHex,
      metalness: 0.2,
      roughness: 0.18,
      clearcoat: 0.95,
      clearcoatRoughness: 0.1,
      reflectivity: 0.85,
    })

    const visorMat = new THREE.MeshPhysicalMaterial({
      color: darkVisorHex,
      metalness: 0.95,
      roughness: 0.04,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      reflectivity: 0.98,
      transmission: 0.4,
      thickness: 0.8,
    })

    const accentMat = new THREE.MeshStandardMaterial({
      color: brandAccentHex,
      emissive: brandAccentHex,
      emissiveIntensity: 0.6,
      metalness: 0.8,
      roughness: 0.2,
    })

    // --- A. Torso / Capsule Body ---
    const bodyGroup = new THREE.Group()
    mascotRoot.add(bodyGroup)

    const torsoGeo = new THREE.CapsuleGeometry(0.72, 0.65, 16, 32)
    const torsoMesh = new THREE.Mesh(torsoGeo, ceramicMat)
    torsoMesh.position.y = -0.1
    bodyGroup.add(torsoMesh)

    // Glowing Waist Ring
    const beltGeo = new THREE.TorusGeometry(0.74, 0.035, 16, 64)
    const beltMesh = new THREE.Mesh(beltGeo, accentMat)
    beltMesh.rotation.x = Math.PI / 2
    beltMesh.position.y = -0.15
    bodyGroup.add(beltMesh)

    // Chest Emblem (Octahedral Core)
    const emblemGeo = new THREE.OctahedronGeometry(0.18, 0)
    const emblemMat = new THREE.MeshStandardMaterial({
      color: goldKernelHex,
      emissive: goldKernelHex,
      emissiveIntensity: 0.9,
    })
    const emblemMesh = new THREE.Mesh(emblemGeo, emblemMat)
    emblemMesh.position.set(0, 0.12, 0.72)
    bodyGroup.add(emblemMesh)

    // Base Floating Repulsor Ring
    const repulsorGeo = new THREE.TorusGeometry(0.48, 0.025, 16, 32)
    const repulsorMat = new THREE.MeshBasicMaterial({
      color: cyanLightHex,
      transparent: true,
      opacity: 0.8,
    })
    const repulsorMesh = new THREE.Mesh(repulsorGeo, repulsorMat)
    repulsorMesh.rotation.x = Math.PI / 2
    repulsorMesh.position.y = -0.75
    bodyGroup.add(repulsorMesh)

    // --- B. Articulated Head & Face Visor ---
    const headPivot = new THREE.Group()
    headPivot.position.set(0, 0.72, 0)
    mascotRoot.add(headPivot)
    headGroupRef.current = headPivot

    // Outer Helmet
    const headGeo = new THREE.SphereGeometry(0.78, 32, 32)
    const headMesh = new THREE.Mesh(headGeo, ceramicMat)
    headMesh.scale.set(1.04, 0.96, 1.0)
    headPivot.add(headMesh)

    // Curved Glossy Visor Faceplate
    const visorGeo = new THREE.SphereGeometry(0.8, 32, 24, -Math.PI / 2.3, Math.PI / 1.15, Math.PI / 4.5, Math.PI / 2)
    const visorMesh = new THREE.Mesh(visorGeo, visorMat)
    headPivot.add(visorMesh)

    // Eyes: Glowing Digital Sockets & Mouse-Tracking Pupils
    const eyeSocketGeo = new THREE.PlaneGeometry(0.24, 0.28)
    const eyeSocketMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    })

    const eyeL = new THREE.Mesh(eyeSocketGeo, eyeSocketMat)
    eyeL.position.set(-0.25, 0.08, 0.74)
    headPivot.add(eyeL)
    eyeLRef.current = eyeL

    const eyeR = new THREE.Mesh(eyeSocketGeo, eyeSocketMat)
    eyeR.position.set(0.25, 0.08, 0.74)
    headPivot.add(eyeR)
    eyeRRef.current = eyeR

    // Digital Pupil Nodes (Track Mouse)
    const pupilGeo = new THREE.CircleGeometry(0.085, 24)
    const pupilMat = new THREE.MeshBasicMaterial({
      color: brandAccentHex,
      side: THREE.DoubleSide,
    })

    const pupilL = new THREE.Mesh(pupilGeo, pupilMat)
    pupilL.position.set(-0.25, 0.08, 0.75)
    headPivot.add(pupilL)
    pupilLRef.current = pupilL

    const pupilR = new THREE.Mesh(pupilGeo, pupilMat)
    pupilR.position.set(0.25, 0.08, 0.75)
    headPivot.add(pupilR)
    pupilRRef.current = pupilR

    // Headphone Ear Pods
    const earPodGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.12, 24)
    const earPodL = new THREE.Mesh(earPodGeo, ceramicMat)
    earPodL.rotation.z = Math.PI / 2
    earPodL.position.set(-0.84, 0.02, 0)
    headPivot.add(earPodL)

    const earRingGeo = new THREE.TorusGeometry(0.2, 0.02, 16, 32)
    const earRingL = new THREE.Mesh(earRingGeo, accentMat)
    earRingL.rotation.y = Math.PI / 2
    earRingL.position.set(-0.91, 0.02, 0)
    headPivot.add(earRingL)

    const earPodR = new THREE.Mesh(earPodGeo, ceramicMat)
    earPodR.rotation.z = Math.PI / 2
    earPodR.position.set(0.84, 0.02, 0)
    headPivot.add(earPodR)

    const earRingR = new THREE.Mesh(earRingGeo, accentMat)
    earRingR.rotation.y = Math.PI / 2
    earRingR.position.set(0.91, 0.02, 0)
    headPivot.add(earRingR)

    // Antenna & Top Signal Beacon
    const stalkGeo = new THREE.CylinderGeometry(0.02, 0.035, 0.38, 16)
    const stalkMesh = new THREE.Mesh(stalkGeo, ceramicMat)
    stalkMesh.position.set(0, 0.88, -0.05)
    stalkMesh.rotation.x = -0.15
    headPivot.add(stalkMesh)

    const orbGeo = new THREE.SphereGeometry(0.11, 16, 16)
    const orbMat = new THREE.MeshStandardMaterial({
      color: brandAccentHex,
      emissive: brandAccentHex,
      emissiveIntensity: 1.2,
    })
    const orbMesh = new THREE.Mesh(orbGeo, orbMat)
    orbMesh.position.set(0, 1.08, -0.08)
    headPivot.add(orbMesh)
    antennaOrbRef.current = orbMesh

    // --- C. Floating Magnetic Hands ---
    const handMat = new THREE.MeshPhysicalMaterial({
      color: ceramicHex,
      metalness: 0.3,
      roughness: 0.2,
      clearcoat: 0.9,
    })

    const handGeo = new THREE.SphereGeometry(0.17, 24, 24)
    handGeo.scale(1.0, 0.8, 1.2)

    // Left Hand
    const leftHand = new THREE.Group()
    leftHand.position.set(-1.15, 0.05, 0.3)
    const leftHandMesh = new THREE.Mesh(handGeo, handMat)
    leftHand.add(leftHandMesh)
    mascotRoot.add(leftHand)
    leftHandRef.current = leftHand

    // Right Hand (Interactive Pointer)
    const rightHand = new THREE.Group()
    rightHand.position.set(1.15, 0.05, 0.3)
    const rightHandMesh = new THREE.Mesh(handGeo, handMat)
    rightHand.add(rightHandMesh)
    mascotRoot.add(rightHand)
    rightHandRef.current = rightHand

    // --- D. Floating Holographic Canvas (Creative Studio Morph Target) ---
    const holoGroup = new THREE.Group()
    holoGroup.position.set(0, 0.15, 0.95)
    holoGroup.scale.set(0.001, 0.001, 0.001) // hidden by default, expands in Chapter 3
    mascotRoot.add(holoGroup)
    holographicTabletRef.current = holoGroup

    const tabletBorderGeo = new THREE.BoxGeometry(1.3, 0.85, 0.02)
    const tabletBorderMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.2,
      wireframe: true,
    })
    const tabletBorder = new THREE.Mesh(tabletBorderGeo, tabletBorderMat)
    holoGroup.add(tabletBorder)

    const tabletScreenGeo = new THREE.PlaneGeometry(1.24, 0.79)
    const tabletScreenMat = new THREE.MeshBasicMaterial({
      color: brandAccentHex,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    })
    const tabletScreen = new THREE.Mesh(tabletScreenGeo, tabletScreenMat)
    holoGroup.add(tabletScreen)

    // --- E. 3D Floating Option Pedestals Around Dex ---
    const optionNodes: THREE.Group[] = []
    SOCIAL_OPTIONS.forEach((opt) => {
      const nodeGroup = new THREE.Group()
      nodeGroup.position.set(...opt.position3D)

      // Hexagonal Crystal Pod
      const crystalGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.06, 6)
      const crystalMat = new THREE.MeshStandardMaterial({
        color: opt.id === activeOptionId ? brandAccentHex : isDark ? 0x334155 : 0x94a3b8,
        emissive: opt.id === activeOptionId ? brandAccentHex : 0x000000,
        emissiveIntensity: opt.id === activeOptionId ? 0.8 : 0.0,
        metalness: 0.8,
        roughness: 0.25,
      })
      const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat)
      nodeGroup.add(crystalMesh)

      // Orbiting Halo
      const haloGeo = new THREE.TorusGeometry(0.28, 0.015, 16, 32)
      const haloMat = new THREE.MeshBasicMaterial({
        color: opt.id === activeOptionId ? brandAccentHex : cyanLightHex,
        transparent: true,
        opacity: 0.6,
      })
      const haloMesh = new THREE.Mesh(haloGeo, haloMat)
      nodeGroup.add(haloMesh)

      scene.add(nodeGroup)
      optionNodes.push(nodeGroup)
    })
    optionNodesRef.current = optionNodes

    // --- F. Dynamic Energy Beam (Links Dex's chest to active option) ---
    const beamCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.12, 0.72),
      new THREE.Vector3(-1.2, 0.8, 0.5),
      new THREE.Vector3(-2.6, 1.4, 0.4),
    ])
    const beamGeo = new THREE.BufferGeometry().setFromPoints(beamCurve.getPoints(24))
    const beamMat = new THREE.LineBasicMaterial({
      color: brandAccentHex,
      transparent: true,
      opacity: 0.75,
    })
    const energyBeam = new THREE.Line(beamGeo, beamMat)
    scene.add(energyBeam)
    energyBeamRef.current = energyBeam

    // --- G. Background Signal Constellation ---
    const particleCount = 220
    const particlePositions = new Float32Array(particleCount * 3)
    const particleColors = new Float32Array(particleCount * 3)
    const colorAmber = new THREE.Color(brandAccentHex)
    const colorCyan = new THREE.Color(cyanLightHex)
    const colorWhite = new THREE.Color(isDark ? 0xffffff : 0x64748b)

    for (let i = 0; i < particleCount; i++) {
      const radius = 3.0 + Math.random() * 4.5
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)

      particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      particlePositions[i * 3 + 2] = radius * Math.cos(phi)

      const mixed = i % 3 === 0 ? colorAmber : i % 3 === 1 ? colorCyan : colorWhite
      particleColors[i * 3] = mixed.r
      particleColors[i * 3 + 1] = mixed.g
      particleColors[i * 3 + 2] = mixed.b
    }

    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    starGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3))

    const starMat = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.8 : 0.5,
      blending: THREE.AdditiveBlending,
    })
    const starField = new THREE.Points(starGeo, starMat)
    scene.add(starField)

    // 4. Mouse Move Tracking Handler
    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
      targetMousePosRef.current = { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) }
    }

    container.addEventListener('pointermove', handlePointerMove)

    // 5. Blinking Animation State
    let blinkTimer = 0
    let nextBlinkInterval = 3.2
    let blinkProgress = 0

    // 6. Camera Keyframes for Scroll Sync (Guiding Through Brand Story)
    const cameraKeyframes = [
      // Chapter 0: Autonomous Radar (Hero overview)
      { camPos: new THREE.Vector3(0, 0.4, 7.6), lookAt: new THREE.Vector3(0, 0.1, 0), mascotY: 0, mascotRotY: 0 },
      // Chapter 1: Multi-Tone Hooks (Focused discovery)
      { camPos: new THREE.Vector3(-1.8, 0.8, 6.2), lookAt: new THREE.Vector3(-0.4, 0.2, 0), mascotY: 0.15, mascotRotY: 0.35 },
      // Chapter 2: Vector Studio (Close creative inspection)
      { camPos: new THREE.Vector3(1.8, 0.3, 5.4), lookAt: new THREE.Vector3(0.3, 0.1, 0), mascotY: -0.1, mascotRotY: -0.38 },
      // Chapter 3: Cadence & Publishing (Elevated launch stance)
      { camPos: new THREE.Vector3(0, 1.8, 8.2), lookAt: new THREE.Vector3(0, 0.4, 0), mascotY: 0.25, mascotRotY: 0 },
    ]

    // 7. Master Animation & Render Loop
    const clock = new THREE.Clock()

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate)

      const delta = clock.getDelta()
      const elapsed = clock.getElapsedTime()

      // --- A. Smooth Pointer Interpolation ---
      mousePosRef.current.x += (targetMousePosRef.current.x - mousePosRef.current.x) * 0.08
      mousePosRef.current.y += (targetMousePosRef.current.y - mousePosRef.current.y) * 0.08
      const curX = mousePosRef.current.x
      const curY = mousePosRef.current.y

      // --- B. Smooth Scroll Progression Interpolation ---
      scrollProgressRef.current += (targetScrollProgressRef.current - scrollProgressRef.current) * 0.06
      const scrollT = scrollProgressRef.current

      // Compute Camera Keyframe Interpolation
      const stageSegment = scrollT * 3 // 0 to 3
      const baseIdx = Math.min(2, Math.floor(stageSegment))
      const segT = stageSegment - baseIdx

      const kfStart = cameraKeyframes[baseIdx]
      const kfEnd = cameraKeyframes[Math.min(3, baseIdx + 1)]

      camera.position.lerpVectors(kfStart.camPos, kfEnd.camPos, segT)
      const currentLookAt = new THREE.Vector3().lerpVectors(kfStart.lookAt, kfEnd.lookAt, segT)
      camera.lookAt(currentLookAt)

      // --- C. Dex Mascot Floating & Bobbing Kinematics ---
      const floatY = Math.sin(elapsed * 2.2) * 0.09
      const targetMascotY = THREE.MathUtils.lerp(kfStart.mascotY, kfEnd.mascotY, segT) + floatY
      mascotRoot.position.y += (targetMascotY - mascotRoot.position.y) * 0.08

      // Lean body into mouse velocity
      mascotRoot.rotation.z = -curX * 0.08
      mascotRoot.position.x = curX * 0.35

      // --- D. Mascot Head Tracking (Eyes & Visor Follow Pointer) ---
      if (headPivot) {
        const headTargetRotY = curX * 0.55 + THREE.MathUtils.lerp(kfStart.mascotRotY, kfEnd.mascotRotY, segT)
        const headTargetRotX = -curY * 0.35
        headPivot.rotation.y += (headTargetRotY - headPivot.rotation.y) * 0.1
        headPivot.rotation.x += (headTargetRotX - headPivot.rotation.x) * 0.1
        headPivot.rotation.z = -curX * 0.05
      }

      // --- E. Eye Pupils Direct Tracking on Visor ---
      if (pupilL && pupilR) {
        pupilL.position.x = -0.25 + curX * 0.05
        pupilL.position.y = 0.08 + curY * 0.04
        pupilR.position.x = 0.25 + curX * 0.05
        pupilR.position.y = 0.08 + curY * 0.04
      }

      // --- F. Expressive Natural Blinking ---
      blinkTimer += delta
      if (blinkTimer > nextBlinkInterval) {
        blinkProgress += delta * 14
        if (blinkProgress >= Math.PI) {
          blinkTimer = 0
          blinkProgress = 0
          nextBlinkInterval = 2.8 + Math.random() * 3.5
          if (eyeL && eyeR) {
            eyeL.scale.y = 1
            eyeR.scale.y = 1
          }
        } else {
          const blinkScale = Math.max(0.08, Math.abs(Math.cos(blinkProgress)))
          if (eyeL && eyeR) {
            eyeL.scale.y = blinkScale
            eyeR.scale.y = blinkScale
          }
        }
      }

      // --- G. Magnetic Hands Animation ---
      if (leftHand && rightHand) {
        // Left hand gently stabilizes & bobs
        leftHand.position.y = 0.05 + Math.sin(elapsed * 2.5 + 1) * 0.08
        leftHand.position.x = -1.15 + curX * 0.1
        leftHand.rotation.z = Math.sin(elapsed * 1.8) * 0.15

        // Right hand points toward active option or mouse position
        const targetHandX = 1.15 + curX * 0.3
        const targetHandY = 0.05 + curY * 0.35 + Math.sin(elapsed * 2.5) * 0.06
        rightHand.position.x += (targetHandX - rightHand.position.x) * 0.12
        rightHand.position.y += (targetHandY - rightHand.position.y) * 0.12
        rightHand.rotation.z = -0.25 + curX * 0.4
      }

      // --- H. Antenna Beacon Pulsation ---
      if (antennaOrbRef.current) {
        const pulse = 1 + Math.sin(elapsed * 5) * 0.15
        antennaOrbRef.current.scale.set(pulse, pulse, pulse)
      }

      // --- I. Chapter Morph Target: Holographic Tablet (Expanded in Chapter 2) ---
      if (holoGroup) {
        const isStudioChapter = baseIdx === 2
        const targetScale = isStudioChapter ? 1.0 : 0.001
        holoGroup.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08)
        if (isStudioChapter) {
          holoGroup.rotation.y = Math.sin(elapsed * 1.5) * 0.1
          holoGroup.rotation.x = 0.1 + Math.sin(elapsed * 2) * 0.05
        }
      }

      // --- J. Floating Option Pedestals Gentle Float & Active Highlight ---
      if (optionNodesRef.current.length > 0) {
        optionNodesRef.current.forEach((node, idx) => {
          const opt = SOCIAL_OPTIONS[idx]
          const isActive = opt.id === activeOptionId
          node.position.y = opt.position3D[1] + Math.sin(elapsed * 2 + idx) * 0.08
          node.rotation.y += 0.015

          // Active node scales up slightly
          const targetScale = isActive ? 1.25 : 1.0
          node.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
        })
      }

      // --- K. Dynamic Energy Streamer Update ---
      if (energyBeamRef.current && target3DRef.current) {
        const chestPos = new THREE.Vector3(0, mascotRoot.position.y + 0.12, 0.72)
        const targetPos = target3DRef.current
        const midPos = new THREE.Vector3(
          (chestPos.x + targetPos.x) * 0.5,
          (chestPos.y + targetPos.y) * 0.5 + 0.3,
          (chestPos.z + targetPos.z) * 0.5
        )
        const curve = new THREE.CatmullRomCurve3([chestPos, midPos, targetPos])
        energyBeamRef.current.geometry.setFromPoints(curve.getPoints(24))
      }

      // --- L. Constellation Starfield Drift ---
      starField.rotation.y = elapsed * 0.018

      renderer.render(scene, camera)
    }

    animate()

    // 8. Container Resize Observer
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return
      const newWidth = container.clientWidth
      const newHeight = container.clientHeight || 560
      cameraRef.current.aspect = newWidth / newHeight
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(newWidth, newHeight)
    }

    window.addEventListener('resize', handleResize)

    // Cleanup Resources on Unmount
    return () => {
      window.removeEventListener('resize', handleResize)
      container.removeEventListener('pointermove', handlePointerMove)

      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (rendererRef.current && rendererRef.current.domElement) {
        container.removeChild(rendererRef.current.domElement)
        rendererRef.current.dispose()
      }

      // Dispose Geometries & Materials
      torsoGeo.dispose()
      beltGeo.dispose()
      emblemGeo.dispose()
      repulsorGeo.dispose()
      headGeo.dispose()
      visorGeo.dispose()
      eyeSocketGeo.dispose()
      pupilGeo.dispose()
      earPodGeo.dispose()
      earRingGeo.dispose()
      stalkGeo.dispose()
      orbGeo.dispose()
      handGeo.dispose()
      tabletBorderGeo.dispose()
      tabletScreenGeo.dispose()
      starGeo.dispose()

      ceramicMat.dispose()
      visorMat.dispose()
      accentMat.dispose()
      emblemMat.dispose()
      repulsorMat.dispose()
      eyeSocketMat.dispose()
      pupilMat.dispose()
      handMat.dispose()
      tabletBorderMat.dispose()
      tabletScreenMat.dispose()
      starMat.dispose()
    }
  }, [theme])

  // Select Option and Update Mascot Target Point
  const handleSelectOption = (opt: SocialOption) => {
    setActiveOptionId(opt.id)
    target3DRef.current = new THREE.Vector3(...opt.position3D)
    setInteractionCount((prev) => prev + 1)

    // Mascot emotion reaction
    if (opt.id === 'cadence' || opt.id === 'omni') setMascotMood('launch')
    else if (opt.id === 'hook' || opt.id === 'radar') setMascotMood('focus')
    else if (opt.id === 'canvas') setMascotMood('creative')
    else setMascotMood('greeting')
  }

  // Chapter Jump (Scroll Sync or Direct Click)
  const handleSelectChapter = (idx: number) => {
    setCurrentChapter(idx)
    targetScrollProgressRef.current = idx / 3

    // Smoothly scroll the window to the corresponding section on page
    const sectionIds = ['hero', 'features', 'comparison', 'pricing']
    const targetElement = document.getElementById(sectionIds[idx])
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div
      className="relative w-full max-w-6xl mx-auto rounded-3xl border border-border mt-14 shadow-2xl overflow-hidden select-none bg-gradient-to-b from-surface/90 via-surface/50 to-background/95 backdrop-blur-md"
      aria-label="Interactive 3D Social Media Management Mascot and Narrative Guide"
    >
      {/* Top Ambient Glow Line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-accent/60 to-transparent" />

      {/* Floating Tactical Header Bar */}
      <div className="absolute top-4 inset-x-4 sm:top-6 sm:inset-x-6 flex items-center justify-between z-20 pointer-events-auto">
        {/* Mascot Status Badge */}
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-surface/95 border border-border text-xs font-mono text-foreground shadow-sm backdrop-blur-md">
          <Bot className="w-4 h-4 text-brand-accent animate-pulse" />
          <span className="font-semibold tracking-wide">DEX • AUTOCANVAS COPILOT</span>
          <span className="hidden sm:inline-block text-[10px] uppercase px-2 py-0.5 rounded-full bg-brand-accent-subtle text-foreground font-bold">
            {mascotMood}
          </span>
          {interactionCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-brand-accent/20 text-brand-accent text-[9px] font-bold">
              +{interactionCount}
            </span>
          )}
        </div>

        {/* Live Active Feature Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface/85 border border-border text-xs text-foreground font-mono backdrop-blur-md">
          <Activity className="w-3.5 h-3.5 text-brand-accent animate-pulse" />
          <span>{activeOption.title}: {activeOption.stat}</span>
        </div>
      </div>

      {/* Interactive 3D Canvas Viewport */}
      <div
        ref={containerRef}
        className="w-full h-[520px] sm:h-[580px] md:h-[640px] cursor-crosshair relative flex items-center justify-center outline-hidden"
        title="Interactive AutoCanvas Mascot. Move mouse to track, scroll to morph story."
      />

      {/* Floating Social Media Management Options - Desktop Floating Overlay Cards */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block">
        {/* Left Options (Smart Cadence, AI Hooks, Trend Radar) */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-3.5 w-64 pointer-events-auto">
          {SOCIAL_OPTIONS.filter((opt) => opt.side === 'left').map((opt) => {
            const IconComponent = opt.icon
            const isSelected = activeOptionId === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => handleSelectOption(opt)}
                className={`p-3.5 rounded-2xl border text-left transition-all duration-200 group relative backdrop-blur-md ${
                  isSelected
                    ? 'border-brand-accent bg-surface shadow-lg shadow-brand-accent/10 translate-x-1'
                    : 'border-border/80 bg-surface/75 hover:bg-surface hover:border-brand-accent/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isSelected
                          ? 'bg-brand-accent text-interactive-primary-fg'
                          : 'bg-brand-accent-subtle text-foreground'
                      }`}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-foreground">{opt.title}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-background-subtle text-foreground-secondary">
                    {opt.badge}
                  </span>
                </div>
                <div className="text-[11px] text-foreground-secondary line-clamp-1 group-hover:text-foreground">
                  {opt.stat}
                </div>
              </button>
            )
          })}
        </div>

        {/* Right Options (Pixel Studio, Omni-Channel, Brand Safety) */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3.5 w-64 pointer-events-auto">
          {SOCIAL_OPTIONS.filter((opt) => opt.side === 'right').map((opt) => {
            const IconComponent = opt.icon
            const isSelected = activeOptionId === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => handleSelectOption(opt)}
                className={`p-3.5 rounded-2xl border text-left transition-all duration-200 group relative backdrop-blur-md ${
                  isSelected
                    ? 'border-brand-accent bg-surface shadow-lg shadow-brand-accent/10 -translate-x-1'
                    : 'border-border/80 bg-surface/75 hover:bg-surface hover:border-brand-accent/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isSelected
                          ? 'bg-brand-accent text-interactive-primary-fg'
                          : 'bg-brand-accent-subtle text-foreground'
                      }`}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-foreground">{opt.title}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-background-subtle text-foreground-secondary">
                    {opt.badge}
                  </span>
                </div>
                <div className="text-[11px] text-foreground-secondary line-clamp-1 group-hover:text-foreground">
                  {opt.stat}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Mobile & Tablet Social Options Scrollable Carousel (Below Mascot) */}
      <div className="lg:hidden p-4 bg-surface/90 border-t border-border flex gap-2.5 overflow-x-auto pb-4 snap-x">
        {SOCIAL_OPTIONS.map((opt) => {
          const IconComponent = opt.icon
          const isSelected = activeOptionId === opt.id
          return (
            <button
              key={opt.id}
              onClick={() => handleSelectOption(opt)}
              className={`min-w-[190px] p-3 rounded-xl border text-left shrink-0 transition-all snap-start ${
                isSelected
                  ? 'border-brand-accent bg-background shadow-xs'
                  : 'border-border bg-surface'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`p-1 rounded-md ${
                    isSelected
                      ? 'bg-brand-accent text-interactive-primary-fg'
                      : 'bg-brand-accent-subtle text-foreground'
                  }`}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-foreground">{opt.title}</span>
              </div>
              <p className="text-[10px] text-foreground-secondary line-clamp-1">{opt.stat}</p>
            </button>
          )
        })}
      </div>

      {/* Bottom Floating Story Progression Bar (Synchronized with Page Scroll) */}
      <div className="p-4 sm:p-5 bg-surface/95 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Chapter Steps Indicator */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {STORY_CHAPTERS.map((ch) => {
            const isActive = currentChapter === ch.index
            return (
              <button
                key={ch.index}
                onClick={() => handleSelectChapter(ch.index)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono transition-all shrink-0 ${
                  isActive
                    ? 'bg-brand-accent text-interactive-primary-fg font-bold shadow-xs'
                    : 'text-foreground-secondary hover:text-foreground hover:bg-background-subtle'
                }`}
                title={ch.desc}
              >
                {isActive && <Check className="w-3.5 h-3.5" />}
                <span>{ch.title}</span>
              </button>
            )
          })}
        </div>

        {/* Tactical Story Action */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-foreground-muted font-mono">
            <RotateCcw className="w-3 h-3 text-brand-accent" />
            <span>Scroll page to fly camera & morph Dex</span>
          </div>

          {onExplore && (
            <button
              onClick={onExplore}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-interactive-primary text-interactive-primary-fg text-xs font-semibold hover:opacity-90 active:scale-98 transition-all shadow-md shrink-0"
            >
              <Zap className="w-3.5 h-3.5 text-brand-accent" />
              <span>Launch Live Workspace</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

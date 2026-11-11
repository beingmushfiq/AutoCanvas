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
  position3D: [number, number, number]
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
    position3D: [-2.6, 1.35, 0.4],
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
    position3D: [-2.5, -1.35, 0.4],
    side: 'left',
  },
  {
    id: 'canvas',
    title: 'Pixel Studio',
    badge: 'Deterministic SVG',
    stat: 'Zero blurry AI raster text',
    desc: 'Dynamic brand font typography rendered with crisp vector accuracy.',
    icon: Palette,
    position3D: [2.6, 1.35, 0.4],
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
    position3D: [2.5, -1.35, 0.4],
    side: 'right',
  },
]

const STORY_CHAPTERS = [
  {
    index: 0,
    shortTitle: '1. Radar',
    title: '1. Autonomous Radar',
    subtitle: 'Hourly Industry Scouring',
    desc: 'Dex tracks market shifts, filters duplicate topics, and spots novel angles before competitors.',
  },
  {
    index: 1,
    shortTitle: '2. Hooks',
    title: '2. Multi-Tone Hooks',
    subtitle: 'Audience-Specific Copy',
    desc: 'Dex crafts tone-matched narratives calibrated for LinkedIn executives and X speed-readers.',
  },
  {
    index: 2,
    shortTitle: '3. Studio',
    title: '3. Vector Creative Studio',
    subtitle: 'Pixel-Perfect Visuals',
    desc: 'Deterministic rendering engine composites brand assets with zero blurry AI text drift.',
  },
  {
    index: 3,
    shortTitle: '4. Cadence',
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
  const target3DRef = useRef<THREE.Vector3>(new THREE.Vector3(-2.6, 1.35, 0.4))

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
  const mouthRef = useRef<THREE.Mesh | null>(null)
  const leftHandRef = useRef<THREE.Group | null>(null)
  const rightHandRef = useRef<THREE.Group | null>(null)
  const stylusTipRef = useRef<THREE.Mesh | null>(null)
  const antennaOrbRef = useRef<THREE.Mesh | null>(null)
  const energyBeamRef = useRef<THREE.Line | null>(null)
  const badgeCapsulesRef = useRef<THREE.Group[]>([])

  const activeOption = useMemo(
    () => SOCIAL_OPTIONS.find((opt) => opt.id === activeOptionId) || SOCIAL_OPTIONS[0],
    [activeOptionId]
  )

  // Handle Scroll Synchronization with Page Scroll Depth
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const rawProgress = docHeight > 0 ? Math.min(1, Math.max(0, scrollY / (docHeight * 0.85))) : 0
      targetScrollProgressRef.current = rawProgress

      const chapterIdx = Math.min(3, Math.floor(rawProgress * 4))
      setCurrentChapter(chapterIdx)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // WebGL Mascot Scene Initialization
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight || 580

    // 1. Scene, Camera, High-Performance WebGL Renderer
    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.set(0, 0.5, 7.8)
    camera.lookAt(0, 0.15, 0)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.3
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const isDark = theme === 'dark' || document.documentElement.getAttribute('data-theme') === 'dark'

    // Brand-accent Editorial Color Palette
    const amberPrimaryHex = 0xf59e0b // AutoCanvas Brand Amber
    const amberBrightHex = 0xfbbf24
    const porcelainHex = isDark ? 0x1e293b : 0xfefce8 // Warm porcelain white in light mode
    const darkPlateHex = isDark ? 0x0f172a : 0x1c1917 // Architectural dark accent trim
    const eyeGlowHex = 0x38bdf8 // Luminous Cyan
    const darkVisorHex = 0x090d16 // Sleek obsidian faceplate

    // 2. High-Fidelity Studio Lighting
    const ambientLight = new THREE.AmbientLight(isDark ? 0xffffff : 0xfffbeb, isDark ? 1.6 : 2.2)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(amberBrightHex, 3.4)
    keyLight.position.set(4, 7, 6)
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0x38bdf8, isDark ? 2.2 : 1.6)
    fillLight.position.set(-6, -3, -4)
    scene.add(fillLight)

    const topRimLight = new THREE.DirectionalLight(0xffffff, 2.0)
    topRimLight.position.set(0, 8, -2)
    scene.add(topRimLight)

    const mascotChestGlow = new THREE.PointLight(amberBrightHex, 3.0, 9)
    mascotChestGlow.position.set(0, 0.3, 1.4)
    scene.add(mascotChestGlow)

    // 3. Materials
    // Body Armor: Warm Brand-Accent Amber Satin Ceramic
    const amberArmorMat = new THREE.MeshPhysicalMaterial({
      color: amberPrimaryHex,
      emissive: amberPrimaryHex,
      emissiveIntensity: 0.12,
      metalness: 0.22,
      roughness: 0.22,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
      reflectivity: 0.9,
    })

    // Porcelain Front Plate & Accent Panels
    const porcelainMat = new THREE.MeshPhysicalMaterial({
      color: porcelainHex,
      metalness: 0.1,
      roughness: 0.16,
      clearcoat: 0.85,
    })

    // Dark Architectural Trims & Joint Details
    const trimMat = new THREE.MeshStandardMaterial({
      color: darkPlateHex,
      metalness: 0.85,
      roughness: 0.25,
    })

    // Visor Faceplate
    const visorMat = new THREE.MeshPhysicalMaterial({
      color: darkVisorHex,
      metalness: 0.95,
      roughness: 0.04,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      reflectivity: 0.98,
      transmission: 0.3,
      thickness: 0.6,
    })

    // Translucent Glass for Floating Capsules
    const capsuleGlassMat = new THREE.MeshPhysicalMaterial({
      color: isDark ? 0x1e293b : 0xffffff,
      transmission: 0.9,
      opacity: 1,
      transparent: true,
      roughness: 0.08,
      ior: 1.5,
      thickness: 0.8,
    })

    // 4. Mascot Construction ("Dex" - Stylized Editorial Character)
    const mascotRoot = new THREE.Group()
    scene.add(mascotRoot)
    mascotRootRef.current = mascotRoot

    // --- A. Torso Body & Belly Plate ---
    const bodyGroup = new THREE.Group()
    mascotRoot.add(bodyGroup)

    // Outer Amber Armor Torso
    const torsoGeo = new THREE.CapsuleGeometry(0.74, 0.68, 16, 32)
    const torsoMesh = new THREE.Mesh(torsoGeo, amberArmorMat)
    torsoMesh.position.y = -0.08
    bodyGroup.add(torsoMesh)

    // Front Belly Plate (Warm Cream Inlay)
    const bellyGeo = new THREE.SphereGeometry(0.66, 32, 24, -Math.PI / 3, (Math.PI * 2) / 3, Math.PI / 3.2, Math.PI / 2.2)
    const bellyMesh = new THREE.Mesh(bellyGeo, porcelainMat)
    bellyMesh.position.set(0, -0.06, 0.16)
    bellyMesh.scale.set(1.0, 1.0, 0.95)
    bodyGroup.add(bellyMesh)

    // Waist Belt Trim Ring
    const beltGeo = new THREE.TorusGeometry(0.76, 0.035, 16, 64)
    const beltMesh = new THREE.Mesh(beltGeo, trimMat)
    beltMesh.rotation.x = Math.PI / 2
    beltMesh.position.y = -0.15
    bodyGroup.add(beltMesh)

    // Chest Emblem (Illuminated Octahedral Diamond Core)
    const emblemGeo = new THREE.OctahedronGeometry(0.19, 0)
    const emblemMat = new THREE.MeshStandardMaterial({
      color: amberBrightHex,
      emissive: amberBrightHex,
      emissiveIntensity: 1.2,
      metalness: 0.8,
    })
    const emblemMesh = new THREE.Mesh(emblemGeo, emblemMat)
    emblemMesh.position.set(0, 0.15, 0.74)
    bodyGroup.add(emblemMesh)

    // Floating Base Repulsor Rings (Anti-Gravity Thruster)
    const thrusterGeo = new THREE.TorusGeometry(0.46, 0.028, 16, 32)
    const thrusterMat = new THREE.MeshBasicMaterial({
      color: eyeGlowHex,
      transparent: true,
      opacity: 0.85,
    })
    const thrusterMesh = new THREE.Mesh(thrusterGeo, thrusterMat)
    thrusterMesh.rotation.x = Math.PI / 2
    thrusterMesh.position.y = -0.76
    bodyGroup.add(thrusterMesh)

    const thrusterInnerGeo = new THREE.TorusGeometry(0.32, 0.02, 16, 32)
    const thrusterInner = new THREE.Mesh(thrusterInnerGeo, thrusterMat)
    thrusterInner.rotation.x = Math.PI / 2
    thrusterInner.position.y = -0.84
    bodyGroup.add(thrusterInner)

    // --- B. Head, Curved Visor & Expressive Face ---
    const headPivot = new THREE.Group()
    headPivot.position.set(0, 0.74, 0)
    mascotRoot.add(headPivot)
    headGroupRef.current = headPivot

    // Amber Helmet Outer Shell
    const helmetGeo = new THREE.SphereGeometry(0.8, 32, 32)
    const helmetMesh = new THREE.Mesh(helmetGeo, amberArmorMat)
    helmetMesh.scale.set(1.06, 0.98, 1.02)
    headPivot.add(helmetMesh)

    // Visor Faceplate Frame (Dark Architectural Bevel)
    const visorFrameGeo = new THREE.SphereGeometry(0.81, 32, 24, -Math.PI / 2.2, Math.PI / 1.1, Math.PI / 4.2, Math.PI / 2)
    const visorFrameMesh = new THREE.Mesh(visorFrameGeo, trimMat)
    headPivot.add(visorFrameMesh)

    // Deep Obsidian Glossy Visor
    const visorGeo = new THREE.SphereGeometry(0.82, 32, 24, -Math.PI / 2.3, Math.PI / 1.15, Math.PI / 4.5, Math.PI / 2)
    const visorMesh = new THREE.Mesh(visorGeo, visorMat)
    headPivot.add(visorMesh)

    // Large Expressive Eyes (Digital Display Behind Visor)
    const eyeOuterGeo = new THREE.PlaneGeometry(0.3, 0.36)
    const eyeOuterMat = new THREE.MeshBasicMaterial({
      color: eyeGlowHex,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
    })

    const eyeL = new THREE.Mesh(eyeOuterGeo, eyeOuterMat)
    eyeL.position.set(-0.27, 0.08, 0.76)
    headPivot.add(eyeL)
    eyeLRef.current = eyeL

    const eyeR = new THREE.Mesh(eyeOuterGeo, eyeOuterMat)
    eyeR.position.set(0.27, 0.08, 0.76)
    headPivot.add(eyeR)
    eyeRRef.current = eyeR

    // Digital Pupil Discs (Track Cursor In Real Time)
    const pupilGeo = new THREE.CircleGeometry(0.11, 32)
    const pupilMat = new THREE.MeshBasicMaterial({
      color: amberBrightHex,
      side: THREE.DoubleSide,
    })

    const pupilL = new THREE.Mesh(pupilGeo, pupilMat)
    pupilL.position.set(-0.27, 0.08, 0.77)
    headPivot.add(pupilL)
    pupilLRef.current = pupilL

    const pupilR = new THREE.Mesh(pupilGeo, pupilMat)
    pupilR.position.set(0.27, 0.08, 0.77)
    headPivot.add(pupilR)
    pupilRRef.current = pupilR

    // Catchlight Sparkles (Gives Sentient, Friendly Personality)
    const sparkleGeo = new THREE.CircleGeometry(0.035, 16)
    const sparkleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    const sparkleL = new THREE.Mesh(sparkleGeo, sparkleMat)
    sparkleL.position.set(0.04, 0.04, 0.01)
    pupilL.add(sparkleL)

    const sparkleR = new THREE.Mesh(sparkleGeo, sparkleMat)
    sparkleR.position.set(0.04, 0.04, 0.01)
    pupilR.add(sparkleR)

    // Animated Digital Mouth Arc (Smile / Focus)
    const mouthGeo = new THREE.TorusGeometry(0.12, 0.02, 16, 32, Math.PI)
    const mouthMat = new THREE.MeshBasicMaterial({
      color: amberBrightHex,
      side: THREE.DoubleSide,
    })
    const mouthMesh = new THREE.Mesh(mouthGeo, mouthMat)
    mouthMesh.rotation.z = Math.PI // Smiling Arc
    mouthMesh.position.set(0, -0.15, 0.78)
    headPivot.add(mouthMesh)
    mouthRef.current = mouthMesh

    // Studio Headphone Ear Cushions & Top Headband
    const bandGeo = new THREE.TorusGeometry(0.85, 0.04, 16, 64, Math.PI * 0.9)
    const bandMesh = new THREE.Mesh(bandGeo, trimMat)
    bandMesh.rotation.z = Math.PI * 0.05
    bandMesh.position.set(0, 0.08, -0.05)
    headPivot.add(bandMesh)

    const earPodGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.14, 28)
    const earPodL = new THREE.Mesh(earPodGeo, porcelainMat)
    earPodL.rotation.z = Math.PI / 2
    earPodL.position.set(-0.86, 0.04, 0)
    headPivot.add(earPodL)

    const earRingGeo = new THREE.TorusGeometry(0.22, 0.025, 16, 32)
    const earRingMat = new THREE.MeshStandardMaterial({
      color: amberPrimaryHex,
      emissive: amberPrimaryHex,
      emissiveIntensity: 0.9,
    })
    const earRingL = new THREE.Mesh(earRingGeo, earRingMat)
    earRingL.rotation.y = Math.PI / 2
    earRingL.position.set(-0.94, 0.04, 0)
    headPivot.add(earRingL)

    const earPodR = new THREE.Mesh(earPodGeo, porcelainMat)
    earPodR.rotation.z = Math.PI / 2
    earPodR.position.set(0.86, 0.04, 0)
    headPivot.add(earPodR)

    const earRingR = new THREE.Mesh(earRingGeo, earRingMat)
    earRingR.rotation.y = Math.PI / 2
    earRingR.position.set(0.94, 0.04, 0)
    headPivot.add(earRingR)

    // Antenna & Top Signal Beacon
    const stalkGeo = new THREE.CylinderGeometry(0.02, 0.035, 0.42, 16)
    const stalkMesh = new THREE.Mesh(stalkGeo, trimMat)
    stalkMesh.position.set(0, 0.92, -0.06)
    stalkMesh.rotation.x = -0.16
    headPivot.add(stalkMesh)

    const orbGeo = new THREE.SphereGeometry(0.12, 24, 24)
    const orbMat = new THREE.MeshStandardMaterial({
      color: amberBrightHex,
      emissive: amberBrightHex,
      emissiveIntensity: 1.4,
    })
    const orbMesh = new THREE.Mesh(orbGeo, orbMat)
    orbMesh.position.set(0, 1.14, -0.1)
    headPivot.add(orbMesh)
    antennaOrbRef.current = orbMesh

    // --- C. Floating Magnetic Hands & Studio Stylus Tool ---
    const handGeo = new THREE.SphereGeometry(0.18, 24, 24)
    handGeo.scale(1.0, 0.85, 1.1)

    // Left Floating Hand (Support & Wave)
    const leftHand = new THREE.Group()
    leftHand.position.set(-1.18, 0.05, 0.3)
    const leftHandMesh = new THREE.Mesh(handGeo, porcelainMat)
    leftHand.add(leftHandMesh)
    mascotRoot.add(leftHand)
    leftHandRef.current = leftHand

    // Right Floating Hand Holding Digital Creative Stylus
    const rightHand = new THREE.Group()
    rightHand.position.set(1.18, 0.05, 0.3)
    const rightHandMesh = new THREE.Mesh(handGeo, porcelainMat)
    rightHand.add(rightHandMesh)

    // Digital Creative Stylus / Pen
    const stylusGroup = new THREE.Group()
    stylusGroup.rotation.x = Math.PI / 3
    stylusGroup.rotation.z = -Math.PI / 6
    stylusGroup.position.set(0.05, 0.1, 0.1)

    const penBodyGeo = new THREE.CylinderGeometry(0.035, 0.03, 0.65, 16)
    const penBody = new THREE.Mesh(penBodyGeo, trimMat)
    stylusGroup.add(penBody)

    const penTipGeo = new THREE.ConeGeometry(0.035, 0.12, 16)
    const penTipMat = new THREE.MeshStandardMaterial({
      color: amberBrightHex,
      emissive: amberBrightHex,
      emissiveIntensity: 1.8,
    })
    const penTip = new THREE.Mesh(penTipGeo, penTipMat)
    penTip.position.y = 0.36
    stylusGroup.add(penTip)
    stylusTipRef.current = penTip

    rightHand.add(stylusGroup)
    mascotRoot.add(rightHand)
    rightHandRef.current = rightHand

    // --- D. Floating 3D Holographic Social Badges (Replacing Dark Puck Pedestals) ---
    const badgeCapsules: THREE.Group[] = []
    SOCIAL_OPTIONS.forEach((opt) => {
      const capsuleGroup = new THREE.Group()
      capsuleGroup.position.set(...opt.position3D)

      // Outer Glowing Translucent Gem/Glass Capsule
      const outerGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.1, 32)
      const outerMesh = new THREE.Mesh(outerGeo, capsuleGlassMat)
      outerMesh.rotation.x = Math.PI / 5
      capsuleGroup.add(outerMesh)

      // Inner Glowing Core (Unique Icon Shape)
      const coreGeo = new THREE.OctahedronGeometry(0.12, 0)
      const coreMat = new THREE.MeshStandardMaterial({
        color: opt.id === activeOptionId ? amberBrightHex : eyeGlowHex,
        emissive: opt.id === activeOptionId ? amberBrightHex : eyeGlowHex,
        emissiveIntensity: opt.id === activeOptionId ? 1.4 : 0.4,
      })
      const coreMesh = new THREE.Mesh(coreGeo, coreMat)
      capsuleGroup.add(coreMesh)

      // Orbiting Holographic Light Ring
      const auraRingGeo = new THREE.TorusGeometry(0.34, 0.016, 16, 32)
      const auraRingMat = new THREE.MeshBasicMaterial({
        color: opt.id === activeOptionId ? amberBrightHex : eyeGlowHex,
        transparent: true,
        opacity: 0.75,
      })
      const auraRing = new THREE.Mesh(auraRingGeo, auraRingMat)
      auraRing.rotation.x = Math.PI / 3
      capsuleGroup.add(auraRing)

      scene.add(capsuleGroup)
      badgeCapsules.push(capsuleGroup)
    })
    badgeCapsulesRef.current = badgeCapsules

    // --- E. Dynamic Stylus Energy Beam ---
    const beamCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.2, 0.2, 0.4),
      new THREE.Vector3(0, 0.8, 0.8),
      new THREE.Vector3(-2.6, 1.35, 0.4),
    ])
    const beamGeo = new THREE.BufferGeometry().setFromPoints(beamCurve.getPoints(24))
    const beamMat = new THREE.LineBasicMaterial({
      color: amberBrightHex,
      transparent: true,
      opacity: 0.85,
    })
    const energyBeam = new THREE.Line(beamGeo, beamMat)
    scene.add(energyBeam)
    energyBeamRef.current = energyBeam

    // --- F. Ambient Constellation Particle Field ---
    const particleCount = 200
    const particlePositions = new Float32Array(particleCount * 3)
    const particleColors = new Float32Array(particleCount * 3)
    const colorAmber = new THREE.Color(amberPrimaryHex)
    const colorCyan = new THREE.Color(eyeGlowHex)
    const colorWhite = new THREE.Color(isDark ? 0xffffff : 0x64748b)

    for (let i = 0; i < particleCount; i++) {
      const radius = 3.2 + Math.random() * 4.2
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
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.85 : 0.55,
      blending: THREE.AdditiveBlending,
    })
    const starField = new THREE.Points(starGeo, starMat)
    scene.add(starField)

    // 5. Pointer Tracking Handler
    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
      targetMousePosRef.current = { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) }
    }

    container.addEventListener('pointermove', handlePointerMove)

    // 6. Blinking Animation State
    let blinkTimer = 0
    let nextBlinkInterval = 3.2
    let blinkProgress = 0

    // 7. Camera Keyframes for Scroll Narrative (Guiding through AutoCanvas Brand Story)
    const cameraKeyframes = [
      // Chapter 0: Autonomous Radar (Hero overview)
      { camPos: new THREE.Vector3(0, 0.45, 7.8), lookAt: new THREE.Vector3(0, 0.15, 0), mascotY: 0, mascotRotY: 0 },
      // Chapter 1: Multi-Tone Hooks (Focused discovery)
      { camPos: new THREE.Vector3(-1.7, 0.8, 6.4), lookAt: new THREE.Vector3(-0.35, 0.2, 0), mascotY: 0.12, mascotRotY: 0.32 },
      // Chapter 2: Vector Studio (Close creative inspection)
      { camPos: new THREE.Vector3(1.7, 0.35, 5.6), lookAt: new THREE.Vector3(0.3, 0.1, 0), mascotY: -0.08, mascotRotY: -0.35 },
      // Chapter 3: Cadence & Publishing (Elevated launch stance)
      { camPos: new THREE.Vector3(0, 1.8, 8.4), lookAt: new THREE.Vector3(0, 0.35, 0), mascotY: 0.22, mascotRotY: 0 },
    ]

    // 8. Master Animation & Render Loop
    const clock = new THREE.Clock()

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate)

      const delta = clock.getDelta()
      const elapsed = clock.getElapsedTime()

      // --- A. Smooth Cursor Interpolation ---
      mousePosRef.current.x += (targetMousePosRef.current.x - mousePosRef.current.x) * 0.08
      mousePosRef.current.y += (targetMousePosRef.current.y - mousePosRef.current.y) * 0.08
      const curX = mousePosRef.current.x
      const curY = mousePosRef.current.y

      // --- B. Smooth Scroll Progression Interpolation ---
      scrollProgressRef.current += (targetScrollProgressRef.current - scrollProgressRef.current) * 0.06
      const scrollT = scrollProgressRef.current

      const stageSegment = scrollT * 3
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
      mascotRoot.rotation.z = -curX * 0.07
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
        pupilL.position.x = -0.27 + curX * 0.06
        pupilL.position.y = 0.08 + curY * 0.05
        pupilR.position.x = 0.27 + curX * 0.06
        pupilR.position.y = 0.08 + curY * 0.05
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

      // --- G. Magnetic Hands & Stylus Pointer Kinematics ---
      if (leftHand && rightHand) {
        // Left hand stabilizes with soft floating motion
        leftHand.position.y = 0.05 + Math.sin(elapsed * 2.4 + 1.2) * 0.08
        leftHand.position.x = -1.18 + curX * 0.1
        leftHand.rotation.z = Math.sin(elapsed * 1.8) * 0.14

        // Right hand points the creative stylus toward mouse or target
        const targetHandX = 1.18 + curX * 0.35
        const targetHandY = 0.05 + curY * 0.4 + Math.sin(elapsed * 2.5) * 0.07
        rightHand.position.x += (targetHandX - rightHand.position.x) * 0.12
        rightHand.position.y += (targetHandY - rightHand.position.y) * 0.12
        rightHand.rotation.z = -0.3 + curX * 0.45
      }

      // --- H. Antenna Beacon Pulsation ---
      if (antennaOrbRef.current) {
        const pulse = 1 + Math.sin(elapsed * 5) * 0.15
        antennaOrbRef.current.scale.set(pulse, pulse, pulse)
      }

      // --- I. Floating Holographic Option Capsules Floating & Spin ---
      if (badgeCapsulesRef.current.length > 0) {
        badgeCapsulesRef.current.forEach((capsule, idx) => {
          const opt = SOCIAL_OPTIONS[idx]
          const isActive = opt.id === activeOptionId
          capsule.position.y = opt.position3D[1] + Math.sin(elapsed * 2.2 + idx * 1.1) * 0.09
          capsule.rotation.y += 0.018

          // Active capsule elevates and scales gracefully
          const targetScale = isActive ? 1.3 : 1.0
          capsule.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
        })
      }

      // --- J. Dynamic Energy Beam (Stylus Tip -> Active Option) ---
      if (energyBeamRef.current && target3DRef.current && rightHand) {
        const stylusPos = new THREE.Vector3()
        if (stylusTipRef.current) {
          stylusTipRef.current.getWorldPosition(stylusPos)
        } else {
          stylusPos.set(rightHand.position.x, rightHand.position.y, rightHand.position.z)
        }
        const targetPos = target3DRef.current
        const midPos = new THREE.Vector3(
          (stylusPos.x + targetPos.x) * 0.5,
          (stylusPos.y + targetPos.y) * 0.5 + 0.4,
          (stylusPos.z + targetPos.z) * 0.5
        )
        const curve = new THREE.CatmullRomCurve3([stylusPos, midPos, targetPos])
        energyBeamRef.current.geometry.setFromPoints(curve.getPoints(24))
      }

      // --- K. Starfield Constellation Drift ---
      starField.rotation.y = elapsed * 0.018

      renderer.render(scene, camera)
    }

    animate()

    // 9. Resize Observer
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return
      const newWidth = container.clientWidth
      const newHeight = container.clientHeight || 580
      cameraRef.current.aspect = newWidth / newHeight
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(newWidth, newHeight)
    }

    window.addEventListener('resize', handleResize)

    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize)
      container.removeEventListener('pointermove', handlePointerMove)

      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (rendererRef.current && rendererRef.current.domElement) {
        container.removeChild(rendererRef.current.domElement)
        rendererRef.current.dispose()
      }

      // Dispose Geometries
      torsoGeo.dispose()
      bellyGeo.dispose()
      beltGeo.dispose()
      emblemGeo.dispose()
      thrusterGeo.dispose()
      thrusterInnerGeo.dispose()
      helmetGeo.dispose()
      visorFrameGeo.dispose()
      visorGeo.dispose()
      eyeOuterGeo.dispose()
      pupilGeo.dispose()
      sparkleGeo.dispose()
      mouthGeo.dispose()
      bandGeo.dispose()
      earPodGeo.dispose()
      earRingGeo.dispose()
      stalkGeo.dispose()
      orbGeo.dispose()
      handGeo.dispose()
      penBodyGeo.dispose()
      penTipGeo.dispose()
      starGeo.dispose()

      // Dispose Materials
      amberArmorMat.dispose()
      porcelainMat.dispose()
      trimMat.dispose()
      visorMat.dispose()
      capsuleGlassMat.dispose()
      emblemMat.dispose()
      thrusterMat.dispose()
      eyeOuterMat.dispose()
      pupilMat.dispose()
      sparkleMat.dispose()
      mouthMat.dispose()
      earRingMat.dispose()
      orbMat.dispose()
      penTipMat.dispose()
      starMat.dispose()
    }
  }, [theme])

  // Select Option Handler
  const handleSelectOption = (opt: SocialOption) => {
    setActiveOptionId(opt.id)
    target3DRef.current = new THREE.Vector3(...opt.position3D)
    setInteractionCount((prev) => prev + 1)

    if (opt.id === 'cadence' || opt.id === 'omni') setMascotMood('launch')
    else if (opt.id === 'hook' || opt.id === 'radar') setMascotMood('focus')
    else if (opt.id === 'canvas') setMascotMood('creative')
    else setMascotMood('greeting')
  }

  // Chapter Jump Handler
  const handleSelectChapter = (idx: number) => {
    setCurrentChapter(idx)
    targetScrollProgressRef.current = idx / 3

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
                    ? 'border-brand-accent bg-surface shadow-lg shadow-brand-accent/10 translate-x-1 ring-1 ring-brand-accent/30'
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
                    ? 'border-brand-accent bg-surface shadow-lg shadow-brand-accent/10 -translate-x-1 ring-1 ring-brand-accent/30'
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
                  ? 'border-brand-accent bg-background shadow-xs ring-1 ring-brand-accent/40'
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

      {/* Bottom Floating Glass Pill Stepper (Synchronized with Page Scroll) */}
      <div className="p-3 sm:p-4 bg-surface/90 border-t border-border/80 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Floating Segmented Glass Pill Stepper */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-surface/95 border border-border shadow-xs overflow-x-auto max-w-full">
          {STORY_CHAPTERS.map((ch) => {
            const isActive = currentChapter === ch.index
            return (
              <button
                key={ch.index}
                onClick={() => handleSelectChapter(ch.index)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all shrink-0 ${
                  isActive
                    ? 'bg-brand-accent text-interactive-primary-fg font-bold shadow-2xs'
                    : 'text-foreground-secondary hover:text-foreground hover:bg-background-subtle'
                }`}
                title={ch.desc}
              >
                {isActive ? (
                  <Check className="w-3 h-3 stroke-[2.5]" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-border-strong" />
                )}
                <span className="hidden sm:inline">{ch.title}</span>
                <span className="sm:hidden">{ch.shortTitle}</span>
              </button>
            )
          })}
        </div>

        {/* Tactical Story Action & Quick Launch */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-foreground-muted font-mono">
            <RotateCcw className="w-3 h-3 text-brand-accent animate-spin-slow" />
            <span>Scroll page to fly camera</span>
          </div>

          {onExplore && (
            <button
              onClick={onExplore}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-interactive-primary text-interactive-primary-fg text-xs font-semibold hover:opacity-90 active:scale-98 transition-all shadow-md shrink-0"
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

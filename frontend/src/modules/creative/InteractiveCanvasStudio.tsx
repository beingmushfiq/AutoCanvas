import React, { useState, useRef, useEffect } from 'react'
import { Stage, Layer, Rect, Text, Group, Circle } from 'react-konva'
import {
  Download,
  RotateCcw,
  Move,
  Layers,
  Sparkles,
  Palette,
  Check,
  Maximize2,
  Copy,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cloud,
  UploadCloud,
  Loader2,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { apiClient } from '../../lib/api/client'

export interface CanvasLayerConfig {
  badge: {
    text: string
    x: number
    y: number
    fontSize: number
    textColor: string
    bgColor: string
  }
  headline: {
    text: string
    x: number
    y: number
    fontSize: number
    fontFamily: string
    fill: string
    width: number
    lineHeight: number
  }
  body: {
    text: string
    x: number
    y: number
    fontSize: number
    fill: string
    width: number
    lineHeight: number
  }
  cta: {
    text: string
    x: number
    y: number
    fontSize: number
    bgColor: string
    textColor: string
  }
  watermark: {
    text: string
    x: number
    y: number
    fontSize: number
    fill: string
  }
}

const PRESET_TEMPLATES: Record<
  string,
  {
    name: string
    desc: string
    bgGradient: [string, string]
    accentColor: string
    layers: CanvasLayerConfig
  }
> = {
  executive_slate: {
    name: 'Executive Editorial',
    desc: 'Deep obsidian backdrop with tactical typography',
    bgGradient: ['#090d16', '#1e293b'],
    accentColor: '#F59E0B',
    layers: {
      badge: {
        text: 'EXECUTIVE BRIEFING',
        x: 48,
        y: 48,
        fontSize: 12,
        textColor: '#090d16',
        bgColor: '#F59E0B',
      },
      headline: {
        text: 'The Autonomous Shift in Global Social Operations',
        x: 48,
        y: 110,
        fontSize: 32,
        fontFamily: 'Geist, sans-serif',
        fill: '#f8fafc',
        width: 384,
        lineHeight: 1.25,
      },
      body: {
        text: 'Organizations adopting deterministic brand governance and multi-agent synthesis achieve 4.2x higher audience velocity with zero compliance drift.',
        x: 48,
        y: 260,
        fontSize: 14,
        fill: '#94a3b8',
        width: 384,
        lineHeight: 1.5,
      },
      cta: {
        text: 'READ FULL REPORT ↗',
        x: 48,
        y: 380,
        fontSize: 11,
        bgColor: '#334155',
        textColor: '#f8fafc',
      },
      watermark: {
        text: 'AUTOCANVAS // OPERATIONS',
        x: 48,
        y: 430,
        fontSize: 10,
        fill: '#64748b',
      },
    },
  },
  kinetic_emerald: {
    name: 'Kinetic Signal',
    desc: 'High-contrast signal green on nocturnal black',
    bgGradient: ['#022c22', '#064e3b'],
    accentColor: '#10b981',
    layers: {
      badge: {
        text: 'LIVE SIGNAL ALERT',
        x: 48,
        y: 48,
        fontSize: 12,
        textColor: '#022c22',
        bgColor: '#10b981',
      },
      headline: {
        text: 'Real-Time Engagement Surge Detected',
        x: 48,
        y: 110,
        fontSize: 34,
        fontFamily: 'Geist, sans-serif',
        fill: '#ecfdf5',
        width: 384,
        lineHeight: 1.2,
      },
      body: {
        text: 'Algorithm telemetry indicates high affinity for technical breakdown carousels across developer communities.',
        x: 48,
        y: 250,
        fontSize: 14,
        fill: '#a7f3d0',
        width: 384,
        lineHeight: 1.5,
      },
      cta: {
        text: 'EXPLORE RADAR',
        x: 48,
        y: 380,
        fontSize: 11,
        bgColor: '#10b981',
        textColor: '#022c22',
      },
      watermark: {
        text: 'AUTOCANVAS TRENDS',
        x: 48,
        y: 430,
        fontSize: 10,
        fill: '#34d399',
      },
    },
  },
  bengali_bilingual: {
    name: 'Bilingual Editorial (বাংলা)',
    desc: 'Native Noto Sans Bengali typography & English metadata',
    bgGradient: ['#18181b', '#27272a'],
    accentColor: '#f59e0b',
    layers: {
      badge: {
        text: 'বিশেষ প্রতিবেদন',
        x: 48,
        y: 48,
        fontSize: 12,
        textColor: '#18181b',
        bgColor: '#f59e0b',
      },
      headline: {
        text: 'স্বায়ত্তশাসিত ব্র্যান্ড অপারেশন ও কৃত্রিম বুদ্ধিমত্তা',
        x: 48,
        y: 110,
        fontSize: 30,
        fontFamily: 'Noto Sans Bengali, sans-serif',
        fill: '#fafafa',
        width: 384,
        lineHeight: 1.35,
      },
      body: {
        text: 'AutoCanvas-এর মাল্টি-এজেন্ট ফ্রেমওয়ার্ক আপনার ব্র্যান্ডের প্রতিটি পোস্ট নিখুঁতভাবে তৈরি ও প্রকাশ করে।',
        x: 48,
        y: 260,
        fontSize: 14,
        fill: '#d4d4d8',
        width: 384,
        lineHeight: 1.6,
      },
      cta: {
        text: 'বিস্তারিত জানুন ↗',
        x: 48,
        y: 380,
        fontSize: 11,
        bgColor: '#f59e0b',
        textColor: '#18181b',
      },
      watermark: {
        text: 'AUTOCANVAS GLOBAL',
        x: 48,
        y: 430,
        fontSize: 10,
        fill: '#a1a1aa',
      },
    },
  },
}

type LayerKey = 'badge' | 'headline' | 'body' | 'cta' | 'watermark'

export const InteractiveCanvasStudio: React.FC = () => {
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('executive_slate')
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '1200:628' | '9:16'>('1:1')
  const [layers, setLayers] = useState<CanvasLayerConfig>(PRESET_TEMPLATES.executive_slate.layers)
  const [activeLayer, setActiveLayer] = useState<LayerKey>('headline')
  const [copiedNotification, setCopiedNotification] = useState(false)
  const [activeBrandId, setActiveBrandId] = useState<string | null>(null)
  const [savedDocId, setSavedDocId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [serverRendering, setServerRendering] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    apiClient.get<{ data: { id: string; name: string }[] }>('/brands')
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setActiveBrandId(res.data[0].id)
        }
      })
      .catch(() => {})
  }, [])

  // Canvas display dimensions
  const getCanvasDimensions = () => {
    switch (aspectRatio) {
      case '1200:628':
        return { width: 480, height: 251 }
      case '9:16':
        return { width: 360, height: 640 }
      case '1:1':
      default:
        return { width: 480, height: 480 }
    }
  }
  const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions()

  // Konva Stage reference for deterministic high-res PNG export
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stageRef = useRef<any>(null)

  const currentTemplate = PRESET_TEMPLATES[selectedTemplateKey]

  const handleSelectTemplate = (key: string) => {
    setSelectedTemplateKey(key)
    setLayers(JSON.parse(JSON.stringify(PRESET_TEMPLATES[key].layers)))
  }

  // Non-drag accessibility: nudge active layer by dx, dy
  const nudgeLayer = (dx: number, dy: number) => {
    setLayers((prev) => ({
      ...prev,
      [activeLayer]: {
        ...prev[activeLayer],
        x: Math.max(0, Math.min(canvasWidth - 20, prev[activeLayer].x + dx)),
        y: Math.max(0, Math.min(canvasHeight - 20, prev[activeLayer].y + dy)),
      },
    }))
  }

  // Keyboard navigation for canvas nudge
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)

      if (isInput) return

      const step = e.shiftKey ? 10 : 1
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        nudgeLayer(0, -step)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        nudgeLayer(0, step)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        nudgeLayer(-step, 0)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        nudgeLayer(step, 0)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeLayer, canvasWidth, canvasHeight])

  const handleExportPng = () => {
    if (!stageRef.current) return
    const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2.5 })
    const link = document.createElement('a')
    link.download = `autocanvas-${selectedTemplateKey}-${aspectRatio.replace(':', 'x')}-${Date.now()}.png`
    link.href = dataUrl
    link.click()
  }

  const handleCopyPng = async () => {
    if (!stageRef.current) return
    try {
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 })
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      setCopiedNotification(true)
      setTimeout(() => setCopiedNotification(false), 2000)
    } catch {
      handleExportPng()
    }
  }

  const handleSaveToCloud = async () => {
    if (!activeBrandId) {
      setStatusMessage('Please select or create an active brand first.')
      return
    }
    setSaving(true)
    try {
      if (savedDocId) {
        await apiClient.put(`/creatives/${savedDocId}`, {
          name: layers.headline.text || 'Canvas Design',
          layers,
          template_id: selectedTemplateKey,
          aspect_ratio: aspectRatio,
          width: canvasWidth * 2,
          height: canvasHeight * 2,
        })
        setStatusMessage('Design updated in cloud.')
      } else {
        const res = await apiClient.post<{ data: { id: string } }>(`/brands/${activeBrandId}/creatives`, {
          name: layers.headline.text || 'Canvas Design',
          layers,
          template_id: selectedTemplateKey,
          aspect_ratio: aspectRatio,
          width: canvasWidth * 2,
          height: canvasHeight * 2,
        })
        if (res.data?.id) {
          setSavedDocId(res.data.id)
        }
        setStatusMessage('Saved to brand creative library.')
      }
      setTimeout(() => setStatusMessage(null), 3500)
    } catch (err: any) {
      setStatusMessage('Save failed: ' + (err.message || 'Error'))
    } finally {
      setSaving(false)
    }
  }

  const handleServerRender = async () => {
    if (!activeBrandId) {
      setStatusMessage('Please select or create an active brand first.')
      return
    }
    setServerRendering(true)
    try {
      let docId = savedDocId
      if (!docId) {
        const createRes = await apiClient.post<{ data: { id: string } }>(`/brands/${activeBrandId}/creatives`, {
          name: layers.headline.text || 'Canvas Design',
          layers,
          template_id: selectedTemplateKey,
          aspect_ratio: aspectRatio,
          width: canvasWidth * 2,
          height: canvasHeight * 2,
        })
        docId = createRes.data?.id
        setSavedDocId(docId)
      }

      const res = await apiClient.post<{ data: { rendered_asset_url: string; render_engine: string } }>(`/creatives/${docId}/render`)
      if (res.data?.rendered_asset_url) {
        setStatusMessage(`Rendered via ${res.data.render_engine}! Opening asset...`)
        window.open(res.data.rendered_asset_url, '_blank')
      }
      setTimeout(() => setStatusMessage(null), 4000)
    } catch (err: any) {
      setStatusMessage('Server render failed: ' + err.message)
    } finally {
      setServerRendering(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Studio Header & Operational Context */}
      <div className="flex flex-wrap items-center justify-between bg-surface p-5 rounded-2xl border border-border shadow-2xs gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-pulse" />
            <h2 className="text-base font-bold text-foreground">
              Creative Studio — Interactive Canvas Editor
            </h2>
            <Badge variant="success">
              React Konva MIT Core
            </Badge>
            {savedDocId && (
              <Badge variant="outline" className="border-border text-foreground-secondary text-xs">
                <Cloud className="w-3 h-3 mr-1 text-brand-accent" />
                Cloud Synced
              </Badge>
            )}
          </div>
          <p className="text-xs text-foreground-secondary mt-1">
            Permissively licensed interactive design studio with drag-and-drop layer manipulation, non-drag keyboard controls, bilingual typography, and 2.5x retina rasterization.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveToCloud}
            disabled={saving}
            className="gap-1.5"
            title="Save design layers to brand creative library"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <UploadCloud className="w-3.5 h-3.5" />
            )}
            <span>{savedDocId ? 'Update Cloud' : 'Save Design'}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleServerRender}
            disabled={serverRendering}
            className="gap-1.5"
            title="Render via server Playwright/SVG engine"
          >
            {serverRendering ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
            )}
            <span>Server Render</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleCopyPng}
            className="gap-1.5"
          >
            {copiedNotification ? (
              <>
                <Check className="w-3.5 h-3.5 text-status-success" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy PNG</span>
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={handleExportPng}
            className="gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export High-Res PNG</span>
          </Button>
        </div>
      </div>

      {statusMessage && (
        <div
          role="status"
          className="p-3.5 rounded-xl border border-brand-accent/30 bg-brand-accent/10 text-foreground text-xs flex items-center justify-between shadow-2xs"
        >
          <span>{statusMessage}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-foreground-secondary hover:text-foreground text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Studio Grid: 3-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Preset Templates & Ratio Selector (3 Cols) */}
        <div className="xl:col-span-3 space-y-4">
          {/* Template Selection */}
          <div className="bg-surface p-4 rounded-2xl border border-border space-y-3 shadow-2xs">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-brand-accent" />
              <span>Aesthetic Templates</span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(PRESET_TEMPLATES).map(([key, tpl]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectTemplate(key)}
                  className={`p-3 text-left rounded-xl border transition-all outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring ${
                    selectedTemplateKey === key
                      ? 'border-brand-accent bg-background-subtle font-semibold shadow-2xs'
                      : 'border-border hover:border-border-strong bg-surface text-foreground-secondary'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{tpl.name}</span>
                    <div
                      className="w-4 h-4 rounded-full border border-border"
                      style={{ backgroundColor: tpl.accentColor }}
                    />
                  </div>
                  <p className="text-[11px] text-foreground-secondary mt-0.5">{tpl.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio Switcher (3 Approved Presets) */}
          <div className="bg-surface p-4 rounded-2xl border border-border space-y-2 shadow-2xs">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-brand-accent" />
              <span>Canvas Format Presets</span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: '1:1', label: '1080 × 1080', sub: 'Instagram / FB Square' },
                { id: '1200:628', label: '1200 × 628', sub: 'LinkedIn / Twitter Landscape' },
                { id: '9:16', label: '1080 × 1920', sub: 'Story / Reel Vertical' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setAspectRatio(r.id as any)}
                  className={`p-2.5 rounded-xl text-left border transition-all outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring ${
                    aspectRatio === r.id
                      ? 'border-brand-accent bg-interactive-primary text-interactive-primary-fg font-semibold shadow-2xs'
                      : 'border-border text-foreground-secondary hover:bg-surface-raised hover:text-foreground'
                  }`}
                >
                  <div className="text-xs font-bold font-mono">{r.label}</div>
                  <div className="text-[10px] opacity-80">{r.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Accessible Layer Tree Outline */}
          <div className="bg-surface p-4 rounded-2xl border border-border space-y-2 shadow-2xs" role="region" aria-label="Layer Tree Outline">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-brand-accent" />
              <span>Canvas Layer Stack</span>
            </label>
            <div className="space-y-1">
              {(['badge', 'headline', 'body', 'cta', 'watermark'] as const).map((layerKey) => (
                <button
                  key={layerKey}
                  type="button"
                  onClick={() => setActiveLayer(layerKey)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring ${
                    activeLayer === layerKey
                      ? 'bg-background-subtle font-semibold text-foreground border border-brand-accent'
                      : 'hover:bg-background-subtle text-foreground-secondary border border-transparent'
                  }`}
                >
                  <span className="capitalize">{layerKey}</span>
                  <span className="text-[10px] text-foreground-muted font-mono">
                    ({layers[layerKey].x}, {layers[layerKey].y})
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center Column: Live Interactive Konva Stage Canvas (6 Cols) */}
        <div className="xl:col-span-6 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs text-foreground-secondary mb-2 px-1">
            <span className="flex items-center gap-1">
              <Move className="w-3.5 h-3.5 text-brand-accent" />
              <span>Drag & drop or use arrow keys to micro-nudge (Shift for 10px)</span>
            </span>
            <span className="font-mono text-[11px]">
              {canvasWidth} × {canvasHeight}px
            </span>
          </div>

          {/* Konva Stage Container with tactical border & drop-shadow */}
          <div
            tabIndex={0}
            role="application"
            aria-label="Interactive Graphic Canvas. Use Arrow keys to nudge the active layer."
            className="rounded-2xl overflow-hidden shadow-2xl border border-border bg-black flex items-center justify-center outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
            style={{ width: canvasWidth, height: canvasHeight }}
          >
            <Stage ref={stageRef} width={canvasWidth} height={canvasHeight}>
              <Layer>
                {/* Canvas Background Fill & Gradient */}
                <Rect
                  x={0}
                  y={0}
                  width={canvasWidth}
                  height={canvasHeight}
                  fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                  fillLinearGradientEndPoint={{ x: canvasWidth, y: canvasHeight }}
                  fillLinearGradientColorStops={[
                    0,
                    currentTemplate.bgGradient[0],
                    1,
                    currentTemplate.bgGradient[1],
                  ]}
                />

                {/* Decorative Subtle Accent Circle in Background */}
                <Circle
                  x={canvasWidth - 60}
                  y={80}
                  radius={120}
                  fill={currentTemplate.accentColor}
                  opacity={0.06}
                />

                {/* Badge Pill Group (Draggable) */}
                <Group
                  x={layers.badge.x}
                  y={layers.badge.y}
                  draggable
                  onClick={() => setActiveLayer('badge')}
                  onDragEnd={(e) => {
                    setLayers({
                      ...layers,
                      badge: {
                        ...layers.badge,
                        x: Math.round(e.target.x()),
                        y: Math.round(e.target.y()),
                      },
                    })
                  }}
                >
                  <Rect
                    width={layers.badge.text.length * 7.5 + 24}
                    height={26}
                    fill={layers.badge.bgColor}
                    cornerRadius={13}
                  />
                  <Text
                    text={layers.badge.text}
                    x={12}
                    y={7}
                    fontSize={layers.badge.fontSize}
                    fontFamily="Geist Mono, monospace"
                    fontStyle="bold"
                    fill={layers.badge.textColor}
                  />
                </Group>

                {/* Headline Text (Draggable) */}
                <Text
                  x={layers.headline.x}
                  y={layers.headline.y}
                  text={layers.headline.text}
                  fontSize={layers.headline.fontSize}
                  fontFamily={layers.headline.fontFamily}
                  fontStyle="bold"
                  fill={layers.headline.fill}
                  width={layers.headline.width}
                  lineHeight={layers.headline.lineHeight}
                  draggable
                  onClick={() => setActiveLayer('headline')}
                  onDragEnd={(e) => {
                    setLayers({
                      ...layers,
                      headline: {
                        ...layers.headline,
                        x: Math.round(e.target.x()),
                        y: Math.round(e.target.y()),
                      },
                    })
                  }}
                />

                {/* Body / Takeaway Text (Draggable) */}
                <Text
                  x={layers.body.x}
                  y={layers.body.y}
                  text={layers.body.text}
                  fontSize={layers.body.fontSize}
                  fontFamily="Geist, sans-serif"
                  fill={layers.body.fill}
                  width={layers.body.width}
                  lineHeight={layers.body.lineHeight}
                  draggable
                  onClick={() => setActiveLayer('body')}
                  onDragEnd={(e) => {
                    setLayers({
                      ...layers,
                      body: {
                        ...layers.body,
                        x: Math.round(e.target.x()),
                        y: Math.round(e.target.y()),
                      },
                    })
                  }}
                />

                {/* Call To Action Button Tag (Draggable) */}
                <Group
                  x={layers.cta.x}
                  y={layers.cta.y}
                  draggable
                  onClick={() => setActiveLayer('cta')}
                  onDragEnd={(e) => {
                    setLayers({
                      ...layers,
                      cta: {
                        ...layers.cta,
                        x: Math.round(e.target.x()),
                        y: Math.round(e.target.y()),
                      },
                    })
                  }}
                >
                  <Rect
                    width={layers.cta.text.length * 8 + 28}
                    height={28}
                    fill={layers.cta.bgColor}
                    cornerRadius={8}
                  />
                  <Text
                    text={layers.cta.text}
                    x={14}
                    y={8}
                    fontSize={layers.cta.fontSize}
                    fontFamily="Geist Mono, monospace"
                    fontStyle="bold"
                    fill={layers.cta.textColor}
                  />
                </Group>

                {/* Brand Watermark / Metadata (Draggable) */}
                <Text
                  x={layers.watermark.x}
                  y={layers.watermark.y}
                  text={layers.watermark.text}
                  fontSize={layers.watermark.fontSize}
                  fontFamily="Geist Mono, monospace"
                  fill={layers.watermark.fill}
                  letterSpacing={2}
                  draggable
                  onClick={() => setActiveLayer('watermark')}
                  onDragEnd={(e) => {
                    setLayers({
                      ...layers,
                      watermark: {
                        ...layers.watermark,
                        x: Math.round(e.target.x()),
                        y: Math.round(e.target.y()),
                      },
                    })
                  }}
                />
              </Layer>
            </Stage>
          </div>

          <div className="mt-4 flex items-center justify-between w-full max-w-[480px] text-[11px] text-foreground-muted">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
              <span>Direct DOM Canvas Rasterization • 0 SDK License Lock-in</span>
            </div>
            <span className="font-mono text-[10px]">AutoCanvas Studio v2.0</span>
          </div>
        </div>

        {/* Right Column: Numeric Property Inspector & Non-Drag Position Controls (3 Cols) */}
        <div className="xl:col-span-3 space-y-4">
          <div className="bg-surface p-4 rounded-2xl border border-border space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-brand-accent" />
                <span className="capitalize">{activeLayer} Properties</span>
              </label>
              <Badge variant="accent">Active</Badge>
            </div>

            {/* Non-Drag D-Pad Nudge Buttons */}
            <div>
              <span className="text-[11px] font-medium text-foreground-secondary block mb-1.5">
                Keyboard / Button Nudge
              </span>
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => nudgeLayer(0, -5)}
                  aria-label="Nudge Up 5px"
                  className="p-1.5 rounded-lg border border-border hover:bg-surface-raised text-foreground-secondary hover:text-foreground outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => nudgeLayer(-5, 0)}
                    aria-label="Nudge Left 5px"
                    className="p-1.5 rounded-lg border border-border hover:bg-surface-raised text-foreground-secondary hover:text-foreground outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-mono text-foreground-muted px-2">Nudge</span>
                  <button
                    type="button"
                    onClick={() => nudgeLayer(5, 0)}
                    aria-label="Nudge Right 5px"
                    className="p-1.5 rounded-lg border border-border hover:bg-surface-raised text-foreground-secondary hover:text-foreground outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => nudgeLayer(0, 5)}
                  aria-label="Nudge Down 5px"
                  className="p-1.5 rounded-lg border border-border hover:bg-surface-raised text-foreground-secondary hover:text-foreground outline-hidden focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Numeric Coordinates X and Y */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
              <div>
                <label className="block text-[11px] font-medium text-foreground-secondary mb-1">X Position</label>
                <Input
                  type="number"
                  value={layers[activeLayer].x}
                  onChange={(e) =>
                    setLayers({
                      ...layers,
                      [activeLayer]: {
                        ...layers[activeLayer],
                        x: Number(e.target.value),
                      },
                    })
                  }
                  className="text-xs h-8"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-foreground-secondary mb-1">Y Position</label>
                <Input
                  type="number"
                  value={layers[activeLayer].y}
                  onChange={(e) =>
                    setLayers({
                      ...layers,
                      [activeLayer]: {
                        ...layers[activeLayer],
                        y: Number(e.target.value),
                      },
                    })
                  }
                  className="text-xs h-8"
                />
              </div>
            </div>

            {/* Active Layer Specific Controls */}
            {activeLayer === 'headline' && (
              <div className="space-y-3 pt-2 border-t border-border">
                <div>
                  <label className="block text-[11px] font-medium text-foreground-secondary mb-1">
                    Headline Copy
                  </label>
                  <textarea
                    rows={3}
                    value={layers.headline.text}
                    onChange={(e) =>
                      setLayers({
                        ...layers,
                        headline: { ...layers.headline, text: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-surface text-foreground placeholder:text-foreground-muted outline-hidden focus:ring-2 focus:ring-focus-ring"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-foreground-secondary mb-1">
                    Font Size ({layers.headline.fontSize}px)
                  </label>
                  <input
                    type="range"
                    min={20}
                    max={48}
                    value={layers.headline.fontSize}
                    onChange={(e) =>
                      setLayers({
                        ...layers,
                        headline: { ...layers.headline, fontSize: Number(e.target.value) },
                      })
                    }
                    className="w-full accent-brand-accent"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-foreground-secondary mb-1">
                    Font Family
                  </label>
                  <select
                    value={layers.headline.fontFamily}
                    onChange={(e) =>
                      setLayers({
                        ...layers,
                        headline: { ...layers.headline, fontFamily: e.target.value },
                      })
                    }
                    className="w-full px-2 py-1.5 text-xs rounded-xl border border-border bg-surface text-foreground outline-hidden focus:ring-2 focus:ring-focus-ring"
                  >
                    <option value="Geist, sans-serif">Geist Sans (Latin)</option>
                    <option value="Noto Sans Bengali, sans-serif">Noto Sans Bengali (বাংলা)</option>
                    <option value="Geist Mono, monospace">Geist Mono (Code/Numbers)</option>
                  </select>
                </div>
              </div>
            )}

            {activeLayer === 'body' && (
              <div className="space-y-3 pt-2 border-t border-border">
                <div>
                  <label className="block text-[11px] font-medium text-foreground-secondary mb-1">
                    Body Copy
                  </label>
                  <textarea
                    rows={3}
                    value={layers.body.text}
                    onChange={(e) =>
                      setLayers({
                        ...layers,
                        body: { ...layers.body, text: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-surface text-foreground placeholder:text-foreground-muted outline-hidden focus:ring-2 focus:ring-focus-ring"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-foreground-secondary mb-1">
                    Font Size ({layers.body.fontSize}px)
                  </label>
                  <input
                    type="range"
                    min={11}
                    max={20}
                    value={layers.body.fontSize}
                    onChange={(e) =>
                      setLayers({
                        ...layers,
                        body: { ...layers.body, fontSize: Number(e.target.value) },
                      })
                    }
                    className="w-full accent-brand-accent"
                  />
                </div>
              </div>
            )}

            {activeLayer === 'badge' && (
              <div className="space-y-3 pt-2 border-t border-border">
                <div>
                  <label className="block text-[11px] font-medium text-foreground-secondary mb-1">
                    Badge Text
                  </label>
                  <Input
                    type="text"
                    value={layers.badge.text}
                    onChange={(e) =>
                      setLayers({
                        ...layers,
                        badge: { ...layers.badge, text: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-foreground-secondary mb-1">
                      Badge Background
                    </label>
                    <input
                      type="color"
                      value={layers.badge.bgColor}
                      onChange={(e) =>
                        setLayers({
                          ...layers,
                          badge: { ...layers.badge, bgColor: e.target.value },
                        })
                      }
                      className="w-full h-8 rounded border border-border bg-surface cursor-pointer p-0.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-foreground-secondary mb-1">
                      Text Color
                    </label>
                    <input
                      type="color"
                      value={layers.badge.textColor}
                      onChange={(e) =>
                        setLayers({
                          ...layers,
                          badge: { ...layers.badge, textColor: e.target.value },
                        })
                      }
                      className="w-full h-8 rounded border border-border bg-surface cursor-pointer p-0.5"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeLayer === 'cta' && (
              <div className="space-y-3 pt-2 border-t border-border">
                <div>
                  <label className="block text-[11px] font-medium text-foreground-secondary mb-1">
                    CTA Button Text
                  </label>
                  <Input
                    type="text"
                    value={layers.cta.text}
                    onChange={(e) =>
                      setLayers({
                        ...layers,
                        cta: { ...layers.cta, text: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-foreground-secondary mb-1">
                      CTA Background
                    </label>
                    <input
                      type="color"
                      value={layers.cta.bgColor}
                      onChange={(e) =>
                        setLayers({
                          ...layers,
                          cta: { ...layers.cta, bgColor: e.target.value },
                        })
                      }
                      className="w-full h-8 rounded border border-border bg-surface cursor-pointer p-0.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-foreground-secondary mb-1">
                      Text Color
                    </label>
                    <input
                      type="color"
                      value={layers.cta.textColor}
                      onChange={(e) =>
                        setLayers({
                          ...layers,
                          cta: { ...layers.cta, textColor: e.target.value },
                        })
                      }
                      className="w-full h-8 rounded border border-border bg-surface cursor-pointer p-0.5"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeLayer === 'watermark' && (
              <div className="space-y-3 pt-2 border-t border-border">
                <div>
                  <label className="block text-[11px] font-medium text-foreground-secondary mb-1">
                    Brand Watermark
                  </label>
                  <Input
                    type="text"
                    value={layers.watermark.text}
                    onChange={(e) =>
                      setLayers({
                        ...layers,
                        watermark: { ...layers.watermark, text: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => handleSelectTemplate(selectedTemplateKey)}
              className="flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground transition-colors pt-2 border-t border-border w-full justify-center"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Element Coordinates</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

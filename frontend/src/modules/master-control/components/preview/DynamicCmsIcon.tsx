import React from 'react'
import {
  Compass,
  Palette,
  Calendar,
  ShieldCheck,
  Share2,
  Zap,
  Layers,
  Sparkles,
  Check,
  CheckCircle2,
  Globe,
  Clock,
  Sliders,
  Award,
  Flame,
  ShieldAlert,
  type LucideProps,
} from 'lucide-react'

interface DynamicCmsIconProps extends LucideProps {
  name?: string
}

const ICON_MAP: Record<string, React.FC<LucideProps>> = {
  compass: Compass,
  palette: Palette,
  calendar: Calendar,
  shieldcheck: ShieldCheck,
  'shield-check': ShieldCheck,
  share2: Share2,
  share: Share2,
  zap: Zap,
  layers: Layers,
  sparkles: Sparkles,
  check: Check,
  checkcircle2: CheckCircle2,
  globe: Globe,
  clock: Clock,
  sliders: Sliders,
  award: Award,
  flame: Flame,
  shieldalert: ShieldAlert,
}

export const DynamicCmsIcon: React.FC<DynamicCmsIconProps> = ({ name, ...props }) => {
  if (!name) {
    return <Sparkles {...props} />
  }

  const normalized = name.toLowerCase().replace(/[^a-z0-9-]/g, '')
  const IconComponent = ICON_MAP[normalized] || Sparkles

  return <IconComponent {...props} />
}


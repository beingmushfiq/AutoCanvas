import type { Meta, StoryObj } from '@storybook/react'
import { EmptyState } from '../components/ui/empty-state'
import { Layers, Calendar, Plus } from 'lucide-react'

const meta: Meta<typeof EmptyState> = {
  title: 'Primitives/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof EmptyState>

export const NoBrandsConfigured: Story = {
  args: {
    icon: Layers,
    title: 'No Brands Configured Yet',
    description: 'Create your first brand profile to begin crawling RSS feeds, generating content pillars, and publishing to social channels.',
    action: {
      label: 'Create First Brand',
      onClick: () => alert('Create Brand Clicked'),
      icon: Plus,
    },
  },
}

export const EmptySchedule: Story = {
  args: {
    icon: Calendar,
    title: 'No Scheduled Publications',
    description: 'Your queue is empty for the next 7 days. Select a content opportunity from the Radar to draft a post.',
    action: {
      label: 'Explore Opportunities',
      onClick: () => alert('Explore Clicked'),
    },
  },
}

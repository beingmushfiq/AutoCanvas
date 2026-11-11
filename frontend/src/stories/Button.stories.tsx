import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '../components/ui/button'
import { Sparkles, ArrowRight, Trash2 } from 'lucide-react'

const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'outline', 'ghost', 'destructive', 'accent'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'icon'],
    },
    isLoading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Default: Story = {
  args: {
    children: 'Primary Action',
    variant: 'default',
  },
}

export const AccentAmber: Story = {
  args: {
    children: 'Editorial Accent',
    variant: 'accent',
    leftIcon: <Sparkles className="w-3.5 h-3.5" />,
  },
}

export const Secondary: Story = {
  args: {
    children: 'Secondary Surface',
    variant: 'secondary',
  },
}

export const Outline: Story = {
  args: {
    children: 'Outline Border',
    variant: 'outline',
  },
}

export const Destructive: Story = {
  args: {
    children: 'Emergency Stop',
    variant: 'destructive',
    leftIcon: <Trash2 className="w-3.5 h-3.5" />,
  },
}

export const WithRightIcon: Story = {
  args: {
    children: 'Continue Setup',
    variant: 'default',
    rightIcon: <ArrowRight className="w-3.5 h-3.5" />,
  },
}

export const LoadingState: Story = {
  args: {
    children: 'Generating Copy...',
    variant: 'default',
    isLoading: true,
  },
}

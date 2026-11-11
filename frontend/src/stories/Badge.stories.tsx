import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from '../components/ui/badge'

const meta: Meta<typeof Badge> = {
  title: 'Primitives/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'outline', 'success', 'warning', 'danger', 'accent'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Badge>

export const Success: Story = {
  args: {
    children: 'Published',
    variant: 'success',
  },
}

export const Warning: Story = {
  args: {
    children: 'Scheduled (24h)',
    variant: 'warning',
  },
}

export const Danger: Story = {
  args: {
    children: 'Dispatch Failed',
    variant: 'danger',
  },
}

export const AccentAmber: Story = {
  args: {
    children: 'High Confidence Signal',
    variant: 'accent',
  },
}

export const Default: Story = {
  args: {
    children: 'Draft Post',
    variant: 'default',
  },
}

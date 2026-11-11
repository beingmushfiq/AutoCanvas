import type { Meta, StoryObj } from '@storybook/react'
import { PublishingCalendar } from '../modules/publishing/PublishingCalendar'

const meta: Meta<typeof PublishingCalendar> = {
  title: 'Operations/PublishingCalendar',
  component: PublishingCalendar,
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof PublishingCalendar>

export const Default: Story = {
  render: () => (
    <div className="max-w-6xl mx-auto">
      <PublishingCalendar onNavigateToContent={() => console.log('Navigate to content')} />
    </div>
  ),
}


import type { Meta, StoryObj } from '@storybook/react'
import { OnboardingWizard } from '../modules/onboarding/OnboardingWizard'

const meta: Meta<typeof OnboardingWizard> = {
  title: 'Modules/OnboardingWizard',
  component: OnboardingWizard,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof OnboardingWizard>

export const InteractiveWizard: Story = {
  args: {
    isOpen: true,
    onComplete: () => alert('Onboarding Completed!'),
  },
}


import type { Meta, StoryObj } from '@storybook/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'

const meta: Meta<typeof Card> = {
  title: 'Primitives/Card',
  component: Card,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Card>

export const StandardCard: Story = {
  render: () => (
    <Card className="max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Autonomous Planning Cycle</CardTitle>
          <Badge variant="success">Active</Badge>
        </div>
        <CardDescription>
          Hourly scheduler analyzing brand knowledge bases and generating cross-platform content.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-3 rounded-xl bg-background-subtle border border-border-subtle text-xs font-mono space-y-1">
          <div className="flex justify-between text-foreground-secondary">
            <span>Next Run:</span>
            <span className="text-foreground">12:00:00 UTC</span>
          </div>
          <div className="flex justify-between text-foreground-secondary">
            <span>Lock Strategy:</span>
            <span className="text-foreground">Atomic Redis Lock</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <span className="text-[11px] text-foreground-muted">Worker PID: 4892</span>
        <Button variant="secondary" size="sm">
          Configure Trigger
        </Button>
      </CardFooter>
    </Card>
  ),
}

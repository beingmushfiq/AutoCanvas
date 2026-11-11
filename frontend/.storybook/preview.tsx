import React, { useEffect } from 'react'
import type { Preview } from '@storybook/react'
import '../src/index.css'

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#090d16' },
        { name: 'light', value: '#f8fafc' },
      ],
    },
  },
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for AutoCanvas components',
      defaultValue: 'dark',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'dark', title: 'Obsidian Dark' },
          { value: 'light', title: 'Clean Light' },
        ],
        showName: true,
      },
    },
    density: {
      name: 'Density',
      description: 'Density scale for AutoCanvas components',
      defaultValue: 'comfortable',
      toolbar: {
        icon: 'component',
        items: [
          { value: 'comfortable', title: 'Comfortable' },
          { value: 'compact', title: 'Compact' },
        ],
        showName: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || 'dark'
      const density = context.globals.density || 'comfortable'

      useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        document.documentElement.setAttribute('data-density', density)
      }, [theme, density])

      return (
        <div className="p-6 bg-background text-foreground font-sans antialiased min-h-screen">
          <Story />
        </div>
      )
    },
  ],
}

export default preview


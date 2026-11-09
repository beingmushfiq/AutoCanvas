import React from 'react'
import { AuthProvider } from './modules/auth/AuthContext'
import { AppShell } from './app/AppShell'

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}

export default App

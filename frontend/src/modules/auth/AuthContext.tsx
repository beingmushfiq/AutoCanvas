import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiClient } from '../../lib/api/client'

export interface UserProfile {
  id: string
  name: string
  email: string
  is_platform_admin: boolean
}

export interface ActiveOrganization {
  id: string
  name: string
  slug: string
  timezone: string
  role: string
  plan: string
}

export interface ActiveWorkspace {
  id: string
  name: string
  slug: string
  role: string
}

export interface OrgSummary {
  id: string
  name: string
  slug: string
  role: string
}

export interface WorkspaceSummary {
  id: string
  organization_id: string
  name: string
  slug: string
  role: string
}

interface AuthContextType {
  user: UserProfile | null
  activeOrg: ActiveOrganization | null
  activeWorkspace: ActiveWorkspace | null
  organizations: OrgSummary[]
  workspaces: WorkspaceSummary[]
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (token: string) => Promise<void>
  logout: () => void
  switchWorkspace: (workspaceId: string) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('autocanvas_token'))
  const [user, setUser] = useState<UserProfile | null>(null)
  const [activeOrg, setActiveOrg] = useState<ActiveOrganization | null>(null)
  const [activeWorkspace, setActiveWorkspace] = useState<ActiveWorkspace | null>(null)
  const [organizations, setOrganizations] = useState<OrgSummary[]>([])
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const refreshProfile = async () => {
    const currentToken = localStorage.getItem('autocanvas_token')
    if (!currentToken) {
      setUser(null)
      setActiveOrg(null)
      setActiveWorkspace(null)
      setIsLoading(false)
      return
    }

    try {
      const response = await apiClient.get<{
        success: boolean
        data: {
          user: UserProfile
          active_organization: ActiveOrganization | null
          active_workspace: ActiveWorkspace | null
          organizations: OrgSummary[]
          workspaces: WorkspaceSummary[]
        }
      }>('/auth/me')

      setUser(response.data.user)
      setActiveOrg(response.data.active_organization)
      setActiveWorkspace(response.data.active_workspace)
      setOrganizations(response.data.organizations)
      setWorkspaces(response.data.workspaces)

      if (response.data.active_workspace) {
        localStorage.setItem('autocanvas_workspace_id', response.data.active_workspace.id)
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
      localStorage.removeItem('autocanvas_token')
      setToken(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshProfile()
  }, [])

  const login = async (newToken: string) => {
    localStorage.setItem('autocanvas_token', newToken)
    setToken(newToken)
    await refreshProfile()
  }

  const logout = () => {
    localStorage.removeItem('autocanvas_token')
    localStorage.removeItem('autocanvas_workspace_id')
    setToken(null)
    setUser(null)
    setActiveOrg(null)
    setActiveWorkspace(null)
  }

  const switchWorkspace = async (workspaceId: string) => {
    try {
      await apiClient.post('/auth/switch-workspace', { workspace_id: workspaceId })
      localStorage.setItem('autocanvas_workspace_id', workspaceId)
      await refreshProfile()
    } catch (error) {
      console.error('Failed to switch workspace:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        activeOrg,
        activeWorkspace,
        organizations,
        workspaces,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        switchWorkspace,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}


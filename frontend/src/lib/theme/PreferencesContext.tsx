import React, { createContext, useContext, useState, useEffect } from 'react'

export type ThemeMode = 'dark' | 'light'
export type DensityMode = 'comfortable' | 'compact'
export type LanguageMode = 'en' | 'bn'
export type PersonaMode = 'business_owner' | 'agency_pro'

interface PreferencesContextType {
  theme: ThemeMode
  density: DensityMode
  language: LanguageMode
  persona: PersonaMode
  setTheme: (theme: ThemeMode) => void
  toggleTheme: (event?: React.MouseEvent | { clientX: number; clientY: number }) => void
  setDensity: (density: DensityMode) => void
  toggleDensity: () => void
  setLanguage: (lang: LanguageMode) => void
  setPersona: (persona: PersonaMode) => void
  togglePersona: () => void
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined)

const PREF_STORAGE_KEY = 'autocanvas_user_preferences'

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(`${PREF_STORAGE_KEY}_theme`)
    return (saved === 'light' || saved === 'dark') ? saved : 'light'
  })

  const [density, setDensityState] = useState<DensityMode>(() => {
    const saved = localStorage.getItem(`${PREF_STORAGE_KEY}_density`)
    return (saved === 'comfortable' || saved === 'compact') ? saved : 'comfortable'
  })

  const [language, setLanguageState] = useState<LanguageMode>(() => {
    const saved = localStorage.getItem(`${PREF_STORAGE_KEY}_lang`)
    return (saved === 'en' || saved === 'bn') ? saved : 'en'
  })

  const [persona, setPersonaState] = useState<PersonaMode>(() => {
    const saved = localStorage.getItem(`${PREF_STORAGE_KEY}_persona`)
    return (saved === 'business_owner' || saved === 'agency_pro') ? saved : 'agency_pro'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(`${PREF_STORAGE_KEY}_theme`, theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-density', density)
    localStorage.setItem(`${PREF_STORAGE_KEY}_density`, density)
  }, [density])

  const setTheme = (t: ThemeMode) => setThemeState(t)

  const toggleTheme = (event?: React.MouseEvent | { clientX: number; clientY: number }) => {
    const isAppearanceTransition =
      typeof document !== 'undefined' &&
      'startViewTransition' in document &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!isAppearanceTransition || !event) {
      setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
      return
    }

    const x = 'clientX' in event ? event.clientX : window.innerWidth / 2
    const y = 'clientY' in event ? event.clientY : 0
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    const transition = (document as any).startViewTransition(() => {
      setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
    })

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ]
      document.documentElement.animate(
        {
          clipPath: theme === 'dark' ? clipPath : [...clipPath].reverse(),
        },
        {
          duration: 450,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          pseudoElement: theme === 'dark' ? '::view-transition-new(root)' : '::view-transition-old(root)',
        }
      )
    })
  }

  const setDensity = (d: DensityMode) => setDensityState(d)
  const toggleDensity = () => setDensityState((prev) => (prev === 'comfortable' ? 'compact' : 'comfortable'))

  const setLanguage = (lang: LanguageMode) => {
    setLanguageState(lang)
    localStorage.setItem(`${PREF_STORAGE_KEY}_lang`, lang)
  }

  const setPersona = (p: PersonaMode) => {
    setPersonaState(p)
    localStorage.setItem(`${PREF_STORAGE_KEY}_persona`, p)
  }

  const togglePersona = () => {
    setPersonaState((prev) => (prev === 'agency_pro' ? 'business_owner' : 'agency_pro'))
  }

  return (
    <PreferencesContext.Provider
      value={{
        theme,
        density,
        language,
        persona,
        setTheme,
        toggleTheme,
        setDensity,
        toggleDensity,
        setLanguage,
        setPersona,
        togglePersona,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  )
}

export const usePreferences = (): PreferencesContextType => {
  const context = useContext(PreferencesContext)
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider')
  }
  return context
}


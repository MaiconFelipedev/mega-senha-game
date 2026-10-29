import type { Screen } from '../types'

export const NAVIGATION_STATE_KEY = 'senhaRapidaScreen'

const screenPaths: Record<Screen, string> = {
  home: '/',
  settings: '/partida/configuracao',
  preparation: '/partida',
  game: '/partida',
  results: '/partida/resultado',
  'how-to': '/como-jogar',
  history: '/historico',
  'training-settings': '/treinamento',
  training: '/treinamento/jogar',
  'training-results': '/treinamento/resultado',
  'training-history': '/treinamento/historico',
  online: '/online',
}

const stablePathScreens: Record<string, Screen> = {
  '/': 'home',
  '/partida/configuracao': 'settings',
  '/como-jogar': 'how-to',
  '/historico': 'history',
  '/treinamento': 'training-settings',
  '/treinamento/historico': 'training-history',
  '/online': 'online',
}

const screens = new Set<Screen>(Object.keys(screenPaths) as Screen[])

function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/'
  return pathname.replace(/\/+$/, '') || '/'
}

export function getScreenPath(screen: Screen): string {
  return screenPaths[screen]
}

export function isScreen(value: unknown): value is Screen {
  return typeof value === 'string' && screens.has(value as Screen)
}

export function getScreenFromPath(pathname: string): Screen {
  const path = normalizePath(pathname)
  const stableScreen = stablePathScreens[path]
  if (stableScreen) return stableScreen
  if (path.startsWith('/treinamento')) return 'training-settings'
  if (path.startsWith('/online')) return 'online'
  if (path.startsWith('/partida')) return 'settings'
  return 'home'
}

export function getScreenFromHistory(state: unknown, pathname: string): Screen {
  if (state && typeof state === 'object') {
    const candidate = (state as Record<string, unknown>)[NAVIGATION_STATE_KEY]
    if (isScreen(candidate)) return candidate
  }
  return getScreenFromPath(pathname)
}

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { loadHistory } from './lib/storage'
import { loadWordHistory } from './lib/wordHistory'

function startGame() {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /começar jogo/i }))
  fireEvent.click(screen.getByRole('button', { name: /iniciar partida/i }))
  act(() => vi.advanceTimersByTime(3_100))
  expect(screen.getByRole('button', { name: /voltar ao menu/i })).toBeInTheDocument()
}

describe('navegação e cancelamento de partida', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.history.replaceState(null, '', '/')
    vi.useFakeTimers()
    vi.spyOn(window.history, 'back').mockImplementation(() => undefined)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('cancela pelo botão, limpa o cronômetro e não registra a partida', () => {
    startGame()
    expect(loadWordHistory().usedIds).toHaveLength(1)
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval')

    fireEvent.click(screen.getByRole('button', { name: /voltar ao menu/i }))
    expect(screen.getByRole('dialog', { name: /deseja cancelar a partida/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /cancelar partida/i }))

    expect(screen.getByRole('heading', { name: /senha\s*rápida/i })).toBeInTheDocument()
    expect(loadHistory()).toEqual([])
    expect(loadWordHistory().usedIds).toHaveLength(1)
    expect(clearIntervalSpy).toHaveBeenCalled()
  })

  it('continua a mesma partida sem reiniciar pontuação ou cronômetro', () => {
    startGame()
    const currentWord = screen.getByRole('heading', { level: 1 }).textContent

    fireEvent.click(screen.getByRole('button', { name: /voltar ao menu/i }))
    act(() => vi.advanceTimersByTime(1_100))
    expect(screen.getByLabelText('59 segundos restantes')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /continuar jogando/i }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(currentWord ?? '')
    expect(screen.getByText('ACERTOS').parentElement).toHaveTextContent('0')
    expect(screen.getByLabelText('59 segundos restantes')).toBeInTheDocument()
  })

  it('intercepta o voltar do navegador e rearma a proteção ao continuar', () => {
    startGame()

    act(() => window.dispatchEvent(new PopStateEvent('popstate')))
    expect(screen.getByRole('dialog', { name: /deseja cancelar a partida/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /continuar jogando/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    act(() => window.dispatchEvent(new PopStateEvent('popstate')))
    expect(screen.getByRole('dialog', { name: /deseja cancelar a partida/i })).toBeInTheDocument()
  })

  it('não mostra confirmação quando não existe uma partida ativa', () => {
    render(<App />)
    act(() => window.dispatchEvent(new PopStateEvent('popstate')))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('seleção de categorias', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.history.replaceState(null, '', '/')
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('bloqueia a partida sem categoria e persiste uma seleção múltipla', () => {
    const firstRender = render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /configurações/i }))
    fireEvent.click(screen.getByRole('button', { name: /limpar seleção/i }))

    expect(screen.getByText('0 de 10 selecionadas')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /iniciar partida/i }))
    expect(screen.getByRole('alert')).toHaveTextContent('Selecione pelo menos uma categoria')

    fireEvent.click(screen.getByRole('button', { name: 'Animais' }))
    fireEvent.click(screen.getByRole('button', { name: 'Alimentos' }))
    expect(screen.getByText('2 de 10 selecionadas')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Animais' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Alimentos' })).toHaveAttribute('aria-pressed', 'true')

    firstRender.unmount()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /configurações/i }))
    expect(screen.getByText('2 de 10 selecionadas')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Animais' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Alimentos' })).toHaveAttribute('aria-pressed', 'true')
  })
})

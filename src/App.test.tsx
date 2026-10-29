import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { NAVIGATION_STATE_KEY } from './lib/navigation'
import { loadHistory } from './lib/storage'
import { loadWordHistory } from './lib/wordHistory'
import { loadTrainingWordHistory } from './lib/trainingStorage'

function startGame() {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /jogar presencialmente/i }))
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

describe('rotas do navegador', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    window.history.replaceState(null, '', '/')
  })

  afterEach(() => {
    cleanup()
  })

  it('registra as telas no endereço e restaura a tela anterior pelo histórico', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /modo treinamento/i }))
    expect(window.location.pathname).toBe('/treinamento')

    fireEvent.click(screen.getByRole('button', { name: /histórico de treino/i }))
    expect(window.location.pathname).toBe('/treinamento/historico')

    const previousState = { [NAVIGATION_STATE_KEY]: 'training-settings' }
    act(() => {
      window.history.replaceState(previousState, '', '/treinamento')
      window.dispatchEvent(new PopStateEvent('popstate', { state: previousState }))
    })

    expect(screen.getByRole('heading', { name: /modo treinamento/i })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/treinamento')
  })

  it('abre rotas públicas diretamente e recupera rotas de sessão sem estado', () => {
    window.history.replaceState(null, '', '/como-jogar')
    const directRoute = render(<App />)
    expect(screen.getByRole('heading', { name: /como jogar/i })).toBeInTheDocument()
    directRoute.unmount()

    window.history.replaceState(null, '', '/treinamento/jogar')
    render(<App />)
    expect(screen.getByRole('heading', { name: /modo treinamento/i })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/treinamento')
  })

  it('abre o modo online pelo menu e preserva o código do convite na URL', () => {
    const menu = render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /modo online/i }))
    expect(window.location.pathname).toBe('/online')
    menu.unmount()

    window.history.replaceState(null, '', '/online?sala=K7M4P9Q2')
    render(<App />)
    expect(window.location.pathname).toBe('/online')
    expect(window.location.search).toBe('?sala=K7M4P9Q2')
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
    expect(screen.getByText('2 de 10 selecionadas')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Animais' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Alimentos' })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('modo treinamento', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.history.replaceState(null, '', '/')
    vi.spyOn(Math, 'random').mockReturnValue(0)
    vi.spyOn(window.history, 'back').mockImplementation(() => undefined)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('apresenta dicas em sequência, aceita Enter e avança após o acerto', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /modo treinamento/i }))
    fireEvent.click(screen.getByRole('button', { name: /começar treinamento/i }))

    expect(screen.getByText('Animal')).toBeInTheDocument()
    expect(loadTrainingWordHistory().usedIds).toHaveLength(1)
    expect(loadWordHistory().usedIds).toHaveLength(0)
    expect(screen.getByText('Dica 1 de 4')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    expect(screen.getByRole('listitem', { name: 'Dica 1: Animal' })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('listitem', { name: 'Dica 2 bloqueada' })).toHaveTextContent('Aguardando dica')
    expect(screen.getByRole('listitem', { name: 'Dica 3 bloqueada' })).toHaveTextContent('Aguardando dica')
    expect(screen.getByRole('listitem', { name: 'Dica 4 bloqueada' })).toHaveTextContent('Aguardando dica')
    expect(screen.queryByText('Latido')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /outra dica/i }))
    expect(screen.getByText('Animal')).toBeInTheDocument()
    expect(screen.getByText('Latido')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    expect(screen.getByRole('listitem', { name: 'Dica 2: Latido' })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByText('Dica 2 de 4')).toBeInTheDocument()
    expect(screen.queryByText('Coleira')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /outra dica/i }))
    expect(screen.getByText('Animal')).toBeInTheDocument()
    expect(screen.getByText('Latido')).toBeInTheDocument()
    expect(screen.getByText('Coleira')).toBeInTheDocument()
    expect(screen.getByText('Dica 3 de 4')).toBeInTheDocument()
    expect(screen.queryByText('Canil')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /outra dica/i }))
    expect(screen.getByText('Animal')).toBeInTheDocument()
    expect(screen.getByText('Latido')).toBeInTheDocument()
    expect(screen.getByText('Coleira')).toBeInTheDocument()
    expect(screen.getByText('Canil')).toBeInTheDocument()
    expect(screen.getByText('Dica 4 de 4')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /outra dica/i })).toBeDisabled()

    const input = screen.getByLabelText(/qual é a palavra secreta/i)
    fireEvent.change(input, { target: { value: '  CACHORRO  ' } })
    fireEvent.submit(input.closest('form')!)

    expect(screen.getByText(/parabéns! você acertou/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'CACHORRO' })).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: /dicas recebidas/i })).not.toBeInTheDocument()
    expect(screen.getByText('dicas utilizadas').parentElement).toHaveTextContent('4 dicas utilizadas')
    fireEvent.click(screen.getByRole('button', { name: /próxima palavra/i }))
    expect(screen.getByLabelText(/qual é a palavra secreta/i)).toBeInTheDocument()
    expect(screen.getByText('Felino')).toBeInTheDocument()
    expect(screen.queryByText('Animal')).not.toBeInTheDocument()
    expect(screen.queryByText('Canil')).not.toBeInTheDocument()
  })

  it('mantém tentativas ilimitadas, revela ao pular e salva o resumo', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /modo treinamento/i }))
    fireEvent.click(screen.getByRole('button', { name: /começar treinamento/i }))

    const input = screen.getByLabelText(/qual é a palavra secreta/i)
    fireEvent.change(input, { target: { value: 'carro' } })
    fireEvent.click(screen.getByRole('button', { name: /responder/i }))
    expect(screen.getByText(/ainda não! tente novamente/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/qual é a palavra secreta/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /pular palavra/i }))
    expect(screen.getByText(/palavra pulada. continue aprendendo/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'CACHORRO' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /próxima palavra/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /encerrar treinamento/i }))
    fireEvent.click(screen.getByRole('button', { name: /finalizar e ver resumo/i }))

    expect(screen.getByRole('heading', { name: /resumo do treinamento/i })).toBeInTheDocument()
    expect(screen.getByText('Palavras puladas').parentElement).toHaveTextContent('1')
    expect(screen.getByText('Palpites incorretos').parentElement).toHaveTextContent('1')
  })

  it('abandona sem salvar e retorna às mesmas configurações do treinamento', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /modo treinamento/i }))
    fireEvent.click(screen.getByRole('button', { name: /difícil/i }))
    fireEvent.click(screen.getByRole('button', { name: /limpar seleção/i }))
    fireEvent.click(screen.getByRole('button', { name: /animais/i }))
    fireEvent.click(screen.getByRole('button', { name: /começar treinamento/i }))
    act(() => window.dispatchEvent(new PopStateEvent('popstate')))
    expect(screen.getByRole('dialog', { name: /encerrar treinamento/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /abandonar sem salvar/i }))

    expect(screen.getByRole('heading', { name: /modo treinamento/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /difícil/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /animais/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('1 de 10 selecionadas')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/treinamento')
    expect(loadHistory()).toEqual([])
  })
})

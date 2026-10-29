const nicknamePattern = /^[\p{L}\p{N}][\p{L}\p{N} ._-]*$/u
const roomCodePattern = /^[A-HJ-NP-Z2-9]{8}$/

export function sanitizeNickname(value: string): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, 24)
}

export function validateNickname(value: string): string | null {
  const nickname = sanitizeNickname(value)
  if (nickname.length < 2) return 'Use um apelido com pelo menos 2 caracteres.'
  if (!nicknamePattern.test(nickname)) return 'O apelido contém caracteres não permitidos.'
  return null
}

export function normalizeRoomCode(value: string): string {
  return value.toLocaleUpperCase('pt-BR').replace(/[^A-Z0-9]/g, '').slice(0, 8)
}

export function validateRoomCode(value: string): string | null {
  return roomCodePattern.test(normalizeRoomCode(value)) ? null : 'Digite o código de 8 caracteres da sala.'
}

export function normalizeOnlineText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
    .replace(/\s+/g, ' ')
}

export function validateHint(value: string, secretWord?: string | null): string | null {
  const hint = value.trim()
  if (!hint) return 'Digite uma dica.'
  if (hint.length > 32) return 'A dica pode ter no máximo 32 caracteres.'
  if (/\s/u.test(hint)) return 'Cada dica deve conter somente uma palavra.'

  if (secretWord) {
    const normalizedHint = normalizeOnlineText(hint)
    const normalizedSecret = normalizeOnlineText(secretWord)
    if (
      normalizedHint === normalizedSecret
      || (normalizedHint.length >= 4 && normalizedSecret.includes(normalizedHint))
      || (normalizedSecret.length >= 4 && normalizedHint.includes(normalizedSecret))
    ) {
      return 'A dica não pode revelar a resposta nem uma variação direta dela.'
    }
  }

  return null
}

export function validateGuess(value: string): string | null {
  const guess = value.trim()
  if (!guess) return 'Digite um palpite.'
  if (guess.length > 64) return 'O palpite pode ter no máximo 64 caracteres.'
  return null
}

export function createClientActionId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

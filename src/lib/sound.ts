type SoundName = 'correct' | 'wrong' | 'finish'

const soundPattern: Record<SoundName, Array<[frequency: number, delay: number, duration: number]>> = {
  correct: [[620, 0, 0.08], [880, 0.08, 0.12]],
  wrong: [[220, 0, 0.1], [150, 0.09, 0.16]],
  finish: [[440, 0, 0.1], [330, 0.12, 0.1], [220, 0.24, 0.2]],
}

let audioContext: AudioContext | null = null

export function playSound(name: SoundName, enabled: boolean): void {
  if (!enabled || typeof window === 'undefined' || !window.AudioContext) return

  audioContext ??= new window.AudioContext()
  const now = audioContext.currentTime

  for (const [frequency, delay, duration] of soundPattern[name]) {
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0.0001, now + delay)
    gain.gain.exponentialRampToValueAtTime(0.12, now + delay + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration)
    oscillator.connect(gain)
    gain.connect(audioContext.destination)
    oscillator.start(now + delay)
    oscillator.stop(now + delay + duration)
  }
}

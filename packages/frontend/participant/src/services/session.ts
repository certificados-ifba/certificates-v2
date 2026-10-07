const KEY = 'certificates.participant.session'

export const session = {
  get(): string | null {
    try {
      return sessionStorage.getItem(KEY)
    } catch {
      return null
    }
  },
  set(token: string): void {
    try {
      sessionStorage.setItem(KEY, token)
    } catch {}
  },
  clear(): void {
    try {
      sessionStorage.removeItem(KEY)
    } catch {}
  }
}

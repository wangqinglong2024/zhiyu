export type AuthView = 'login' | 'register' | 'forgot'

export interface AuthModalState {
  isOpen: boolean
  view: AuthView
  open: (view?: AuthView) => void
  close: () => void
  switchView: (view: AuthView) => void
}

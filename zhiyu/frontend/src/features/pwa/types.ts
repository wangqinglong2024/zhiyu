export interface PwaInstallState {
  canInstall: boolean
  isInstalled: boolean
}

export interface SwUpdateState {
  hasUpdate: boolean
  registration: ServiceWorkerRegistration | null
}

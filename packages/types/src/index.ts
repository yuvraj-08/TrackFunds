export type AppSurface = 'web' | 'backend' | 'mobile' | 'desktop'

export interface StarterCapability {
  id: string
  label: string
  status: 'ready' | 'planned'
  surface: AppSurface
}

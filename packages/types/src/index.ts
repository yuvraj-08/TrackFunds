export type AppSurface = 'web' | 'backend' | 'mobile' | 'desktop'

export interface StarterCapability {
  id: string
  label: string
  status: 'ready' | 'planned'
  surface: AppSurface
}

export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL'

export type TransactionSource = 'MANUAL' | 'SMS_IMPORT'

export interface AccountPermissionSet {
  canView: boolean
  canAddTransactions: boolean
  canEditTransactions: boolean
  canDeleteTransactions: boolean
  canManageParticipants: boolean
}

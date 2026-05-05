import type { AccountPermissionSet, TransactionSource, TransactionType } from '@trackfunds/types'

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/u, '') ?? 'http://localhost:4000'

export interface UserRecord {
  createdAt: string
  displayName: string
  email: string
  id: string
}

export interface AuthSession {
  accessToken: string
  refreshToken: string
  refreshTokenExpiresAt: string
  user: {
    displayName: string
    email: string
    id: string
  }
}

export interface AccountParticipantRecord extends AccountPermissionSet {
  accountId: string
  createdAt: string
  id: string
  updatedAt: string
  user: UserRecord
  userId: string
}

export interface AccountRecord {
  createdAt: string
  currencyCode: string
  id: string
  institution: string | null
  name: string
  owner: UserRecord
  ownerUserId: string
  participants: AccountParticipantRecord[]
  updatedAt: string
}

export interface OwnershipRecord {
  amount: string
  displayName: string
  ownerUserId: string
}

export interface DebtRecord {
  amount: string
  ownerDisplayName: string
  ownerUserId: string
  spentByUserId: string
}

export interface TransactionRecord {
  accountId: string
  amount: string
  createdAt: string
  id: string
  note: string | null
  occurredAt: string
  owner: UserRecord
  ownerUserId: string
  recordedBy: UserRecord
  recordedByUserId: string
  source: TransactionSource
  spentBy: UserRecord
  spentByUserId: string
  type: TransactionType
  updatedAt: string
}

export interface RequestPasswordResetResponse {
  delivery?: 'log-only' | 'smtp'
  expiresAt?: string
  message: string
  resetToken?: string
  resetUrl?: string
}

export interface ResetPasswordResponse {
  message: string
}

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED'

export interface InvitationRecord {
  id: string
  accountId: string
  email: string
  status: InvitationStatus
  canView: boolean
  canAddTransactions: boolean
  canEditTransactions: boolean
  canDeleteTransactions: boolean
  canManageParticipants: boolean
  expiresAt: string
  acceptedAt: string | null
  declinedAt: string | null
  createdAt: string
  invitedBy: UserRecord
  account: { id: string; name: string; currencyCode: string }
}

export interface InvitationPreview {
  id: string
  email: string
  accountId: string
  accountName: string
  accountCurrencyCode: string
  invitedByName: string
  expiresAt: string
  permissions: {
    canView: boolean
    canAddTransactions: boolean
    canEditTransactions: boolean
    canDeleteTransactions: boolean
    canManageParticipants: boolean
  }
}

export interface ApiErrorPayload {
  error?: string
  message?: string | string[]
  method?: string
  path?: string
  statusCode?: number
  timestamp?: string
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly payload: ApiErrorPayload | null,
  ) {
    super(message)
  }
}

type RequestOptions = {
  accessToken?: string
  body?: unknown
  method?: 'DELETE' | 'GET' | 'PATCH' | 'POST'
}

function getErrorMessage(payload: ApiErrorPayload | null, fallback: string) {
  if (!payload?.message) {
    return fallback
  }

  return Array.isArray(payload.message) ? payload.message.join('\n') : payload.message
}

export function createRequestExecutor(
  getAccessToken: () => string | null,
  refreshSession: () => Promise<void>,
) {
  const request = async <T>(
    path: string,
    options: RequestOptions = {},
    hasRetried = false,
  ): Promise<T> => {
    const accessToken = options.accessToken ?? getAccessToken()
    const response = await fetch(`${API_BASE_URL}${path}`, {
      body: options.body ? JSON.stringify(options.body) : undefined,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      method: options.method ?? 'GET',
    })

    if (response.status === 401 && accessToken && !hasRetried) {
      await refreshSession()
      return request<T>(path, options, true)
    }

    if (response.status === 204) {
      return undefined as T
    }

    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null

    if (!response.ok) {
      throw new ApiError(getErrorMessage(payload, 'Request failed.'), response.status, payload)
    }

    return payload as T
  }

  return {
    addParticipant: (accountId: string, body: { userId: string } & AccountPermissionSet) =>
      request<AccountParticipantRecord>(`/api/v1/accounts/${accountId}/participants`, {
        body,
        method: 'POST',
      }),
    createAccount: (body: {
      currencyCode?: string
      institution?: string
      name: string
    }) =>
      request<AccountRecord>('/api/v1/accounts', {
        body,
        method: 'POST',
      }),
    createTransaction: (
      accountId: string,
      body: {
        amount: string
        note?: string
        occurredAt: string
        ownerUserId: string
        source: TransactionSource
        spentByUserId: string
        type: TransactionType
      },
    ) =>
      request<TransactionRecord>(`/api/v1/accounts/${accountId}/transactions`, {
        body,
        method: 'POST',
      }),
    deleteAccount: (accountId: string) =>
      request<{ accountId: string; message: string }>(`/api/v1/accounts/${accountId}`, {
        method: 'DELETE',
      }),
    deleteTransaction: (accountId: string, transactionId: string) =>
      request<{ message: string; transactionId: string }>(
        `/api/v1/accounts/${accountId}/transactions/${transactionId}`,
        {
          method: 'DELETE',
        },
      ),
    getAccount: (accountId: string) => request<AccountRecord>(`/api/v1/accounts/${accountId}`),
    getDebts: (accountId: string) => request<DebtRecord[]>(`/api/v1/accounts/${accountId}/debts`),
    getOwnership: (accountId: string) =>
      request<OwnershipRecord[]>(`/api/v1/accounts/${accountId}/ownership`),
    getTransaction: (accountId: string, transactionId: string) =>
      request<TransactionRecord>(`/api/v1/accounts/${accountId}/transactions/${transactionId}`),
    listAccounts: () => request<AccountRecord[]>('/api/v1/accounts'),
    listParticipants: (accountId: string) =>
      request<AccountParticipantRecord[]>(`/api/v1/accounts/${accountId}/participants`),
    listTransactions: (accountId: string) =>
      request<TransactionRecord[]>(`/api/v1/accounts/${accountId}/transactions`),
    listUsers: () => request<UserRecord[]>('/api/v1/users'),
    removeParticipant: (accountId: string, participantId: string) =>
      request<{ message: string; participantId: string }>(
        `/api/v1/accounts/${accountId}/participants/${participantId}`,
        {
          method: 'DELETE',
        },
      ),
    request,
    requestPasswordReset: (email: string) =>
      request<RequestPasswordResetResponse>('/api/v1/auth/forgot-password', {
        body: { email },
        method: 'POST',
      }),
    resetPassword: (body: { newPassword: string; token: string }) =>
      request<ResetPasswordResponse>('/api/v1/auth/reset-password', {
        body,
        method: 'POST',
      }),
    signIn: (body: { email: string; password: string }) =>
      request<AuthSession>('/api/v1/auth/login', {
        body,
        method: 'POST',
      }),
    signUp: (body: { displayName: string; email: string; password: string }) =>
      request<AuthSession>('/api/v1/auth/register', {
        body,
        method: 'POST',
      }),
    updateAccount: (
      accountId: string,
      body: {
        currencyCode?: string
        institution?: string
        name?: string
      },
    ) =>
      request<AccountRecord>(`/api/v1/accounts/${accountId}`, {
        body,
        method: 'PATCH',
      }),
    updateParticipant: (
      accountId: string,
      participantId: string,
      body: Partial<AccountPermissionSet>,
    ) =>
      request<AccountParticipantRecord>(
        `/api/v1/accounts/${accountId}/participants/${participantId}`,
        {
          body,
          method: 'PATCH',
        },
      ),
    createInvitation: (
      accountId: string,
      body: {
        email: string
        canView?: boolean
        canAddTransactions?: boolean
        canEditTransactions?: boolean
        canDeleteTransactions?: boolean
        canManageParticipants?: boolean
      },
    ) =>
      request<InvitationRecord & { code: string }>(
        `/api/v1/accounts/${accountId}/invitations`,
        { body, method: 'POST' },
      ),
    listInvitations: (accountId: string) =>
      request<InvitationRecord[]>(`/api/v1/accounts/${accountId}/invitations`),
    resendInvitation: (accountId: string, invitationId: string) =>
      request<{ invitationId: string; message: string }>(
        `/api/v1/accounts/${accountId}/invitations/${invitationId}/resend`,
        { method: 'POST' },
      ),
    cancelInvitation: (accountId: string, invitationId: string) =>
      request<{ invitationId: string; message: string }>(
        `/api/v1/accounts/${accountId}/invitations/${invitationId}`,
        { method: 'DELETE' },
      ),
    lookupInvitation: (code: string) =>
      request<InvitationPreview>('/api/v1/invitations/lookup', {
        body: { code },
        method: 'POST',
      }),
    acceptInvitation: (code: string) =>
      request<AccountRecord>('/api/v1/invitations/accept', {
        body: { code },
        method: 'POST',
      }),
    declineInvitation: (code: string) =>
      request<{ message: string }>('/api/v1/invitations/decline', {
        body: { code },
        method: 'POST',
      }),
    updateTransaction: (
      accountId: string,
      transactionId: string,
      body: Partial<{
        amount: string
        note?: string
        occurredAt: string
        ownerUserId: string
        source: TransactionSource
        spentByUserId: string
        type: TransactionType
      }>,
    ) =>
      request<TransactionRecord>(`/api/v1/accounts/${accountId}/transactions/${transactionId}`, {
        body,
        method: 'PATCH',
      }),
  }
}

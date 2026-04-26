import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const KEY_LENGTH = 64

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, KEY_LENGTH).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, originalHash] = storedHash.split(':')

  if (!salt || !originalHash) {
    return false
  }

  const candidateHash = scryptSync(password, salt, KEY_LENGTH)
  const originalHashBuffer = Buffer.from(originalHash, 'hex')

  if (candidateHash.byteLength !== originalHashBuffer.byteLength) {
    return false
  }

  return timingSafeEqual(candidateHash, originalHashBuffer)
}

export function generateResetToken() {
  return randomBytes(32).toString('hex')
}

export function hashResetToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function generateSessionToken() {
  return randomBytes(48).toString('hex')
}

export function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

// Invite codes — 8 chars from an unambiguous alphabet (no 0/O/1/I)
const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateInviteCode(): string {
  const bytes = randomBytes(8)
  return Array.from(bytes)
    .map((b) => INVITE_ALPHABET[b % INVITE_ALPHABET.length])
    .join('')
}

export function hashInviteCode(code: string): string {
  return createHash('sha256').update(code.toUpperCase()).digest('hex')
}

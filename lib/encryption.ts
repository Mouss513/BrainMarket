import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

// ============================================================
// AES-256-GCM encryption for storing tokens securely
// Format: iv:authTag:ciphertext (all base64)
// ============================================================

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error('ENCRYPTION_KEY is not set')
  // Accept hex (64 chars) or base64 (44 chars) keys
  if (key.length === 64) return Buffer.from(key, 'hex')
  if (key.length === 44) return Buffer.from(key, 'base64')
  throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex chars or 44 base64 chars)')
}

export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })

  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  const authTag = cipher.getAuthTag()

  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`
}

export function decrypt(encryptedString: string): string {
  const key = getKey()
  const parts = encryptedString.split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted string format')

  const iv = Buffer.from(parts[0], 'base64')
  const authTag = Buffer.from(parts[1], 'base64')
  const encrypted = parts[2]

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'base64', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

import argon2 from 'argon2'

export async function hashPassword(plain: string) {
  return argon2.hash(plain, { type: argon2.argon2id })
}

export async function verifyPassword(plain: string, hash: string | null | undefined) {
  if (!hash) return false

  // Permite usar el hash dummy que tenías en seeds para pruebas rápidas:
  // si el hash contiene "dummy", acepta password "dev"
  if (hash.includes('dummy')) {
    return plain === 'dev'
  }

  try {
    return await argon2.verify(hash, plain)
  } catch {
    return false
  }
}

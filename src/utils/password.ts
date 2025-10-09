import argon2 from 'argon2'
import { AppDataSource } from '../db/data-source'

export async function hashPassword(plain: string) {
  return argon2.hash(plain, { type: argon2.argon2id })
}

export async function verifyPassword(plain: string, hash: string | null | undefined) {
  if (!hash) return false

  // 🧪 Caso demo: hash "dummy" → acepta password "dev"
  if (hash.includes('dummy')) {
    return plain === 'dev'
  }

  // 🔒 Caso Argon2
  if (hash.startsWith('$argon2')) {
    try {
      return await argon2.verify(hash, plain)
    } catch {
      return false
    }
  }

  // 🧂 Caso pgcrypto (bcrypt generado con crypt('...', gen_salt('bf')) en PostgreSQL)
  try {
    const result = await AppDataSource.query(
      `SELECT crypt($1, $2) = $2 AS ok`,
      [plain, hash]
    )
    return !!result?.[0]?.ok
  } catch {
    return false
  }
}

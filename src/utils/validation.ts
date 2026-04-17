/* =============================================
   ROOMIFY – Validation Utilities
   src/utils/validation.ts
   ============================================= */

/**
 * Validasi format email
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validasi password minimal 8 karakter
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

/**
 * Validasi nama tidak boleh kosong
 */
export function isValidName(name: string): boolean {
  return name.trim().length > 0;
}
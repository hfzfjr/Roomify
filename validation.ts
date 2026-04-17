// ============================================================
// UTILITY: Validasi Form
// Fungsi-fungsi untuk memvalidasi input dari pengguna
// ============================================================

// Validasi format email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validasi kekuatan password (minimal 8 karakter)
export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

// Validasi nama (tidak boleh kosong, minimal 2 karakter)
export function isValidName(name: string): boolean {
  return name.trim().length >= 2;
}

// Validasi nomor telepon Indonesia
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(\+62|62|0)[0-9]{8,12}$/;
  return phoneRegex.test(phone.replace(/\s|-/g, ""));
}

// Hasil validasi login
export interface LoginValidationResult {
  isValid: boolean;
  emailError?: string;
  passwordError?: string;
}

// Validasi semua field login sekaligus
export function validateLoginInput(email: string, password: string): LoginValidationResult {
  const result: LoginValidationResult = { isValid: true };

  if (!email || email.trim() === "") {
    result.isValid = false;
    result.emailError = "Email wajib diisi";
  } else if (!isValidEmail(email)) {
    result.isValid = false;
    result.emailError = "Format email tidak valid";
  }

  if (!password || password.trim() === "") {
    result.isValid = false;
    result.passwordError = "Password wajib diisi";
  } else if (!isValidPassword(password)) {
    result.isValid = false;
    result.passwordError = "Password minimal 8 karakter";
  }

  return result;
}

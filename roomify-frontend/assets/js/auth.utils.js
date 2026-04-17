/* =============================================
   ROOMIFY – Auth Utilities
   assets/js/auth.utils.js
   ============================================= */

/**
 * SVG icons untuk toggle password
 */
const Icons = {
  eyeOpen: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none"
    viewBox="0 0 24 24" stroke="#6B7280" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round"
      d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/>
    <circle cx="12" cy="12" r="3" stroke="#6B7280" stroke-width="2"/>
  </svg>`,

  eyeSlash: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none"
    viewBox="0 0 24 24" stroke="#6B7280" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round"
      d="M17.94 17.94A10.94 10.94 0 0 1 12 19C5 19 1 12 1 12
         a18.09 18.09 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12
         4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0
         1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"
      stroke="#6B7280" stroke-width="2" stroke-linecap="round"/>
  </svg>`
};

/**
 * Inisialisasi toggle password pada sebuah field
 * @param {string} inputId   - id <input type="password">
 * @param {string} toggleId  - id <button> toggle
 */
function initPasswordToggle(inputId, toggleId) {
  const input  = document.getElementById(inputId);
  const toggle = document.getElementById(toggleId);
  if (!input || !toggle) return;

  toggle.innerHTML = Icons.eyeOpen;

  toggle.addEventListener('click', () => {
    const hidden = input.type === 'password';
    input.type       = hidden ? 'text' : 'password';
    toggle.innerHTML = hidden ? Icons.eyeSlash : Icons.eyeOpen;
  });
}

/**
 * Set tombol ke loading state
 * @param {string} btnId    - id button
 * @param {string} textId   - id elemen <span> teks
 * @param {string} loadText - teks saat loading
 */
function setLoading(btnId, textId, loadText = 'Memproses...') {
  const btn  = document.getElementById(btnId);
  const text = document.getElementById(textId);
  btn.classList.add('loading');
  text.textContent = loadText;
}

/**
 * Reset tombol dari loading state
 * @param {string} btnId     - id button
 * @param {string} textId    - id elemen <span> teks
 * @param {string} resetText - teks default
 */
function resetLoading(btnId, textId, resetText) {
  const btn  = document.getElementById(btnId);
  const text = document.getElementById(textId);
  btn.classList.remove('loading');
  text.textContent = resetText;
}

/**
 * Validasi format email
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Tampilkan error pada field
 * @param {string} fieldId
 */
function showFieldError(fieldId) {
  document.getElementById(fieldId)?.classList.add('error');
}

/**
 * Reset semua error pada daftar field
 * @param {string[]} fieldIds
 */
function clearFieldErrors(fieldIds) {
  fieldIds.forEach(id => document.getElementById(id)?.classList.remove('error'));
}

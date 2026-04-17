/* =============================================
   ROOMIFY – Signup Logic
   assets/js/signup.js
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  // Init password toggle
  initPasswordToggle('password', 'togglePw');
});

function handleSignup() {
  const nama     = document.getElementById('nama').value.trim();
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const fields = ['field-nama', 'field-email', 'field-password'];
  clearFieldErrors(fields);

  let valid = true;

  if (!nama) {
    showFieldError('field-nama');
    valid = false;
  }

  if (!email || !isValidEmail(email)) {
    showFieldError('field-email');
    valid = false;
  }

  if (password.length < 8) {
    showFieldError('field-password');
    valid = false;
  }

  if (!valid) return;

  setLoading('signupBtn', 'btnText', 'Mendaftar...');

  // TODO: Ganti dengan fetch() ke API backend
  setTimeout(() => {
    resetLoading('signupBtn', 'btnText', 'Sign up');
    alert('Akun berhasil dibuat! Silakan login. 🎉');
    window.location.href = '../index.html';
  }, 2000);
}

/* =============================================
   ROOMIFY – Auth (single-page: login + signup)
   assets/js/auth.js
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggle('login-password',  'togglePw-login');
  initPasswordToggle('signup-password', 'togglePw-signup');

  // Animasi awal form login saat halaman baru dibuka
  triggerFormAnimation('form-login');
});

/* ── Tab switching ─────────────────────────────
   Panel kiri TIDAK berubah sama sekali.
   Hanya form di panel kanan yang di-swap + fadeUp.
──────────────────────────────────────────────── */
function switchTab(tab) {
  const toShow = document.getElementById('form-' + tab);
  const toHide = document.getElementById('form-' + (tab === 'login' ? 'signup' : 'login'));

  // Update tab button
  document.getElementById('tab-login').classList.toggle('active',  tab === 'login');
  document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');

  // Sembunyikan form lama
  toHide.classList.remove('active');

  // Tampilkan & animasikan form baru
  toShow.classList.add('active');
  triggerFormAnimation('form-' + tab);

  // Reset error di form yang baru ditampilkan
  toShow.querySelectorAll('.field.error').forEach(f => f.classList.remove('error'));
}

/**
 * Re-trigger animasi fadeUp pada semua child elemen sebuah form
 * @param {string} formId
 */
function triggerFormAnimation(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.classList.add('switching');

  // Hapus class setelah animasi selesai supaya bisa di-trigger lagi nanti
  setTimeout(() => form.classList.remove('switching'), 600);
}

/* ── Login ──────────────────────────────────── */
function handleLogin() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  clearFieldErrors(['field-login-email', 'field-login-password']);
  let valid = true;

  if (!email || !isValidEmail(email)) {
    showFieldError('field-login-email');
    valid = false;
  }
  if (!password) {
    showFieldError('field-login-password');
    valid = false;
  }
  if (!valid) return;

  setLoading('loginBtn', 'loginBtnText', 'Memproses...');

  // TODO: ganti dengan fetch() ke API backend
  setTimeout(() => {
    resetLoading('loginBtn', 'loginBtnText', 'Login');
    alert('Login berhasil! Selamat datang di Roomify 🏠');
    // window.location.href = 'pages/dashboard.html';
  }, 2000);
}

/* ── Signup ─────────────────────────────────── */
function handleSignup() {
  const nama     = document.getElementById('nama').value.trim();
  const email    = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;

  clearFieldErrors(['field-nama', 'field-signup-email', 'field-signup-password']);
  let valid = true;

  if (!nama) {
    showFieldError('field-nama');
    valid = false;
  }
  if (!email || !isValidEmail(email)) {
    showFieldError('field-signup-email');
    valid = false;
  }
  if (password.length < 8) {
    showFieldError('field-signup-password');
    valid = false;
  }
  if (!valid) return;

  setLoading('signupBtn', 'signupBtnText', 'Mendaftar...');

  // TODO: ganti dengan fetch() ke API backend
  setTimeout(() => {
    resetLoading('signupBtn', 'signupBtnText', 'Sign up');
    alert('Akun berhasil dibuat! Silakan login. 🎉');
    switchTab('login');
  }, 2000);
}

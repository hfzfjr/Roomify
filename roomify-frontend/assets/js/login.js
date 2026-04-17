/* =============================================
   ROOMIFY – Login Logic
   assets/js/login.js
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  // Init password toggle
  initPasswordToggle('password', 'togglePw');
});

function handleLogin() {
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    alert('Mohon isi email dan password terlebih dahulu.');
    return;
  }

  setLoading('loginBtn', 'btnText', 'Memproses...');

  // TODO: Ganti dengan fetch() ke API backend
  setTimeout(() => {
    resetLoading('loginBtn', 'btnText', 'Login');
    alert('Login berhasil! Selamat datang di Roomify 🏠');
    // window.location.href = '../pages/dashboard.html';
  }, 2000);
}

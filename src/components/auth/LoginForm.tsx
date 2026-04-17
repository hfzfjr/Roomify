'use client';

import { useState } from 'react';
import Link from 'next/link';
import { isValidEmail } from '@/utils/auth.utils';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: false, password: false });
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    // Reset errors
    setErrors({ email: false, password: false });

    let valid = true;
    if (!email || !isValidEmail(email)) {
      setErrors(prev => ({ ...prev, email: true }));
      valid = false;
    }
    if (!password) {
      setErrors(prev => ({ ...prev, password: true }));
      valid = false;
    }

    if (!valid) return;

    setIsLoading(true);

    // TODO: Replace with actual API call
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Login berhasil! Selamat datang di Roomify 🏠');
      // window.location.href = '/customer/dashboard';
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="tab-group">
        <button type="button" className="tab-btn active">Login</button>
        <Link href="/auth/register" className="tab-btn">
          Sign up
        </Link>
      </div>

      <div className="form-view active">
        <div className="form-heading">
          <h2>Login</h2>
          <p>Selamat datang kembali!<br />Silakan masukan email dan password Anda</p>
        </div>

        <div className={`field ${errors.email ? 'error' : ''}`}>
          <label htmlFor="login-email">Email</label>
          <input
            type="email"
            id="login-email"
            placeholder="nama@gmail.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="error-msg">Masukkan email yang valid.</p>
        </div>

        <div className={`field ${errors.password ? 'error' : ''}`}>
          <label htmlFor="login-password">Password</label>
          <div className="input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              id="login-password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="toggle-pw"
              onClick={() => setShowPassword((prev) => !prev)}
              title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          <p className="error-msg">Password tidak boleh kosong.</p>
        </div>

        <p className="terms">
          Dengan masuk Anda setuju dengan
          <a href="#">Terms of Use</a> dan <a href="#">Privacy Policy</a>
        </p>

        <button 
          className={`btn-primary ${isLoading ? 'loading' : ''}`}
          onClick={handleLogin}
          disabled={isLoading}
        >
          <span className="spinner"></span>
          <span>{isLoading ? 'Memproses...' : 'Login'}</span>
        </button>
      </div>
    </>
  );
}
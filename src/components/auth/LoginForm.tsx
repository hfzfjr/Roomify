'use client';

import { useState } from 'react';
import Link from 'next/link';
import { isValidEmail } from '@/utils/auth.utils';
import { useAuth } from '@/hooks/useAuth';

const EyeOpenIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeClosedIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C5 19 1 12 1 12a18.09 18.09 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export default function LoginForm() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: false, password: false });
  const [serverError, setServerError] = useState('');

  const handleLogin = async () => {
    // Reset errors
    setErrors({ email: false, password: false });
    setServerError('');

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

    const result = await login({ email, password });
    if (!result.success) {
      setServerError(result.error || 'Login gagal. Periksa kembali email dan password.');
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
              {showPassword ? EyeClosedIcon : EyeOpenIcon}
            </button>
          </div>
          <p className="error-msg">Password tidak boleh kosong.</p>
        </div>

        {serverError ? <p className="error-msg">{serverError}</p> : null}

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
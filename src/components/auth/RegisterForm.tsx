'use client';

import { useState } from 'react';
import { isValidEmail } from '@/utils/auth.utils';
import { useAuth } from '@/hooks/useAuth';
import '@/styles/auth.css';

const EyeClosedIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOpenIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C5 19 1 12 1 12a18.09 18.09 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

type Props = { onSwitchTab: (tab: 'login' | 'register') => void };

export default function RegisterForm({ onSwitchTab }: Props) {
  const { register, isLoading } = useAuth();
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ nama: false, email: false, password: false });
  const [errorMessages, setErrorMessages] = useState({ nama: '', email: '', password: '' });
  const [serverError, setServerError] = useState('');

  const handleSignup = async () => {
    setErrors({ nama: false, email: false, password: false });
    setErrorMessages({ nama: '', email: '', password: '' });
    setServerError('');

    let valid = true;
    if (!nama.trim()) {
      setErrors(prev => ({ ...prev, nama: true }));
      setErrorMessages(prev => ({ ...prev, nama: 'Nama lengkap tidak boleh kosong' }));
      valid = false;
    }
    if (!email.trim()) {
      setErrors(prev => ({ ...prev, email: true }));
      setErrorMessages(prev => ({ ...prev, email: 'Email tidak boleh kosong' }));
      valid = false;
    } else if (!isValidEmail(email)) {
      setErrors(prev => ({ ...prev, email: true }));
      setErrorMessages(prev => ({ ...prev, email: 'Email harus menggunakan @gmail.com' }));
      valid = false;
    }
    if (!password) {
      setErrors(prev => ({ ...prev, password: true }));
      setErrorMessages(prev => ({ ...prev, password: 'Password tidak boleh kosong' }));
      valid = false;
    } else if (password.length < 8) {
      setErrors(prev => ({ ...prev, password: true }));
      setErrorMessages(prev => ({ ...prev, password: 'Password minimal 8 karakter' }));
      valid = false;
    }
    if (!valid) return;

    const result = await register({ nama, email, password });
    if (!result.success) {
      setServerError(result.error || 'Pendaftaran gagal. Silakan coba lagi.');
    }
  };

  return (
    <>
      <div className="tab-group">
        <button type="button" className="tab-btn" onClick={() => onSwitchTab('login')}>
          Login
        </button>
        <button type="button" className="tab-btn active">Sign up</button>
      </div>

      <div className="form-view active">
        <div className="form-heading">
          <h2>Sign Up</h2>
          <p>Selamat datang!<br />Silakan daftarkan email dan password Anda</p>
        </div>

        <div className={`field ${errors.nama ? 'error' : ''}`}>
          <label htmlFor="nama">Nama Lengkap</label>
          <input
            type="text"
            id="nama"
            placeholder="Masukkan nama lengkap Anda"
            autoComplete="name"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
          />
          <p className="error-msg">{errorMessages.nama || 'Nama lengkap tidak boleh kosong'}</p>
        </div>

        <div className={`field ${errors.email ? 'error' : ''}`}>
          <label htmlFor="signup-email">Email</label>
          <input
            type="email"
            id="signup-email"
            placeholder="nama@gmail.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="error-msg">{errorMessages.email || 'Email harus menggunakan @gmail.com'}</p>
        </div>

        <div className={`field ${errors.password ? 'error' : ''}`}>
          <label htmlFor="signup-password">Password</label>
          <div className="input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              id="signup-password"
              placeholder="Min. 8 karakter"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="toggle-pw"
              onClick={() => setShowPassword(prev => !prev)}
              title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              {showPassword ? EyeClosedIcon : EyeOpenIcon}
            </button>
          </div>
          <p className="error-msg">{errorMessages.password || 'Password minimal 8 karakter'}</p>
        </div>

        {serverError && (
          <p className="error-msg" style={{ display: 'block' }}>{serverError}</p>
        )}

        <p className="terms">
          Dengan mendaftar Anda setuju dengan
          <a href="#"> Terms of Use</a> dan <a href="#">Privacy Policy</a>
        </p>

        <button
          className={`btn-primary ${isLoading ? 'loading' : ''}`}
          onClick={handleSignup}
          disabled={isLoading}
        >
          <span className="spinner"></span>
          <span>{isLoading ? 'Mendaftar...' : 'Sign up'}</span>
        </button>
      </div>
    </>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isValidEmail } from '@/utils/auth.utils';

export default function RegisterForm() {
  const router = useRouter();
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ nama: false, email: false, password: false });
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    setErrors({ nama: false, email: false, password: false });

    let valid = true;
    if (!nama) {
      setErrors(prev => ({ ...prev, nama: true }));
      valid = false;
    }
    if (!email || !isValidEmail(email)) {
      setErrors(prev => ({ ...prev, email: true }));
      valid = false;
    }
    if (password.length < 8) {
      setErrors(prev => ({ ...prev, password: true }));
      valid = false;
    }

    if (!valid) return;

    setIsLoading(true);

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Akun berhasil dibuat! Silakan login. 🎉');
      router.push('/auth/login');
    } catch (error) {
      console.error('Signup failed:', error);
      alert('Pendaftaran gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="tab-group">
        <Link href="/auth/login" className="tab-btn">
          Login
        </Link>
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
          <p className="error-msg">Nama lengkap tidak boleh kosong.</p>
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
          <p className="error-msg">Masukkan email yang valid.</p>
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
              onClick={() => setShowPassword((prev) => !prev)}
              title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          <p className="error-msg">Password minimal 8 karakter.</p>
        </div>

        <p className="terms">
          Dengan mendaftar Anda setuju dengan
          <a href="#">Terms of Use</a> dan <a href="#">Privacy Policy</a>
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
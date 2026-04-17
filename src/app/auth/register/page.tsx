'use client';

import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="auth-container">
      <div className="left-panel">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        <div className="left-text">
          <h1>Selamat<br />Datang!</h1>
        </div>
      </div>
      <div className="right-panel">
        <RegisterForm />
      </div>
    </div>
  );
}
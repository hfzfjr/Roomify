'use client';

import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
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
        <LoginForm />
      </div>
    </div>
  );
}
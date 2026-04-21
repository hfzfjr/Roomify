'use client';

import { useState } from 'react';
import LoginForm    from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';

type Tab = 'login' | 'register';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<Tab>('login');
  const [animKey,   setAnimKey]   = useState(0);

  function switchTab(tab: Tab) {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setAnimKey(k => k + 1);
  }

  return (
    <div className="auth-container">

      {/* Panel kiri — tidak ikut berubah saat switch tab */}
      <div className="left-panel">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        <div className="left-text">
          <h1>Selamat<br />Datang!</h1>
        </div>
      </div>

      {/* Panel kanan */}
      <div className="right-panel">
        <div key={animKey} className="form-animate">
          {activeTab === 'login'
            ? <LoginForm    onSwitchTab={switchTab} />
            : <RegisterForm onSwitchTab={switchTab} />
          }
        </div>
      </div>

    </div>
  );
}

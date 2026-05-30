'use client';

import { useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import styles from './SidebarOwner.module.css';
import SwitchToCustomerOverlay from '@/components/ui/SwitchToCustomerOverlay';

interface SessionUser {
  user_id: string;
  name: string;
  email: string;
  role: string;
}

interface SidebarOwnerProps {
  user: SessionUser | null;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarRef: React.RefObject<HTMLElement | null>;
}

export default function SidebarOwner({ user, sidebarOpen, setSidebarOpen, sidebarRef }: SidebarOwnerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [showSwitchOverlay, setShowSwitchOverlay] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  const handleProfileClick = () => {
    setAccountMenuOpen(false);
    router.push('/customer/profile');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAccountMenuOpen(false);
    router.push('/auth/login');
  };

  const handleSwitchToCustomer = () => {
    setShowSwitchOverlay(true);
  };

  const handleSwitchOverlayConfirm = () => {
    setShowSwitchOverlay(false);
    router.push('/customer/dashboard');
  };

  const handleSwitchOverlayCancel = () => {
    setShowSwitchOverlay(false);
  };

  const navItems = [
    { label: 'Dashboard', path: '/owner/dashboard', isActive: pathname === '/owner/dashboard' },
    { label: 'Profil', path: '/owner/profile', isActive: pathname.startsWith('/customer/profile') },
    { label: 'Review & Feedback', path: '/owner/reviews', isActive: pathname.startsWith('/owner/dashboard/facility-requests') },
    { label: 'Laporan Transaksi', path: '/owner/reports', isActive: pathname.startsWith('/owner/reports') },
    { label: 'Tambah Ruangan', path: '/owner/rooms/add', isActive: pathname.startsWith('/owner/rooms/add') },
    { label: 'Bantuan', path: '/owner/faq', isActive: false },
  ];

  return (
    <>
      <aside ref={sidebarRef} className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
      <button
        type="button"
        className={styles.sidebarCloseBtn}
        onClick={() => setSidebarOpen(false)}
        aria-label="Tutup sidebar"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
          <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
        </svg>
      </button>
      <div className={styles.sidebarLogo}>
        <img src="/images/roomify-putih.png" alt="Roomify" className={styles.logoImage} />
      </div>

      <div className={styles.accountMenu} ref={accountMenuRef}>
        <button
          type="button"
          className={`${styles.sidebarUserButton} ${accountMenuOpen ? styles.menuOpen : ''}`}
          onClick={() => setAccountMenuOpen((current) => !current)}
          aria-haspopup="menu"
          aria-expanded={accountMenuOpen}
        >
          <div className={styles.userAvatar}>{user?.name?.charAt(0).toUpperCase() || 'S'}</div>
          <div className={styles.userInfo}>
            <strong>{user?.name || 'Owner'}</strong>
            <span>Owner</span>
          </div>
        </button>

        {accountMenuOpen && (
          <div className={styles.accountDropdown} role="menu">
            <div className={styles.accountDropdownHeader}>
              <span className={styles.accountDropdownName}>{user?.name || 'Owner'}</span>
              <span className={styles.accountDropdownRole}>OWNER</span>
            </div>
            <button type="button" className={styles.accountDropdownItem} onClick={handleProfileClick}>
              Profil
            </button>
            <button
              type="button"
              className={`${styles.accountDropdownItem} ${styles.danger}`}
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        )}
      </div>

      <nav className={styles.sidebarNav}>
        {navItems.map((item) => (
          <button
            key={item.label}
            type="button"
            className={`${styles.navItem} ${item.isActive ? styles.active : ''}`}
            onClick={() => router.push(item.path)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className={styles.sidebarCta}>
        <button
          type="button"
          className={styles.sidebarCtaButton}
          onClick={handleSwitchToCustomer}
        >
          <span className={styles.sidebarCtaIcon} aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M4 21V7.5a1.5 1.5 0 0 1 1.5-1.5h13A1.5 1.5 0 0 1 20 7.5V21" />
              <path d="M9 21V10h6v11" />
              <path d="M3 21h18" />
            </svg>
          </span>
          <span className={styles.sidebarCtaCopy}>
            <strong>Sewa Ruangan</strong>
            <span>Pindah ke mode customer untuk sewa ruangan</span>
          </span>
        </button>
      </div>
    </aside>

    {showSwitchOverlay && (
      <SwitchToCustomerOverlay
        onConfirm={handleSwitchOverlayConfirm}
        onCancel={handleSwitchOverlayCancel}
      />
    )}
    </>
  );
}

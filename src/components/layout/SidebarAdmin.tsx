'use client';

import { useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { User } from '@/types';
import styles from './SidebarAdmin.module.css';

interface SidebarAdminProps {
  user: User | null;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarRef: React.RefObject<HTMLElement | null>;
}

export default function SidebarAdmin({ user, sidebarOpen, setSidebarOpen, sidebarRef }: SidebarAdminProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
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

  const navItems = useMemo(
    () => [
      { label: 'Dashboard', path: '/admin/dashboard', isActive: pathname === '/admin/dashboard' },
      { label: 'Lihat Laporan', path: '/admin/reports', isActive: pathname.startsWith('/admin/reports') },
      { label: 'Daftar Owner', path: '/admin/list-owner', isActive: pathname.startsWith('/admin/list-owner') },
      { label: 'Daftar Ruangan', path: '/admin/list-room', isActive: pathname.startsWith('/admin/list-room') },
      { label: 'Bantuan', path: '/admin/faq', isActive: pathname === '/admin/faq' },
    ],
    [pathname]
  );

  return (
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
          <div className={styles.userAvatar}>{user?.name?.charAt(0).toUpperCase() || 'A'}</div>
          <div className={styles.userInfo}>
            <strong>{user?.name || 'Admin'}</strong>
            <span>Admin</span>
          </div>
          <span className={styles.userMenuCaret} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>

        {accountMenuOpen && (
          <div className={styles.accountDropdown} role="menu">
            <div className={styles.accountDropdownHeader}>
              <span className={styles.accountDropdownName}>{user?.name || 'Admin'}</span>
              <span className={styles.accountDropdownRole}>ADMIN</span>
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
    </aside>
  );
}

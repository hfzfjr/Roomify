'use client';

import { useState, useEffect } from 'react';
import styles from './AdminDashboard.module.css';
import { useAdminDashboard } from '@/hooks/useDashboard';

interface ChartData {
  label: string;
  value: number;
  active?: boolean;
}

interface VerificationItem {
  id: number;
  name: string;
  time: string;
  message: string;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError } = useAdminDashboard();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const [activeNav, setActiveNav] = useState(0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTopbarDate = () => {
    const date = new Date();
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return `${weekday}, ${day} ${month} ${year}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatChangeLabel = (value: number | null, fallback: string) => {
    if (value === null) {
      return fallback;
    }

    const percent = Math.abs(Math.round(value));
    const trend = value >= 0 ? 'Mengalami kenaikan' : 'Mengalami penurunan';
    return `${percent}% ${trend} dari bulan sebelumnya`;
  };

  if (dashboardLoading) {
    return (
      <div className={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'red' }}>
          Error: {dashboardError}
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats;
  const chartData = dashboardData?.chartData || [];
  const pendingVerifications = dashboardData?.pendingVerifications || [];

  const yLabels = ['100', '90', '80', '70', '60', '50', '40', '30', '20', '10', '0'];
  const chartHeight = 216;
  const maxChartValue = 100;

  const calculateBarHeight = (value: number): number => {
    return Math.round((value / maxChartValue) * chartHeight);
  };

  return (
    <div className={styles.container}>
      {/* SIDEBAR */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <img src="/images/roomify-putih.png" alt="Roomify" className={styles.logoImage} />
        </div>

        <div className={styles.sidebarUser}>
          <div className={styles.userAvatar}>{user?.name?.charAt(0).toUpperCase() || 'A'}</div>
          <div className={styles.userInfo}>
            <strong>{user?.name || 'Admin'}</strong>
            <span>Admin</span>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          {[
            { icon: '▦', label: 'Dashboard' },
            { icon: '👤', label: 'Profil' },
            { icon: '🔗', label: 'View Reports' },
            { icon: '👤', label: 'Delete Owner' },
            { icon: '❌', label: 'Delete Room' },
            { icon: '❓', label: 'Help' },
          ].map((item, index) => (
            <div
              key={index}
              className={`${styles.navItem} ${activeNav === index ? styles.active : ''}`}
              onClick={() => setActiveNav(index)}
            >
              <span>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>
      </aside>

      {/* MAIN */}
      <main className={styles.main}>
        {/* TOPBAR */}
        <div className={styles.topbar}>
          <h1>Dashboard Admin</h1>
          <span className={styles.topbarDate}>
            {formatTopbarDate()}
          </span>
        </div>

        {/* CONTENT */}
        <div className={styles.content}>
          {/* STAT CARDS */}
          <div className={styles.statCards}>
            {/* Total Pengguna */}
            <div className={`${styles.statCard} ${styles.highlight}`}>
              <div className={styles.statLabel}>Total Pengguna</div>
              <div className={styles.statValue}>
                {stats?.totalUsers || 0}
                <span className={styles.statValueIcon}>
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="rgba(255,255,255,0.7)"
                    strokeWidth="2"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </span>
              </div>
              <div className={`${styles.statBadge} ${styles.white}`}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M18 15l-6-6-6 6" />
                </svg>
                {formatChangeLabel(stats?.usersMonthChangePercent ?? null, 'Belum ada data perbandingan bulan sebelumnya')}
              </div>
            </div>

            {/* Total Owner */}
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Total Owner:</div>
              <div className={styles.statValue}>
                {stats?.totalOwners || 0}
                <span style={{ fontSize: '28px', opacity: 0.5 }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                </span>
              </div>
              <div className={`${styles.statBadge} ${styles.green}`}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M18 15l-6-6-6 6" />
                </svg>
                {formatChangeLabel(stats?.ownersMonthChangePercent ?? null, 'Belum ada data perbandingan bulan sebelumnya')}
              </div>
            </div>

            {/* Total Ruangan */}
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Total Ruangan:</div>
              <div className={styles.statValue}>
                {stats?.totalRooms || 0}
                <span>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                  </svg>
                </span>
              </div>
              <div className={`${styles.statBadge} ${styles.green}`}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M18 15l-6-6-6 6" />
                </svg>
                {formatChangeLabel(stats?.roomsMonthChangePercent ?? null, 'Belum ada data perbandingan bulan sebelumnya')}
              </div>
            </div>
          </div>

          {/* CHART + VERIFICATION */}
          <div className={styles.grid2}>
            {/* Chart */}
            <div className={`${styles.card} ${styles.chartCard}`}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Customer Map</span>
                <div className={styles.toggleGroup}>
                  <button className={`${styles.toggleBtn} ${styles.active}`}>
                    Mingguan
                  </button>
                  <button className={styles.toggleBtn}>
                    Bulanan
                  </button>
                </div>
              </div>
              <div className={styles.chartArea}>
                <div className={styles.chartYAxis}>
                  {yLabels.map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>
                <div className={styles.chartBars}>
                  {chartData.map((data, idx) => {
                    const barHeight = Math.round((data.value / 100) * chartHeight);
                    return (
                      <div key={idx} className={styles.barCol}>
                        <div
                          className={`${styles.barInner} ${data.active ? styles.cyan : styles.gray}`}
                          style={{ height: `${barHeight}px` }}
                        />
                        <span className={styles.barLabel}>{data.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Verification */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Verification</span>
                <span className={styles.badgeUnread}>{pendingVerifications.length} unread</span>
              </div>

              {pendingVerifications.slice(0, 3).map((verification) => (
                <div key={verification.user_id} className={styles.verifItem}>
                  <div className={styles.verifTop}>
                    <span className={styles.verifName}>{verification.name}</span>
                    <span className={styles.verifTime}>{formatDate(verification.created_at)}</span>
                  </div>
                  <div className={styles.verifMsg}>
                    <strong>{verification.name}</strong> mengirimkan permintaan verifikasi untuk menjadi Owner. Tinjau
                    dokumennya sekarang
                  </div>
                  <div className={styles.verifActions}>
                    <button className={styles.btnView}>View details</button>
                    <button className={styles.btnClose}>
                      Close
                    </button>
                  </div>
                </div>
              ))}

              {pendingVerifications.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--gray-400)' }}>
                  No pending verifications
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

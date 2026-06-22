'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { useAdminDashboard } from '@/hooks/useDashboard';
import type { User } from '@/types';
import UserIcon from '@/components/icons/UserIcon';
import OfficeIcon from '@/components/icons/OfficeIcon';
import SidebarAdmin from '@/components/layout/SidebarAdmin';
import VerifyOwnerOverlay from '@/components/ui/overlay/admin/VerifyOwnerOverlay';

const chartSkeletonHeights = [84, 156, 112, 178, 136, 98, 164];

const chartVisualHeight = 272;

// Generate weekly data: 7 hari terakhir, hari ini di paling kanan
function generateWeeklyData() {
  const dayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const today = new Date();
  const todayIndex = today.getDay(); // 0 = Minggu
  return Array.from({ length: 7 }, (_, i) => {
    const dayOffset = i - 6; // i=6 adalah hari ini (offset 0)
    const date = new Date(today);
    date.setDate(today.getDate() + dayOffset);
    const dayOfWeek = date.getDay();
    const isToday = i === 6;
    return {
      label: dayLabels[dayOfWeek],
      value: [12, 18, 8, 15, 10, 20, 14][i], // Fixed values instead of random
      active: isToday,
    };
  });
}

// Generate monthly data: 6 bulan terakhir, bulan ini di paling kanan
function generateMonthlyData() {
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const today = new Date();
  const currentMonth = today.getMonth(); // 0-indexed
  return Array.from({ length: 6 }, (_, i) => {
    const monthOffset = i - 5; // i=5 adalah bulan ini (offset 0)
    const monthIndex = ((currentMonth + monthOffset) % 12 + 12) % 12;
    const isCurrentMonth = i === 5;
    return {
      label: monthLabels[monthIndex],
      value: [15, 22, 10, 18, 12, 25][i], // Fixed values instead of random
      active: isCurrentMonth,
    };
  });
}

const mockWeeklyData = generateWeeklyData();
const mockMonthlyData = generateMonthlyData();
let cachedUserString: string | null | undefined;
let cachedUserSnapshot: User | null = null;

function getStoredUserSnapshot(): User | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const userData = localStorage.getItem('user');

  if (userData === cachedUserString) {
    return cachedUserSnapshot;
  }

  cachedUserString = userData;

  if (!userData) {
    cachedUserSnapshot = null;
    return null;
  }

  try {
    cachedUserSnapshot = JSON.parse(userData) as User;
  } catch {
    cachedUserSnapshot = null;
  }

  return cachedUserSnapshot;
}

function getServerUserSnapshot(): User | null {
  return null;
}

function subscribeToUserStore(onStoreChange: () => void) {
  if (typeof window === 'undefined') {
    return () => { };
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === 'user') {
      onStoreChange();
    }
  };

  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener('storage', handleStorage);
  };
}

export default function AdminDashboardPage() {
  const user = useSyncExternalStore(
    subscribeToUserStore,
    getStoredUserSnapshot,
    getServerUserSnapshot
  );
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError } = useAdminDashboard();
  const router = useRouter();

  const [chartPeriod, setChartPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<any>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

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

  const handleApprove = async () => {
    if (!selectedVerification) return

    try {
      const ownerId = selectedVerification.owner_id

      const response = await fetch(`/api/admin/owners/${ownerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' })
      })

      const result = await response.json()

      if (result.success) {
        setOverlayOpen(false)
        setSelectedVerification(null)
        // Refresh dashboard data
        window.location.reload()
      } else {
        console.error('Failed to approve owner:', result.message)
        alert('Gagal menyetujui owner: ' + result.message)
      }
    } catch (error) {
      console.error('Error approving owner:', error)
      alert('Terjadi kesalahan saat menyetujui owner')
    }
  }

  const handleReject = async () => {
    if (!selectedVerification) return

    try {
      const ownerId = selectedVerification.owner_id

      const response = await fetch(`/api/admin/owners/${ownerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'suspended' })
      })

      const result = await response.json()

      if (result.success) {
        setOverlayOpen(false)
        setSelectedVerification(null)
        // Refresh dashboard data
        window.location.reload()
      } else {
        console.error('Failed to reject owner:', result.message)
        alert('Gagal menolak owner: ' + result.message)
      }
    } catch (error) {
      console.error('Error rejecting owner:', error)
      alert('Terjadi kesalahan saat menolak owner')
    }
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
  const rawChartData = dashboardData?.chartData;
  const pendingVerifications = dashboardData?.pendingVerifications || [];

  // Handle both old (single array) and new (weekly/monthly) chart data structures
  const chartData = rawChartData && Array.isArray(rawChartData)
    ? { weekly: rawChartData, monthly: rawChartData }
    : (rawChartData || { weekly: [], monthly: [] });

  // Selalu pakai mock data sampai API return 7 hari (weekly) atau 6 bulan (monthly) dengan label yang benar
  const weeklyData = chartData.weekly.length === 7 ? chartData.weekly : mockWeeklyData;
  const monthlyData = chartData.monthly.length === 6 ? chartData.monthly : mockMonthlyData;

  const activeChartData = chartPeriod === 'weekly' ? weeklyData : monthlyData;

  const chartMaxValue = activeChartData.length > 0 ? Math.max(...activeChartData.map((item) => item.value), 0) : 0;
  const chartScaleStep = chartMaxValue > 5 ? Math.max(1, Math.ceil(chartMaxValue / 5)) : 1;
  const chartCeiling = chartMaxValue > 0 ? (chartMaxValue > 5 ? chartScaleStep * 5 : chartMaxValue) : 1;
  const yAxisLabels = chartMaxValue > 0
    ? (chartMaxValue > 5
      ? Array.from({ length: 6 }, (_, index) => String(chartCeiling - (index * chartScaleStep)))
      : Array.from({ length: chartCeiling + 1 }, (_, index) => String(chartCeiling - index)))
    : ['1', '0'];

  return (
    <div className={styles.container}>
      {sidebarOpen && (
        <div
          className={styles.sidebarBackdrop}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <SidebarAdmin user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} sidebarRef={sidebarRef} />

      {/* MAIN */}
      <main className={styles.main}>
        {/* TOPBAR */}
        <div className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button
              type="button"
              className={styles.hamburgerBtn}
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round" />
                <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round" />
                <line x1="3" y1="18" x2="21" y2="18" strokeLinecap="round" />
              </svg>
            </button>
            <h1>Dashboard Admin</h1>
          </div>
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
              {dashboardLoading && !stats ? (
                <>
                  <div className={styles.skeletonValue} />
                  <div className={styles.skeletonText} />
                </>
              ) : (
                <>
                  <div className={styles.statValue}>
                    {stats?.totalUsers || 0}
                    <span className={styles.statValueIcon}>
                      <UserIcon />
                    </span>
                  </div>
                  <div className={styles.trendContainer}>
                    <div className={`${styles.statBadge} ${styles.white}`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                        <path d="M12 4v16" strokeLinecap="round" />
                        <path d="m6.5 9.5 5.5-5.5 5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {Math.abs(stats?.usersMonthChangePercent ?? 0)}%
                    </div>
                    <span className={styles.trendText}>Kenaikan dari bulan sebelumnya</span>
                  </div>
                </>
              )}
            </div>

            {/* Total Owner */}
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Total Owner:</div>
              {dashboardLoading && !stats ? (
                <>
                  <div className={styles.skeletonValue} />
                  <div className={styles.skeletonText} />
                </>
              ) : (
                <>
                  <div className={styles.statValue}>
                    {stats?.totalOwners || 0}
                    <span className={styles.statValueIcon}>
                      <UserIcon />
                    </span>
                  </div>
                  <div className={styles.trendContainer}>
                    <div className={`${styles.statBadge} ${styles.green}`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                        <path d="M12 4v16" strokeLinecap="round" />
                        <path d="m6.5 9.5 5.5-5.5 5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {stats?.ownersMonthChangePercent ? Math.round((stats?.totalOwners || 0) * (stats?.ownersMonthChangePercent / 100)) : 0}
                    </div>
                    <span className={styles.trendText}>Kenaikan dari bulan sebelumnya</span>
                  </div>
                </>
              )}
            </div>

            {/* Total Ruangan */}
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Total Ruangan:</div>
              {dashboardLoading && !stats ? (
                <>
                  <div className={styles.skeletonValue} />
                  <div className={styles.skeletonText} />
                </>
              ) : (
                <>
                  <div className={styles.statValue}>
                    {stats?.totalRooms || 0}
                    <span className={styles.statValueIcon}>
                      <OfficeIcon />
                    </span>
                  </div>
                  <div className={styles.trendContainer}>
                    <div className={`${styles.statBadge} ${styles.green}`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                        <path d="M12 4v16" strokeLinecap="round" />
                        <path d="m6.5 9.5 5.5-5.5 5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {stats?.roomsMonthChangePercent ? Math.round((stats?.totalRooms || 0) * (stats?.roomsMonthChangePercent / 100)) : 0}
                    </div>
                    <span className={styles.trendText}>Kenaikan dari bulan sebelumnya</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* CHART + VERIFICATION */}
          <div className={styles.grid2}>
            {/* Chart */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Owner Map</span>
                <div className={styles.toggleGroup}>
                  <button
                    type="button"
                    className={`${styles.toggleBtn} ${chartPeriod === 'weekly' ? styles.active : ''}`}
                    onClick={() => setChartPeriod('weekly')}
                  >
                    Mingguan
                  </button>
                  <button
                    type="button"
                    className={`${styles.toggleBtn} ${chartPeriod === 'monthly' ? styles.active : ''}`}
                    onClick={() => setChartPeriod('monthly')}
                  >
                    Bulanan
                  </button>
                </div>
              </div>

              <div className={styles.chartContainer}>
                <div className={styles.chartY}>
                  {yAxisLabels.map((val) => (
                    <span key={val}>{val}</span>
                  ))}
                </div>

                <div className={styles.chartWrap}>
                  <div className={styles.chartArea}>
                    {yAxisLabels.map((_, index) => (
                      <div
                        key={index}
                        className={styles.chartGridLine}
                        style={{ top: `${(index / (yAxisLabels.length - 1)) * 272}px` }}
                      />
                    ))}
                  </div>
                  {dashboardLoading && activeChartData.length === 0 ? (
                    <>
                      {chartSkeletonHeights.slice(0, chartPeriod === 'weekly' ? 7 : 6).map((height, index) => (
                        <div key={index} className={styles.chartCol}>
                          <div className={styles.barWrap}>
                            <div className={`${styles.bar} ${styles.gray}`} style={{ height: `${height}px`, opacity: 0.45 }} />
                          </div>
                          <span className={styles.chartLabel}>-</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    activeChartData.map((data, index) => {
                      const barHeight = chartCeiling > 0 ? Math.round((data.value / chartCeiling) * chartVisualHeight) : 0;
                      return (
                        <div key={index} className={styles.chartCol}>
                          <div className={styles.barWrap}>
                            <div className={`${styles.bar} ${data.active ? styles.cyan : styles.gray}`} style={{ height: `${barHeight}px` }} />
                          </div>
                          <span className={styles.chartLabel}>{data.label}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Verification */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Verification</span>
                <span className={styles.badgeUnread}>{dashboardLoading ? '...' : `${pendingVerifications.length} unread`}</span>
              </div>

              <div className={styles.verifList}>
                {dashboardLoading && pendingVerifications.length === 0 ? (
                  <div className={styles.verifItem}>
                    <div className={styles.requestSkeletonLine} />
                    <div className={styles.requestSkeletonLineShort} />
                    <div className={styles.requestSkeletonLineText} />
                  </div>
                ) : (
                  pendingVerifications.map((verification) => (
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
                        <button className={styles.btnView} onClick={() => {
                          setSelectedVerification(verification);
                          setOverlayOpen(true);
                        }}>Lihat detail</button>
                        <button className={styles.btnClose} onClick={() => {
                          setSelectedVerification(verification);
                          handleReject();
                        }}>
                          Tolak
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {!dashboardLoading && pendingVerifications.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--gray-400)' }}>
                    No pending verifications
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <VerifyOwnerOverlay
        isOpen={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        onApprove={handleApprove}
        onReject={handleReject}
        verificationData={selectedVerification ? {
          name: selectedVerification.name,
          userId: selectedVerification.user_id,
          businessName: selectedVerification.business_name || '-',
          phone: selectedVerification.business_phone || '-',
          email: selectedVerification.email || '-',
          accountNumber: selectedVerification.account_number || '-',
          submittedAt: formatDate(selectedVerification.created_at),
          status: 'pending',
        } : undefined}
      />
    </div>
  );
}
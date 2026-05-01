'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './OwnerDashboard.module.css';
import DashboardIcon from '@/components/icons/DashboardIcon';
import ReviewsIcon from '@/components/icons/ReviewsIcon';
import ReportsIcon from '@/components/icons/ReportsIcon';
import HelpIcon from '@/components/icons/HelpIcon';
import { useOwnerDashboard, useFacilityRequests } from '@/hooks/useDashboard';

interface SessionUser {
  user_id: string;
  name: string;
  email: string;
  role: string;
}

function getStoredUser(): SessionUser | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const userData = localStorage.getItem('user');
  if (!userData) {
    return null;
  }

  try {
    return JSON.parse(userData) as SessionUser;
  } catch {
    return null;
  }
}

const chartSkeletonHeights = [68, 102, 84, 126, 94, 118, 76];
type ChartPeriod = 'weekly' | 'monthly';
const chartVisualHeight = 300;

export default function OwnerDashboard() {
  const router = useRouter();
  const [user] = useState<SessionUser | null>(() => getStoredUser());
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError, refetch } = useOwnerDashboard(user?.user_id || null);
  const { updateRequestStatus } = useFacilityRequests(user?.user_id || null, { autoFetch: false });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeNav, setActiveNav] = useState(0);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('weekly');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!accountMenuRef.current) {
        return;
      }

      if (!accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter rooms based on search
  const filteredRooms = dashboardData?.rooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.room_id.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleAcceptRequest = async (requestId: string) => {
    const success = await updateRequestStatus(requestId, 'approved');
    if (success) {
      refetch();
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    const success = await updateRequestStatus(requestId, 'rejected');
    if (success) {
      refetch();
    }
  };

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

  const stats = dashboardData?.stats;
  const chartData = dashboardData?.chartData || { weekly: [], monthly: [] };
  const activeChartData = chartPeriod === 'weekly' ? chartData.weekly : chartData.monthly;
  const pendingRequests = (dashboardData?.facilityRequests || []).filter(req => req.status === 'pending');

  const chartMaxValue = Math.max(...activeChartData.map((item) => item.value), 0);
  const chartScaleStep = chartMaxValue > 5 ? Math.max(1, Math.ceil(chartMaxValue / 5)) : 1;
  const chartCeiling = chartMaxValue > 0
    ? (chartMaxValue > 5 ? chartScaleStep * 5 : chartMaxValue)
    : 1;
  const yAxisLabels = chartMaxValue > 0
    ? (chartMaxValue > 5
      ? Array.from({ length: 6 }, (_, index) => String(chartCeiling - (index * chartScaleStep)))
      : Array.from({ length: chartCeiling + 1 }, (_, index) => String(chartCeiling - index)))
    : ['1', '0'];

  if (dashboardError) {
    return (
      <div className={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'red', padding: '24px', textAlign: 'center' }}>
          Error: {dashboardError}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* SIDEBAR */}
      <aside className={styles.sidebar}>
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
            <div className={styles.userAvatar}>{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
            <div className={styles.userInfo}>
              <strong>{user?.name || 'User'}</strong>
              <span>Owner</span>
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
                <span className={styles.accountDropdownName}>{user?.name || 'User'}</span>
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
          {[
            { Icon: DashboardIcon, label: 'Dashboard' },
            { Icon: ReviewsIcon, label: 'Review & Feedback' },
            { Icon: ReportsIcon, label: 'Laporan Transaksi' },
            { Icon: HelpIcon, label: 'Bantuan' },
          ].map((item, index) => (
            <div
              key={index}
              className={`${styles.navItem} ${activeNav === index ? styles.active : ''}`}
              onClick={() => setActiveNav(index)}
            >
              <item.Icon className={styles.navIcon} />
              {item.label}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarCta}>
          <button
            type="button"
            className={styles.sidebarCtaButton}
            onClick={() => router.push('/customer/dashboard')}
          >
            <span className={styles.sidebarCtaIcon} aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m20 20-3.8-3.8" strokeLinecap="round" />
              </svg>
            </span>
            <span className={styles.sidebarCtaCopy}>
              <strong>Cari Ruangan</strong>
              <span>Jelajahi katalog ruangan</span>
            </span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className={styles.main}>
        {/* TOPBAR */}
        <div className={styles.topbar}>
          <h1>Dashboard Owner</h1>
          <span className={styles.topbarDate}>
            {formatTopbarDate()}
          </span>
        </div>

        {/* CONTENT */}
        <div className={styles.content}>
          {/* STAT CARDS */}
          <div className={styles.statCards}>
            {/* Total Pendapatan */}
            <div className={`${styles.statCard} ${styles.highlight}`}>
              <div className={styles.label}>Total Pendapatan:</div>
              {dashboardLoading && !stats ? (
                <>
                  <div style={{ height: '28px', background: '#e0e0e0', borderRadius: '4px', marginBottom: '8px' }}></div>
                  <div style={{ height: '12px', background: '#e0e0e0', borderRadius: '4px', width: '80%' }}></div>
                </>
              ) : (
                <>
                  <div className={styles.value}>{formatCurrency(stats?.totalRevenue || 0)}</div>
                  <div className={`${styles.statBadge} ${styles.up}`}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M18 15l-6-6-6 6" />
                    </svg>
                    {formatChangeLabel(stats?.revenueMonthChangePercent ?? null, 'Belum ada data perbandingan bulan sebelumnya')}
                  </div>
                </>
              )}
            </div>

            {/* Total Penyewaan */}
            <div className={styles.statCard}>
              <div className={styles.label}>Total Penyewaan:</div>
              {dashboardLoading && !stats ? (
                <>
                  <div style={{ height: '28px', background: '#e0e0e0', borderRadius: '4px', marginBottom: '8px' }}></div>
                  <div style={{ height: '12px', background: '#e0e0e0', borderRadius: '4px', width: '80%' }}></div>
                </>
              ) : (
                <>
                  <div className={styles.value}>{stats?.totalBookings || 0}</div>
                  <div className={`${styles.statBadge} ${styles.upWhite}`}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M18 15l-6-6-6 6" />
                    </svg>
                    {formatChangeLabel(stats?.bookingsMonthChangePercent ?? null, 'Belum ada data perbandingan bulan sebelumnya')}
                  </div>
                </>
              )}
            </div>

            {/* Total Ruangan */}
            <div className={styles.statCard}>
              <div className={styles.label}>Total Ruangan Tersedia:</div>
              {dashboardLoading && !stats ? (
                <>
                  <div style={{ height: '28px', background: '#e0e0e0', borderRadius: '4px', marginBottom: '8px' }}></div>
                  <div style={{ height: '12px', background: '#e0e0e0', borderRadius: '4px', width: '80%' }}></div>
                </>
              ) : (
                <>
                  <div className={styles.value}>
                    {stats?.availableRooms || 0}<span style={{ fontSize: '16px', color: 'var(--gray-400)', fontWeight: 600 }}>/{stats?.totalRooms || 0}</span>
                  </div>
                  <div className={styles.valueSub}>{(stats?.totalRooms || 0) - (stats?.availableRooms || 0)} ruangan sedang dalam peminjaman</div>
                </>
              )}
            </div>
          </div>

          {/* CHART + REQUEST */}
          <div className={styles.grid2}>
            {/* Chart */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Customer Map</span>
                <div className={styles.toggleGroup}>
                  <button
                    className={`${styles.toggleBtn} ${chartPeriod === 'weekly' ? styles.active : ''}`}
                    onClick={() => setChartPeriod('weekly')}
                  >
                    Mingguan
                  </button>
                  <button
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
                  {dashboardLoading && activeChartData.length === 0 ? (
                    <>
                      {chartSkeletonHeights.slice(0, chartPeriod === 'weekly' ? 7 : 6).map((height, i) => (
                        <div key={i} className={styles.chartCol} style={{ opacity: 0.5 }}>
                          <div className={styles.barWrap}>
                            <div
                              className={`${styles.bar} ${styles.gray}`}
                              style={{ height: `${height}px`, background: '#e0e0e0' }}
                            />
                          </div>
                          <span className={styles.chartLabel} style={{ background: '#e0e0e0', display: 'inline-block', width: '30px', height: '12px', borderRadius: '4px', marginTop: '4px' }}></span>
                        </div>
                      ))}
                    </>
                  ) : (
                    activeChartData.map((data, idx) => {
                      const barHeight = chartCeiling > 0 ? Math.round((data.value / chartCeiling) * chartVisualHeight) : 0;
                      return (
                        <div key={idx} className={styles.chartCol}>
                          <div className={styles.barWrap}>
                            <div
                              className={`${styles.bar} ${data.active ? styles.cyan : styles.gray}`}
                              style={{ height: `${barHeight}px` }}
                            />
                          </div>
                          <span className={styles.chartLabel}>{data.label}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Request */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Request</span>
                <span className={styles.badgeUnread}>
                  {dashboardLoading ? '...' : pendingRequests.length} unread
                </span>
              </div>

              {dashboardLoading && pendingRequests.length === 0 ? (
                <div className={styles.requestList}>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
                      <div style={{ height: '14px', background: '#e0e0e0', borderRadius: '4px', marginBottom: '8px', width: '60%' }}></div>
                      <div style={{ height: '12px', background: '#e0e0e0', borderRadius: '4px', marginBottom: '8px', width: '40%' }}></div>
                      <div style={{ height: '12px', background: '#e0e0e0', borderRadius: '4px', width: '30%' }}></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.requestList}>
                  {pendingRequests.map((request) => (
                    <div key={request.request_id} className={styles.requestItem}>
                      <div className={styles.requestTop}>
                        <span className={styles.requestName}>{request.customer_name || request.customer_id || 'Unknown Customer'}</span>
                        <span className={styles.requestTime}>{formatDate(request.created_at)}</span>
                      </div>
                      <div className={styles.roomTag}>
                        {request.room_name || 'Unknown Room'}
                      </div>
                      <div className={styles.requestMsg}>{request.message || request.details || 'No details provided'}</div>
                      <div className={styles.requestActions}>
                        <button
                          className={styles.btnAccept}
                          onClick={() => handleAcceptRequest(request.request_id)}
                        >
                          Accept
                        </button>
                        <button
                          className={styles.btnDecline}
                          onClick={() => handleDeclineRequest(request.request_id)}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}

                  {pendingRequests.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--gray-400)' }}>
                      No pending requests
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ROOM TABLE */}
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <span className={styles.tableTitle}>Daftar Ruangan</span>
              <div className={styles.tableActions}>
                <div className={styles.searchBox}>
                  <input
                    type="text"
                    placeholder="Cari ruangan"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </div>
                <button
                  type="button"
                  className={styles.addRoomButton}
                  onClick={() => router.push('/owner/rooms/add')}
                >
                  Tambah Ruangan
                </button>
              </div>
            </div>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Room name</th>
                  <th>Room ID</th>
                  <th>Capacity</th>
                  <th>Hourly Rate</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboardLoading && filteredRooms.length === 0 ? (
                  <>
                    {[...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td><div style={{ height: '12px', background: '#e0e0e0', borderRadius: '4px', width: '80px' }}></div></td>
                        <td><div style={{ height: '12px', background: '#e0e0e0', borderRadius: '4px', width: '60px' }}></div></td>
                        <td><div style={{ height: '12px', background: '#e0e0e0', borderRadius: '4px', width: '40px' }}></div></td>
                        <td><div style={{ height: '12px', background: '#e0e0e0', borderRadius: '4px', width: '70px' }}></div></td>
                        <td><div style={{ height: '12px', background: '#e0e0e0', borderRadius: '4px', width: '50px' }}></div></td>
                      </tr>
                    ))}
                  </>
                ) : (
                  filteredRooms.map((room) => (
                    <tr key={room.room_id}>
                      <td>{room.name}</td>
                      <td>{room.room_id}</td>
                      <td>
                        <div className={styles.capacityCell}>
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                          {room.capacity}
                        </div>
                      </td>
                      <td>{formatCurrency(room.price_per_hour)}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${room.is_available ? styles.available : styles.booked}`}>
                          {room.is_available ? 'available' : 'booked'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {!dashboardLoading && filteredRooms.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--gray-400)' }}>
                {searchQuery ? 'No rooms found matching your search' : 'No rooms available'}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}



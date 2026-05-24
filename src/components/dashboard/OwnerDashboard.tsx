'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import styles from './OwnerDashboard.module.css';
import { useOwnerDashboard, useFacilityRequests } from '@/hooks/useDashboard';

interface SessionUser {
  user_id: string;
  name: string;
  email: string;
  role: string;
}

type ChartPeriod = 'weekly' | 'monthly';

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

const chartVisualHeight = 272;
const chartSkeletonHeights = [84, 156, 112, 178, 136, 98, 164];

export default function OwnerDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('weekly');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement | null>(null);

  const { data: dashboardData, loading: dashboardLoading, error: dashboardError, refetch } = useOwnerDashboard(user?.user_id || null);
  const { updateRequestStatus } = useFacilityRequests(user?.user_id || null, { autoFetch: false });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
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

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const filteredRooms = (dashboardData?.rooms || []).filter((room) => {
    const query = searchQuery.toLowerCase();
    return room.name.toLowerCase().includes(query) || room.room_id.toLowerCase().includes(query);
  });

  const stats = dashboardData?.stats;
  const chartData = dashboardData?.chartData || { weekly: [], monthly: [] };
  const activeChartData = chartPeriod === 'weekly' ? chartData.weekly : chartData.monthly;
  const pendingRequests = (dashboardData?.facilityRequests || []).filter((req) => req.status === 'pending');

  const chartMaxValue = Math.max(...activeChartData.map((item) => item.value), 0);
  const chartScaleStep = chartMaxValue > 5 ? Math.max(1, Math.ceil(chartMaxValue / 5)) : 1;
  const chartCeiling = chartMaxValue > 0 ? (chartMaxValue > 5 ? chartScaleStep * 5 : chartMaxValue) : 1;
  const yAxisLabels = chartMaxValue > 0
    ? (chartMaxValue > 5
      ? Array.from({ length: 6 }, (_, index) => String(chartCeiling - (index * chartScaleStep)))
      : Array.from({ length: chartCeiling + 1 }, (_, index) => String(chartCeiling - index)))
    : ['1', '0'];

  const roomRows = useMemo(() => {
    if (dashboardLoading && filteredRooms.length === 0) {
      return [];
    }
    return filteredRooms;
  }, [dashboardLoading, filteredRooms]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatTopbarDate = () => {
    const date = new Date();
    const formatted = date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const formatRequestTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

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

  const formatChangeLabel = (value: number | null, fallback: string) => {
    if (value === null) {
      return fallback;
    }

    const percent = Math.abs(Math.round(value));
    const trend = value >= 0 ? 'Kenaikan dari bulan sebelumnya' : 'Penurunan dari bulan sebelumnya';
    return `${percent}% ${trend}`;
  };

  const navItems = [
    { label: 'Dashboard', path: '/owner/dashboard', isActive: pathname === '/owner/dashboard' },
    { label: 'Profil', path: '/owner/profile', isActive: pathname.startsWith('/customer/profile') },
    { label: 'Review & Feedback', path: '/owner/reviews', isActive: pathname.startsWith('/owner/dashboard/facility-requests') },
    { label: 'Laporan Transaksi', path: '/owner/reports', isActive: pathname.startsWith('/owner/reports') },
    { label: 'Tambah Ruangan', path: '/owner/rooms/add', isActive: pathname.startsWith('/owner/rooms/add') },
    { label: 'Bantuan', path: '/owner/faq', isActive: false },
  ];

  if (dashboardError) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>Error: {dashboardError}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {sidebarOpen && (
        <div
          className={styles.sidebarBackdrop}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
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
            onClick={() => router.push('/customer/dashboard')}
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

      <main className={styles.main}>
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
            <h1>Dashboard Owner</h1>
          </div>
          <span className={styles.topbarDate}>{formatTopbarDate()}</span>
        </div>

        <div className={styles.content}>
          <div className={styles.statCards}>
            <div className={`${styles.statCard} ${styles.highlight}`}>
              <div className={styles.label}>Total Pendapatan:</div>
              {dashboardLoading && !stats ? (
                <>
                  <div className={styles.skeletonValue} />
                  <div className={styles.skeletonText} />
                </>
              ) : (
                <>
                  <div className={styles.value}>{formatCurrency(stats?.totalRevenue || 0)}</div>
                  <div className={`${styles.statBadge} ${styles.up}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <path d="m5 14 7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {formatChangeLabel(stats?.revenueMonthChangePercent ?? null, 'Belum ada data perbandingan')}
                  </div>
                </>
              )}
            </div>

            <div className={styles.statCard}>
              <div className={styles.label}>Total Penyewaan:</div>
              {dashboardLoading && !stats ? (
                <>
                  <div className={styles.skeletonValue} />
                  <div className={styles.skeletonText} />
                </>
              ) : (
                <>
                  <div className={styles.value}>{stats?.totalBookings || 0}</div>
                  <div className={`${styles.statBadge} ${styles.upWhite}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <path d="M12 4v16" strokeLinecap="round" />
                      <path d="m6.5 9.5 5.5-5.5 5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {formatChangeLabel(stats?.bookingsMonthChangePercent ?? null, 'Belum ada data perbandingan')}
                  </div>
                </>
              )}
            </div>

            <div className={styles.statCard}>
              <div className={styles.label}>Total Ruangan Tersedia:</div>
              {dashboardLoading && !stats ? (
                <>
                  <div className={styles.skeletonValue} />
                  <div className={styles.skeletonText} />
                </>
              ) : (
                <>
                  <div className={styles.value}>
                    {stats?.availableRooms || 0}
                    <span className={styles.valueDivider}>/{stats?.totalRooms || 0}</span>
                  </div>
                  <div className={styles.valueSub}>{(stats?.totalRooms || 0) - (stats?.availableRooms || 0)} ruangan sedang dalam peminjaman</div>
                </>
              )}
            </div>
          </div>

          <div className={styles.grid2}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Customer Map</span>
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

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Request</span>
                <span className={styles.badgeUnread}>{dashboardLoading ? '...' : `${pendingRequests.length} Pesan belum dibaca`}</span>
              </div>

              {dashboardLoading && pendingRequests.length === 0 ? (
                <div className={styles.requestList}>
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className={styles.requestItem}>
                      <div className={styles.requestSkeletonLine} />
                      <div className={styles.requestSkeletonLineShort} />
                      <div className={styles.requestSkeletonLineText} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.requestList}>
                  {pendingRequests.map((request) => (
                    <div key={request.request_id} className={styles.requestItem}>
                      <div className={styles.requestTop}>
                        <span className={styles.requestName}>{request.customer_name || request.customer_id || 'Unknown Customer'}</span>
                        <span className={styles.requestTime}>{formatRequestTime(request.created_at)}</span>
                      </div>
                      <div className={styles.roomTag}>{request.room_name || 'Ruang Tanpa Nama'}</div>
                      <div className={styles.requestMsg}>{request.message || request.details || 'Tidak ada detail request'}</div>
                      <div className={styles.requestActions}>
                        <button
                          type="button"
                          className={styles.btnAccept}
                          onClick={() => handleAcceptRequest(request.request_id)}
                        >
                          Terima
                        </button>
                        <button
                          type="button"
                          className={styles.btnDecline}
                          onClick={() => handleDeclineRequest(request.request_id)}
                        >
                          Tolak
                        </button>
                      </div>
                    </div>
                  ))}

                  {!dashboardLoading && pendingRequests.length === 0 && (
                    <div className={styles.emptyInCard}>Belum ada request masuk.</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <span className={styles.tableTitle}>Daftar Ruangan</span>
              <div className={styles.searchBox}>
                <input
                  type="text"
                  placeholder="Cari ruangan"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {dashboardLoading && roomRows.length === 0 ? (
                  [...Array(6)].map((_, index) => (
                    <tr key={index}>
                      <td><div className={styles.tableSkeletonShort} /></td>
                      <td><div className={styles.tableSkeletonTiny} /></td>
                      <td><div className={styles.tableSkeletonTiny} /></td>
                      <td><div className={styles.tableSkeletonShort} /></td>
                      <td><div className={styles.tableSkeletonTiny} /></td>
                      <td><div className={styles.tableSkeletonTiny} /></td>
                    </tr>
                  ))
                ) : (
                  roomRows.map((room) => (
                    <tr key={room.room_id}>
                      <td>{room.name}</td>
                      <td>{room.room_id}</td>
                      <td>
                        <span className={styles.capacityCell}>
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                          {room.capacity}
                        </span>
                      </td>
                      <td>{formatCurrency(room.price_per_hour)}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${room.is_available ? styles.available : styles.booked}`}>
                          {room.is_available ? 'tersedia' : 'booked'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.edit}`}
                            onClick={() => router.push(`/owner/rooms/edit/id?id=${room.room_id}`)}
                            aria-label="Edit ruangan"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.delete}`}
                            aria-label="Hapus ruangan"
                            title="Fitur hapus segera tersedia"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <path d="M3 6h18" />
                              <path d="M8 6V4h8v2" />
                              <path d="M19 6l-1 14H6L5 6" />
                              <path d="M10 11v6M14 11v6" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {!dashboardLoading && roomRows.length === 0 && (
              <div className={styles.emptyTable}>{searchQuery ? 'Ruangan tidak ditemukan.' : 'Belum ada ruangan.'}</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

'use client';

import styles from './VerifyOwnerOverlay.module.css';

interface VerifyOwnerOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  verificationData?: {
    name: string;
    userId: string;
    businessName: string;
    phone: string;
    email: string;
    accountNumber: string;
    submittedAt: string;
    status: 'pending' | 'approved' | 'rejected';
  };
}

export default function VerifyOwnerOverlay({
  isOpen,
  onClose,
  onApprove,
  onReject,
  verificationData,
}: VerifyOwnerOverlayProps) {
  if (!isOpen) return null;

  const data = verificationData || {
    name: 'Ramon Tanque',
    userId: 'USR-KSDH234',
    businessName: 'Wededed Room',
    phone: '0812-2345-5678',
    email: 'gagaduhanageung@gmail.com',
    accountNumber: '1234-3242-2344',
    submittedAt: '20 April 2026, 08:36 WIB',
    status: 'pending' as const,
  };

  const handleApprove = () => {
    onApprove?.();
    onClose();
  };

  const handleReject = () => {
    onReject?.();
    onClose();
  };

  const statusClass =
    data.status === 'approved'
      ? styles.statusApproved
      : data.status === 'rejected'
      ? styles.statusRejected
      : styles.statusPending;

  const statusLabel =
    data.status === 'approved' ? 'Disetujui' : data.status === 'rejected' ? 'Ditolak' : 'Pending';

  const detailRows: { label: string; value: string }[] = [
    { label: 'ID Pengguna', value: data.userId },
    { label: 'Nama Lengkap', value: data.name },
    { label: 'Nama Bisnis', value: data.businessName },
    { label: 'Nomor Telepon', value: data.phone },
    { label: 'Alamat Email', value: data.email },
    { label: 'Nomor Rekening', value: data.accountNumber },
  ];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.overlayContent} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.overlayHeader}>
          <h2 className={styles.overlayTitle}>Verifikasi Owner</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Tutup">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
              <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className={styles.overlayBody}>

          {/* Pemohon Card */}
          <div className={styles.applicantCard}>
            <div className={styles.applicantLeft}>
              <div className={styles.applicantName}>Pemohon : {data.name}</div>
              <div className={styles.submittedTime}>Waktu Pengajuan : {data.submittedAt}</div>
            </div>
            <div className={styles.applicantRight}>
              <span className={styles.statusLabel}>Status :</span>
              <span className={`${styles.statusBadge} ${statusClass}`}>{statusLabel}</span>
            </div>
          </div>

          {/* Informasi Pemohon Card */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardHeader}>
              <h3 className={styles.infoCardTitle}>Informasi Pemohon</h3>
              <p className={styles.infoCardSubtitle}>Informasi mengenai identitas owner</p>
            </div>
            <div className={styles.detailList}>
              {detailRows.map((row) => (
                <div key={row.label} className={styles.detailRow}>
                  <span className={styles.detailLabel}>{row.label}</span>
                  <span className={styles.detailSeparator}>:</span>
                  <span className={styles.detailValue}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.overlayFooter}>
          <button className={`${styles.actionButton} ${styles.rejectButton}`} onClick={handleReject}>
            Tolak
          </button>
          <button className={`${styles.actionButton} ${styles.approveButton}`} onClick={handleApprove}>
            Setuju
          </button>
        </div>

      </div>
    </div>
  );
}

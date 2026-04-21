'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

type OwnerVerification = {
  owner_id: string
  user_id: string
  account_number: string
  status: 'pending' | 'active' | 'rejected'
  business_name: string
  business_phone: string
  applied_at: string | null
  approved_at: string | null
  user: {
    user_id: string
    name: string
    email: string
    role: string
    phone_number: string | null
  } | null
}

export default function VerifyRoomsPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<OwnerVerification[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadPendingApplications() {
      try {
        const response = await fetch('/api/owner-applications?status=pending')
        const result = await response.json()

        if (!isMounted) {
          return
        }

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Gagal memuat daftar verifikasi owner.')
        }

        setApplications(result.data ?? [])
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Gagal memuat daftar verifikasi owner.')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadPendingApplications()

    return () => {
      isMounted = false
    }
  }, [])

  async function handleDecision(ownerId: string, status: 'approved' | 'rejected') {
    setProcessingId(ownerId)
    setError(null)

    try {
      const response = await fetch('/api/owner-applications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner_id: ownerId,
          status,
        }),
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal memproses pengajuan owner.')
      }

      setApplications((current) => current.filter((application) => application.owner_id !== ownerId))
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : 'Gagal memproses pengajuan owner.')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Admin Review</span>
          <h1>Verifikasi Pengajuan Owner</h1>
          <p>Tinjau data bisnis customer yang ingin menjadi owner dan putuskan secara manual.</p>
        </div>
        <button type="button" className={styles.backButton} onClick={() => router.push('/admin/dashboard')}>
          Kembali ke Dashboard
        </button>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      {loading ? (
        <div className={styles.emptyState}>Memuat daftar pengajuan owner...</div>
      ) : applications.length === 0 ? (
        <div className={styles.emptyState}>Belum ada pengajuan owner yang menunggu verifikasi.</div>
      ) : (
        <div className={styles.grid}>
          {applications.map((application) => (
            <article key={application.owner_id} className={styles.card}>
              <div className={styles.cardTop}>
                <div>
                  <span className={styles.cardLabel}>Pengajuan Owner</span>
                  <h2>{application.user?.name ?? application.business_name}</h2>
                </div>
                <span className={styles.pendingBadge}>Pending</span>
              </div>

              <dl className={styles.details}>
                <div>
                  <dt>Email</dt>
                  <dd>{application.user?.email ?? '-'}</dd>
                </div>
                <div>
                  <dt>Nama Bisnis</dt>
                  <dd>{application.business_name}</dd>
                </div>
                <div>
                  <dt>Nomor Rekening</dt>
                  <dd>{application.account_number}</dd>
                </div>
                <div>
                  <dt>Nomor Telepon</dt>
                  <dd>{application.business_phone}</dd>
                </div>
                <div>
                  <dt>Diajukan Pada</dt>
                  <dd>{application.applied_at ?? '-'}</dd>
                </div>
              </dl>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.approveButton}
                  disabled={processingId === application.owner_id}
                  onClick={() => handleDecision(application.owner_id, 'approved')}
                >
                  {processingId === application.owner_id ? 'Memproses...' : 'Setujui'}
                </button>
                <button
                  type="button"
                  className={styles.rejectButton}
                  disabled={processingId === application.owner_id}
                  onClick={() => handleDecision(application.owner_id, 'rejected')}
                >
                  Tolak
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

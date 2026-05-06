'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@/types'
import styles from './page.module.css'

type OwnerApplication = {
  owner_id: string
  account_number: string
  status: 'pending' | 'active' | 'rejected'
  business_name: string
  business_phone: string
  applied_at: string | null
  approved_at: string | null
}

type FormState = {
  name: string
  account_number: string
  business_name: string
  business_phone: string
}

const initialFormState: FormState = {
  name: '',
  account_number: '',
  business_name: '',
  business_phone: '',
}

export default function OwnerApplicationPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [application, setApplication] = useState<OwnerApplication | null>(null)
  const [form, setForm] = useState<FormState>(initialFormState)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadApplication() {
      const stored = localStorage.getItem('user')
      if (!stored) {
        router.push('/auth/login')
        return
      }

      try {
        const parsedUser = JSON.parse(stored) as User
        if (!isMounted) {
          return
        }

        setUser(parsedUser)

        const response = await fetch(`/api/owner-applications?user_id=${encodeURIComponent(parsedUser.user_id)}`)
        const result = await response.json()

        if (!isMounted) {
          return
        }

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Gagal memuat data pengajuan owner.')
        }

        const latestUser = result.data?.user as User | undefined
        const ownerApplication = result.data?.application as OwnerApplication | null | undefined

        if (latestUser) {
          setUser(latestUser)
          localStorage.setItem('user', JSON.stringify(latestUser))
        }

        setApplication(ownerApplication ?? null)
        setForm({
          name: latestUser?.name ?? parsedUser.name ?? '',
          account_number: ownerApplication?.account_number ?? '',
          business_name: ownerApplication?.business_name ?? '',
          business_phone: ownerApplication?.business_phone ?? latestUser?.phone_number ?? '',
        })
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Gagal memuat data pengajuan owner.')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadApplication()

    return () => {
      isMounted = false
    }
  }, [router])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) {
      return
    }

    setSubmitting(true)
    setMessage(null)
    setError(null)

    try {
      const response = await fetch('/api/owner-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.user_id,
          ...form,
        }),
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal mengirim pengajuan owner.')
      }

      const refreshedResponse = await fetch(`/api/owner-applications?user_id=${encodeURIComponent(user.user_id)}`)
      const refreshedResult = await refreshedResponse.json()

      if (!refreshedResponse.ok || !refreshedResult.success) {
        throw new Error(refreshedResult.message || 'Pengajuan terkirim, tetapi data terbaru gagal dimuat.')
      }

      const latestUser = refreshedResult.data?.user as User | undefined
      const ownerApplication = refreshedResult.data?.application as OwnerApplication | null | undefined

      if (latestUser) {
        setUser(latestUser)
        localStorage.setItem('user', JSON.stringify(latestUser))
      }

      setApplication(ownerApplication ?? null)
      setMessage(result.message || 'Pengajuan owner berhasil dikirim.')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Gagal mengirim pengajuan owner.')
    } finally {
      setSubmitting(false)
    }
  }

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const applicationStatus = application?.status ?? null
  const isOwnerActive = user?.role === 'owner' || applicationStatus === 'active'
  const isPending = applicationStatus === 'pending'

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <p className={styles.loading}>Memuat data pengajuan owner...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <span className={styles.eyebrow}>Program Owner</span>
            <h1>Ajukan Ruangan Anda ke Roomify</h1>
            <p>
              Isi data bisnis untuk mendaftarkan akun Anda sebagai owner. Pengajuan akan ditinjau admin secara manual
              sebelum akses dashboard owner dibuka.
            </p>
          </div>
          <button type="button" className={styles.backButton} onClick={() => router.push('/customer/dashboard')}>
            Kembali
          </button>
        </div>

        {message && <div className={styles.successBox}>{message}</div>}
        {error && <div className={styles.errorBox}>{error}</div>}

        {isOwnerActive && (
          <div className={styles.statusPanel}>
            <span className={`${styles.statusBadge} ${styles.active}`}>Owner Active</span>
            <h2>Pengajuan Anda sudah disetujui</h2>
            <p>
              Akun Anda sekarang berstatus owner. Anda sudah bisa mengelola ruangan dan membuka dashboard owner kapan pun.
            </p>
            <button type="button" className={styles.primaryButton} onClick={() => router.push('/owner/dashboard')}>
              Buka Dashboard Owner
            </button>
          </div>
        )}

        {!isOwnerActive && (
          <>
            <div className={styles.statusPanel}>
              <span className={`${styles.statusBadge} ${isPending ? styles.pending : styles.idle}`}>
                {isPending ? 'Pending Review' : applicationStatus === 'rejected' ? 'Perlu Diperbarui' : 'Belum Diajukan'}
              </span>
              <h2>{isPending ? 'Pengajuan sedang ditinjau admin' : 'Lengkapi data bisnis Anda'}</h2>
              <p>
                {isPending
                  ? 'Anda masih bisa memperbarui data pengajuan jika ada yang perlu dikoreksi sebelum admin menyetujui.'
                  : 'Nama pemilik, nomor rekening, nama bisnis, dan nomor telepon akan digunakan untuk proses verifikasi owner.'}
              </p>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <label className={styles.field}>
                <span>Nama Pemilik</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="Masukkan nama lengkap"
                />
              </label>

              <label className={styles.field}>
                <span>Nomor Rekening</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.account_number}
                  onChange={(event) => updateField('account_number', event.target.value)}
                  placeholder="Masukkan nomor rekening"
                />
              </label>

              <label className={styles.field}>
                <span>Nama Bisnis</span>
                <input
                  type="text"
                  value={form.business_name}
                  onChange={(event) => updateField('business_name', event.target.value)}
                  placeholder="Contoh: Ruang Kreatif Nusantara"
                />
              </label>

              <label className={styles.field}>
                <span>Nomor Telepon</span>
                <input
                  type="tel"
                  value={form.business_phone}
                  onChange={(event) => updateField('business_phone', event.target.value)}
                  placeholder="Contoh: 081234567890"
                />
              </label>

              <div className={styles.actions}>
                <button type="submit" className={styles.primaryButton} disabled={submitting}>
                  {submitting ? 'Mengirim...' : isPending ? 'Perbarui Pengajuan' : 'Kirim Pengajuan'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

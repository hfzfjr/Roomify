'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@/types'
import BackButton from '@/components/ui/BackButton'
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
  business_name: string
  business_email: string
  business_phone: string
  account_number: string
  sync_name: boolean
  sync_email: boolean
  sync_phone: boolean
}

const initialFormState: FormState = {
  name: '',
  business_name: '',
  business_email: '',
  business_phone: '',
  account_number: '',
  sync_name: false,
  sync_email: false,
  sync_phone: false,
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
          business_name: ownerApplication?.business_name ?? '',
          business_email: latestUser?.email ?? parsedUser.email ?? '',
          business_phone: ownerApplication?.business_phone ?? latestUser?.phone_number ?? '',
          account_number: ownerApplication?.account_number ?? '',
          sync_name: false,
          sync_email: false,
          sync_phone: false,
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
    <div className={styles.pageContainer}>
      <BackButton href="/customer/dashboard" title="Daftar Owner" />
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div>
              <h1>Daftar Sebagai Mitra</h1>
              <p>Kelola penyewaan ruangan bisnis Anda dengan sistem yang terintegrasi</p>
            </div>
          </div>

          {message && <div className={styles.successBox}>{message}</div>}
          {error && <div className={styles.errorBox}>{error}</div>}

          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span>Nama Pemilik</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                placeholder="Masukkan nama lengkap"
              />
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={form.sync_name}
                  onChange={(event) => updateField('sync_name', event.target.checked)}
                />
                <span>Sesuaikan dengan nama di mode Customer</span>
              </label>
            </label>

            <label className={styles.field}>
              <span>Nama Bisnis</span>
              <input
                type="text"
                value={form.business_name}
                onChange={(event) => updateField('business_name', event.target.value)}
                placeholder="Masukkan nama bisnis"
              />
            </label>

            <label className={styles.field}>
              <span>Email Bisnis</span>
              <input
                type="email"
                value={form.business_email}
                onChange={(event) => updateField('business_email', event.target.value)}
                placeholder="Masukkan email bisnis"
              />
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={form.sync_email}
                  onChange={(event) => updateField('sync_email', event.target.checked)}
                />
                <span>Sesuaikan dengan email di mode Customer</span>
              </label>
            </label>

            <label className={styles.field}>
              <span>Nomor Telepon Operasional</span>
              <input
                type="tel"
                value={form.business_phone}
                onChange={(event) => updateField('business_phone', event.target.value)}
                placeholder="Masukkan nomor telepon"
              />
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={form.sync_phone}
                  onChange={(event) => updateField('sync_phone', event.target.checked)}
                />
                <span>Sesuaikan dengan nomor telepon di mode Customer</span>
              </label>
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

            <div className={styles.actions}>
              <button type="submit" className={styles.primaryButton} disabled={submitting}>
                {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

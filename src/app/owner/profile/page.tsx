'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProfilePage from '@/components/profile/ProfilePage'
import styles from './page.module.css'
import { User } from '@/types'

type OwnerApplication = {
  owner_id: string
  account_number: string
  status: 'pending' | 'active' | 'rejected'
  business_name: string
  business_phone: string
  business_email: string
  applied_at: string | null
  approved_at: string | null
}

export default function OwnerProfilePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'personal' | 'business'>('personal')
  const [user, setUser] = useState<User | null>(null)
  const [application, setApplication] = useState<OwnerApplication | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const stored = localStorage.getItem('user')
      if (!stored) {
        router.push('/auth/login')
        return
      }

      try {
        const parsedUser = JSON.parse(stored) as User
        setUser(parsedUser)

        const response = await fetch(`/api/owner-applications?user_id=${encodeURIComponent(parsedUser.user_id)}`)
        const result = await response.json()

        if (response.ok && result.success) {
          const ownerApplication = result.data?.application as OwnerApplication | null | undefined
          setApplication(ownerApplication ?? null)
        }
      } catch {
        // Error handling
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [router])

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.logo}>ROOMIFY</div>
          <div className={styles.greeting}>Hai, {user?.name?.split(' ')[0]}! {user?.name?.split(' ')[0]?.[0]}</div>
        </div>
        <div className={styles.content}>
          <div className={styles.loading}>Memuat data...</div>
        </div>
      </div>
    )
  }

  if (activeTab === 'personal') {
    return <ProfilePage showNavbar={false} />
  }

  const isBusinessTab = activeTab === 'business'

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.logo}>ROOMIFY</div>
        <div className={styles.greeting}>Hai, {user?.name?.split(' ')[0]}! {user?.name?.split(' ')[0]?.[0]}</div>
      </div>

      <div className={styles.content}>
        <div className={styles.sidebar}>
          <div className={styles.profileSection}>
            <div className={styles.avatarContainer}>
              {user?.profile_image ? (
                <img src={user.profile_image} alt="Profile" className={styles.avatarImage} />
              ) : (
                <div className={styles.avatar}>{user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}</div>
              )}
              <div className={styles.editIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>
            </div>
            <h3 className={styles.profileName}>{user?.name || '-'}</h3>
            <p className={styles.profileEmail}>{user?.email || '-'}</p>
          </div>

          <nav className={styles.navigation}>
            <button
              className={`${styles.navItem} ${!isBusinessTab ? styles.active : ''}`}
              onClick={() => setActiveTab('personal')}
            >
              Profil Pribadi
            </button>
            <button
              className={`${styles.navItem} ${isBusinessTab ? styles.active : ''}`}
              onClick={() => setActiveTab('business')}
            >
              Profil Bisnis
            </button>
          </nav>
        </div>

        <div className={styles.mainContent}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Informasi Bisnis</h2>
            <div className={styles.formGroup}>
              <label htmlFor="businessName">Nama Bisnis</label>
              <input
                type="text"
                id="businessName"
                className={styles.input}
                value={application?.business_name || ''}
                readOnly
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="businessEmail">Email Bisnis</label>
              <input
                type="email"
                id="businessEmail"
                className={styles.input}
                value={application?.business_email || user?.email || ''}
                readOnly
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="businessPhone">Nomor Telepon Operasional</label>
              <input
                type="tel"
                id="businessPhone"
                className={styles.input}
                value={application?.business_phone || ''}
                readOnly
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="accountNumber">Nomor Rekening</label>
              <input
                type="text"
                id="accountNumber"
                className={styles.input}
                value={application?.account_number || ''}
                readOnly
              />
            </div>
          </div>

          <div className={styles.actions}>
            <button className={styles.saveButton}>Simpan</button>
          </div>
        </div>
      </div>
    </div>
  )
}

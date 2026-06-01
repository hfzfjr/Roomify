'use client'

import { useEffect, useState } from 'react'
import '@/styles/profile.css'

export interface UserProfile {
  user_id: string
  name: string
  email: string
  phone_number: string | null
  profile_image: string | null
  created_at: string
}

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

interface ProfilePageProps {
  userType?: 'customer' | 'owner'
  showNavbar?: boolean
  NavbarComponent?: React.ComponentType
  onNavigateToBusiness?: () => void
  showBusinessTab?: boolean
}

export default function ProfilePage({ userType = 'customer', showNavbar = true, NavbarComponent, onNavigateToBusiness, showBusinessTab = false }: ProfilePageProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'personal' | 'business'>('personal')
  const [application, setApplication] = useState<OwnerApplication | null>(null)

  const [name, setName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    void fetchProfile()
  }, [])

  useEffect(() => {
    if (!profile) return

    const storedUser = localStorage.getItem('user')
    if (!storedUser) return

    const user = JSON.parse(storedUser)
    user.name = profile.name
    user.profile_image = profile.profile_image
    localStorage.setItem('user', JSON.stringify(user))
    window.dispatchEvent(new Event('storage'))
  }, [profile])

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      const user = JSON.parse(storedUser)
      setUserRole(user?.role || null)
    }
  }, [])

  useEffect(() => {
    if (!showBusinessTab || !userRole || userRole !== 'owner') return

    async function fetchBusinessData() {
      const storedUser = localStorage.getItem('user')
      if (!storedUser) return

      try {
        const parsedUser = JSON.parse(storedUser)

        const response = await fetch(`/api/owner-applications?user_id=${encodeURIComponent(parsedUser.user_id)}`)
        const result = await response.json()

        if (response.ok && result.success) {
          const ownerApplication = result.data?.application as OwnerApplication | null | undefined
          setApplication(ownerApplication ?? null)
        }
      } catch {
        // Error handling
      }
    }

    void fetchBusinessData()
  }, [showBusinessTab, userRole])

  async function fetchProfile() {
    try {
      const storedUser = localStorage.getItem('user')
      const user = storedUser ? JSON.parse(storedUser) : null

      const response = await fetch('/api/user/profile', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.user_id || '',
        }
      })

      if (!response.ok) {
        setMessage({ type: 'error', text: 'Gagal memuat data profil.' })
        return
      }

      const result = await response.json()
      setProfile(result.data)
      setName(result.data.name || '')
      setPhoneNumber(result.data.phone_number || '')
    } catch {
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat memuat profil.' })
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const wantsPasswordUpdate = Boolean(currentPassword || newPassword || confirmPassword)

    if (wantsPasswordUpdate) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setSaving(false)
        setMessage({ type: 'error', text: 'Lengkapi semua kolom password terlebih dahulu.' })
        return
      }

      if (newPassword !== confirmPassword) {
        setSaving(false)
        setMessage({ type: 'error', text: 'Konfirmasi password tidak sesuai.' })
        return
      }

      if (newPassword.length < 6) {
        setSaving(false)
        setMessage({ type: 'error', text: 'Password baru minimal 6 karakter.' })
        return
      }
    }

    try {
      const storedUser = localStorage.getItem('user')
      const user = storedUser ? JSON.parse(storedUser) : null

      const body: {
        name: string
        phone_number: string | null
        current_password?: string
        new_password?: string
      } = {
        name: name.trim(),
        phone_number: phoneNumber.trim() || null,
      }

      if (wantsPasswordUpdate) {
        body.current_password = currentPassword
        body.new_password = newPassword
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.user_id || '',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Gagal menyimpan perubahan.' })
        return
      }

      const result = await response.json()
      setProfile(result.data)
      setName(result.data.name || '')
      setPhoneNumber(result.data.phone_number || '')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMessage({ type: 'success', text: 'Perubahan profil berhasil disimpan!' })
    } catch {
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat menyimpan perubahan!' })
    } finally {
      setSaving(false)
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setMessage(null)

    try {
      const storedUser = localStorage.getItem('user')
      const user = storedUser ? JSON.parse(storedUser) : null

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/user/profile-image', {
        method: 'POST',
        headers: {
          'x-user-id': user?.user_id || '',
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Gagal upload foto profil.' })
        return
      }

      const result = await response.json()
      const timestamp = Date.now()
      const imageUrlWithTimestamp = `${result.profile_image}?t=${timestamp}`
      setProfile((prev) => (prev ? { ...prev, profile_image: imageUrlWithTimestamp } : prev))
      setMessage({ type: 'success', text: 'Foto profil berhasil diperbarui.' })
    } catch {
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat upload foto.' })
    } finally {
      setUploading(false)
    }
  }

  function getInitials(value: string) {
    return value
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <>
        {showNavbar && NavbarComponent && <NavbarComponent />}
        <div className={`profile-page ${!showNavbar ? 'no-navbar' : ''}`}>
          <div className="profile-layout">
            <div className="profile-shell profile-shell-loading">
              <aside className="profile-sidebar-panel">
                <div className="profile-avatar-wrap">
                  <div className="profile-skeleton profile-skeleton-circle" />
                  <div className="profile-skeleton profile-skeleton-edit" />
                </div>
                <div className="profile-skeleton profile-skeleton-name" />
                <div className="profile-skeleton profile-skeleton-email" />
                <div className="profile-skeleton profile-skeleton-tab" />
              </aside>

              <div className="profile-main-panel">
                <section className="profile-main-section">
                  <div className="profile-skeleton profile-skeleton-heading" />
                  <div className="profile-skeleton profile-skeleton-label" />
                  <div className="profile-skeleton profile-skeleton-input" />
                  <div className="profile-skeleton profile-skeleton-label" />
                  <div className="profile-skeleton profile-skeleton-input" />
                  <div className="profile-skeleton profile-skeleton-label" />
                  <div className="profile-skeleton profile-skeleton-input" />
                </section>
                <section className="profile-main-section password-section">
                  <div className="profile-skeleton profile-skeleton-heading small" />
                  <div className="profile-skeleton profile-skeleton-label" />
                  <div className="profile-skeleton profile-skeleton-input" />
                  <div className="profile-skeleton profile-skeleton-label" />
                  <div className="profile-skeleton profile-skeleton-input" />
                  <div className="profile-skeleton profile-skeleton-label" />
                  <div className="profile-skeleton profile-skeleton-input" />
                </section>
                <div className="profile-submit-row">
                  <div className="profile-skeleton profile-skeleton-button" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {showNavbar && NavbarComponent && <NavbarComponent />}
      <div className={`profile-page ${!showNavbar ? 'no-navbar' : ''}`}>
        <div className="profile-layout">
          {message && (
            <div className={`profile-alert ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="profile-shell">
            <aside className="profile-sidebar-panel">
              <div className="profile-avatar-wrap">
                {profile?.profile_image ? (
                  <img src={profile.profile_image} alt="Foto profil" className="profile-avatar-image" />
                ) : (
                  <div className="profile-avatar-circle">{profile ? getInitials(profile.name) : 'U'}</div>
                )}
                <label className="profile-avatar-edit">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9" strokeLinecap="round" />
                    <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="profile-avatar-input"
                    disabled={uploading}
                  />
                </label>
              </div>

              <h2 className="profile-sidebar-name">{name || '-'}</h2>
              <p className="profile-sidebar-email">{profile?.email || '-'}</p>

              {showBusinessTab ? (
                <>
                  <button
                    type="button"
                    className={`profile-sidebar-tab ${activeTab === 'personal' ? 'active' : ''}`}
                    onClick={() => setActiveTab('personal')}
                  >
                    Profil Pribadi
                  </button>
                  <button
                    type="button"
                    className={`profile-sidebar-tab ${activeTab === 'business' ? 'active' : ''}`}
                    onClick={() => setActiveTab('business')}
                  >
                    Profil Bisnis
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="profile-sidebar-tab active">
                    Profil Pribadi
                  </button>

                  {userRole === 'owner' && onNavigateToBusiness && (
                    <button
                      type="button"
                      className="profile-sidebar-tab"
                      onClick={onNavigateToBusiness}
                    >
                      Profil Bisnis
                    </button>
                  )}
                </>
              )}
            </aside>

            {showBusinessTab && activeTab === 'business' ? (
              <div className="profile-main-panel">
                <section className="profile-main-section">
                  <h3>Informasi Bisnis</h3>
                  <div className="profile-field">
                    <label htmlFor="businessName">Nama Bisnis</label>
                    <input
                      type="text"
                      id="businessName"
                      className="profile-input"
                      value={application?.business_name || ''}
                      readOnly
                    />
                  </div>
                  <div className="profile-field">
                    <label htmlFor="businessEmail">Email Bisnis</label>
                    <input
                      type="email"
                      id="businessEmail"
                      className="profile-input"
                      value={application?.business_email || profile?.email || ''}
                      readOnly
                    />
                  </div>
                  <div className="profile-field">
                    <label htmlFor="businessPhone">Nomor Telepon Operasional</label>
                    <input
                      type="tel"
                      id="businessPhone"
                      className="profile-input"
                      value={application?.business_phone || ''}
                      readOnly
                    />
                  </div>
                  <div className="profile-field">
                    <label htmlFor="accountNumber">Nomor Rekening</label>
                    <input
                      type="text"
                      id="accountNumber"
                      className="profile-input"
                      value={application?.account_number || ''}
                      readOnly
                    />
                  </div>
                </section>
                <div className="profile-submit-row">
                  <button type="button" className="profile-save-btn">Simpan</button>
                </div>
              </div>
            ) : (
              <form className="profile-main-panel" onSubmit={handleSave}>
              <section className="profile-main-section">
                <h3>Informasi Dasar</h3>

              <div className="profile-field">
                <label htmlFor="profile-name">Nama Lengkap</label>
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="profile-input"
                  required
                />
              </div>

              <div className="profile-field">
                <label htmlFor="profile-phone">Nomor Telepon</label>
                <input
                  id="profile-phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  className="profile-input"
                  placeholder="+62 812 3456 7890"
                />
              </div>

              <div className="profile-field">
                <label htmlFor="profile-email">Email</label>
                <input
                  id="profile-email"
                  type="email"
                  value={profile?.email || ''}
                  className="profile-input"
                  readOnly
                />
              </div>
              </section>

              <section className="profile-main-section password-section">
                <h3>Ubah Password</h3>

              <div className="profile-field">
                <label htmlFor="current-password">Password Saat Ini</label>
                <div className="profile-password-wrap">
                  <input
                    id="current-password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    className="profile-input"
                  />
                  <button
                    type="button"
                    className="profile-password-toggle"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    aria-label={showCurrentPassword ? 'Sembunyikan password saat ini' : 'Tampilkan password saat ini'}
                  >
                    {showCurrentPassword ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m3 3 18 18" strokeLinecap="round" />
                        <path d="M10.58 10.58a2 2 0 0 0 2.84 2.84" strokeLinecap="round" />
                        <path d="M9.88 5.09A9.77 9.77 0 0 1 12 4.86c5.36 0 9.27 3.5 10.71 7.14a11.35 11.35 0 0 1-4.27 5.23" strokeLinecap="round" />
                        <path d="M6.61 6.61A11.38 11.38 0 0 0 1.29 12c1.44 3.64 5.35 7.14 10.71 7.14a9.9 9.9 0 0 0 4.12-.88" strokeLinecap="round" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="profile-field">
                <label htmlFor="new-password">Password Baru</label>
                <div className="profile-password-wrap">
                  <input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="profile-input"
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="profile-password-toggle"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    aria-label={showNewPassword ? 'Sembunyikan password baru' : 'Tampilkan password baru'}
                  >
                    {showNewPassword ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m3 3 18 18" strokeLinecap="round" />
                        <path d="M10.58 10.58a2 2 0 0 0 2.84 2.84" strokeLinecap="round" />
                        <path d="M9.88 5.09A9.77 9.77 0 0 1 12 4.86c5.36 0 9.27 3.5 10.71 7.14a11.35 11.35 0 0 1-4.27 5.23" strokeLinecap="round" />
                        <path d="M6.61 6.61A11.38 11.38 0 0 0 1.29 12c1.44 3.64 5.35 7.14 10.71 7.14a9.9 9.9 0 0 0 4.12-.88" strokeLinecap="round" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="profile-field">
                <label htmlFor="confirm-password">Konfirmasi Password</label>
                <div className="profile-password-wrap">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="profile-input"
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="profile-password-toggle"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi password' : 'Tampilkan konfirmasi password'}
                  >
                    {showConfirmPassword ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m3 3 18 18" strokeLinecap="round" />
                        <path d="M10.58 10.58a2 2 0 0 0 2.84 2.84" strokeLinecap="round" />
                        <path d="M9.88 5.09A9.77 9.77 0 0 1 12 4.86c5.36 0 9.27 3.5 10.71 7.14a11.35 11.35 0 0 1-4.27 5.23" strokeLinecap="round" />
                        <path d="M6.61 6.61A11.38 11.38 0 0 0 1.29 12c1.44 3.64 5.35 7.14 10.71 7.14a9.9 9.9 0 0 0 4.12-.88" strokeLinecap="round" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              </section>

              <div className="profile-submit-row">
                <button type="submit" className="profile-save-btn" disabled={saving || uploading}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

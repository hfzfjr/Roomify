'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { User } from '@/types'
import DashboardIcon from '@/components/icons/DashboardIcon';
import ReviewsIcon from '@/components/icons/ReviewsIcon';
import HelpIcon from '@/components/icons/HelpIcon';
import AccountDropdown from '@/components/layout/AccountDropdown';

type OwnerApplicationStatus = 'pending' | 'active' | 'rejected' | null

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [ownerApplicationStatus, setOwnerApplicationStatus] = useState<OwnerApplicationStatus>(null)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [avatarImageError, setAvatarImageError] = useState(false)
  const router = useRouter()
  const accountMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadCurrentUser() {
      const stored = localStorage.getItem('user')
      if (!stored) {
        return
      }

      try {
        const parsedUser = JSON.parse(stored) as User
        if (isMounted) {
          setUser(parsedUser)
        }

        const [userResponse, ownerApplicationResponse] = await Promise.all([
          fetch(`/api/auth?user_id=${encodeURIComponent(parsedUser.user_id)}`, { cache: 'no-store' }),
          fetch(`/api/owner-applications?user_id=${encodeURIComponent(parsedUser.user_id)}`, { cache: 'no-store' }),
        ])

        const userResult = await userResponse.json()
        const ownerApplicationResult = await ownerApplicationResponse.json()

        if (!isMounted) {
          return
        }

        if (userResponse.ok && userResult.success && userResult.user) {
          const latestUser = {
            ...userResult.user,
            profile_image: userResult.user.profile_image ?? parsedUser.profile_image ?? null,
          } as User
          setUser(latestUser)
          localStorage.setItem('user', JSON.stringify(latestUser))
        }

        if (ownerApplicationResponse.ok && ownerApplicationResult.success) {
          setOwnerApplicationStatus(ownerApplicationResult.data?.application?.status ?? null)
        }
      } catch (error) {
        console.error('Failed to load latest navbar user state:', error)
      }
    }

    void loadCurrentUser()

    function handleStorageSync() {
      const storedUser = localStorage.getItem('user')
      if (!storedUser || !isMounted) return

      try {
        const parsedUser = JSON.parse(storedUser) as User
        setUser(parsedUser)
      } catch (error) {
        console.error('Failed to sync navbar user from storage:', error)
      }
    }

    window.addEventListener('storage', handleStorageSync)

    return () => {
      isMounted = false
      window.removeEventListener('storage', handleStorageSync)
    }
  }, [])

  useEffect(() => {
    setAvatarImageError(false)
  }, [user?.profile_image])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node

      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(target)
      ) {
        setAccountMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  function handleLogout() {
    setAccountMenuOpen(false)
    setSidebarOpen(false)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/auth/login')
  }

  function handleOwnerAction() {
    setSidebarOpen(false)
    setAccountMenuOpen(false)

    if (isOwner) {
      router.push('/owner/dashboard')
      return
    }

    router.push('/customer/owner-application')
  }

  function handleSidebarNavigate(path: string) {
    setSidebarOpen(false)
    setAccountMenuOpen(false)
    router.push(path)
  }

  function handleProfileClick() {
    setAccountMenuOpen(false)
    setSidebarOpen(false)
    router.push('/customer/profile')
  }

  const pathname = usePathname()

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'
  const hasProfileImage = Boolean(user?.profile_image) && !avatarImageError
  const isOwner = user?.role === 'owner' || ownerApplicationStatus === 'active'
  const isOwnerPending = ownerApplicationStatus === 'pending'
  const ownerActionLabel = isOwner
    ? 'Kelola Ruangan'
    : isOwnerPending
      ? 'Pengajuan Diproses'
      : 'Daftarkan Ruangan'
  const ownerActionCaption = isOwner
    ? 'Buka dashboard owner'
    : isOwnerPending
      ? 'Menunggu persetujuan admin'
      : 'Daftarkan ruangan bisnis Anda'
  const displayedRole = isOwner ? 'Owner' : 'Customer'

  const isPathActive = (path: string) => pathname === path

  return (
    <>
      {/* Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => {
          setSidebarOpen(false)
          setAccountMenuOpen(false)
        }}
      ></div>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sb-logo">
          <a href="#" className="sb-logo-inner" onClick={(e) => { e.preventDefault(); router.push('/customer/dashboard'); }}>
            <img src="/images/roomify-putih.png" alt="Roomify logo" className="sb-logo-img" />
          </a>
        </div>

        {/* Profil */}
        <div className="account-menu sb-account-menu" ref={accountMenuRef}>
          <button
            type="button"
            className={`sb-profile sb-profile-button${accountMenuOpen ? ' active' : ''}`}
            onClick={() => setAccountMenuOpen((current) => !current)}
            aria-haspopup="menu"
            aria-expanded={accountMenuOpen}
          >
            <div className="sb-profile-main">
              <div className={`sb-avatar${hasProfileImage ? ' has-image' : ''}`}>
                {hasProfileImage ? (
                  <img
                    src={user?.profile_image || ''}
                    alt={user?.name || 'User avatar'}
                    className="sb-avatar-image"
                    onError={() => setAvatarImageError(true)}
                  />
                ) : initials}
              </div>
              <div className="sb-profile-text">
                <span className="sb-name">{user?.name ?? 'Pengguna'}</span>
                <span className="sb-role">{displayedRole}</span>
              </div>
            </div>
            <span className="sb-profile-caret" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>

          {accountMenuOpen && (
            <AccountDropdown
              name={user?.name ?? 'Pengguna'}
              role={displayedRole}
              onProfileClick={handleProfileClick}
              onLogout={handleLogout}
            />
          )}
        </div>

        {/* Menu */}
        <nav className="sb-menu">
          <a
            href="#"
            className={`sb-item${isPathActive('/customer/dashboard') ? ' active' : ''}`}
            onClick={(e) => { e.preventDefault(); handleSidebarNavigate('/customer/dashboard'); }}
          >
            <DashboardIcon className="sb-icon" />
            Dashboard
          </a>
          <a
            href="#"
            className={`sb-item${isPathActive('/customer/bookings') ? ' active' : ''}`}
            onClick={(e) => { e.preventDefault(); handleSidebarNavigate('/customer/bookings'); }}
          >
            <ReviewsIcon className="sb-icon" />
            Riwayat
          </a>
          <a
            href="#"
            className={`sb-item${isPathActive('/customer/faq') ? ' active' : ''}`}
            onClick={(e) => { e.preventDefault(); handleSidebarNavigate('/customer/faq'); }}
          >
            <HelpIcon className="sb-icon" />
            Bantuan
          </a>
        </nav>

        <div className="sb-owner-cta">
          <button
            type="button"
            className={`sb-owner-btn${isOwner ? ' owner-active' : ''}${isOwnerPending ? ' owner-pending' : ''}`}
            onClick={handleOwnerAction}
          >
            <span className="sb-owner-icon" aria-hidden="true">
              {isOwner ? 'R' : '+'}
            </span>
            <span className="sb-owner-copy">
              <strong>{ownerActionLabel}</strong>
              <span>{ownerActionCaption}</span>
            </span>
          </button>
        </div>
      </aside>

      {/* Header */}
      <header className="header">
        <button className="hamburger" onClick={() => setSidebarOpen(true)}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <a href="#" className="logo-wrap" onClick={(e) => { e.preventDefault(); router.push('/customer/dashboard'); }}>
          <img src="/images/roomify-biru.png" alt="Roomify logo" />
        </a>
        <div className="header-right">
          <span className="hai-text">Hai, {user?.name?.split(' ')[0] ?? 'Pengguna'}!</span>
          <div className="account-menu">
            <button
              type="button"
              className={`avatar avatar-button${hasProfileImage ? ' has-image' : ''}`}
              onClick={handleProfileClick}
              aria-label="Buka profil"
            >
              {hasProfileImage ? (
                <img
                  src={user?.profile_image || ''}
                  alt={user?.name || 'User avatar'}
                  className="avatar-image"
                  onError={() => setAvatarImageError(true)}
                />
              ) : initials}
            </button>
          </div>
        </div>
      </header>
    </>
  )
}

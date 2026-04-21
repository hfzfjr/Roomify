'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@/types'
import DashboardIcon from '@/components/icons/DashboardIcon';
import ReviewsIcon from '@/components/icons/ReviewsIcon';
import HelpIcon from '@/components/icons/HelpIcon';

type OwnerApplicationStatus = 'pending' | 'active' | 'rejected' | null

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [ownerApplicationStatus, setOwnerApplicationStatus] = useState<OwnerApplicationStatus>(null)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
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
          fetch(`/api/auth?user_id=${encodeURIComponent(parsedUser.user_id)}`),
          fetch(`/api/owner-applications?user_id=${encodeURIComponent(parsedUser.user_id)}`),
        ])

        const userResult = await userResponse.json()
        const ownerApplicationResult = await ownerApplicationResponse.json()

        if (!isMounted) {
          return
        }

        if (userResponse.ok && userResult.success && userResult.user) {
          setUser(userResult.user)
          localStorage.setItem('user', JSON.stringify(userResult.user))
        }

        if (ownerApplicationResponse.ok && ownerApplicationResult.success) {
          setOwnerApplicationStatus(ownerApplicationResult.data?.application?.status ?? null)
        }
      } catch (error) {
        console.error('Failed to load latest navbar user state:', error)
      }
    }

    void loadCurrentUser()

    return () => {
      isMounted = false
    }
  }, [])

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
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/auth/login')
  }

  function handleOwnerAction() {
    setSidebarOpen(false)

    if (isOwner) {
      router.push('/owner/dashboard')
      return
    }

    router.push('/customer/owner-application')
  }

  function handleProfileClick() {
    setAccountMenuOpen(false)
    router.push('/customer/profile')
  }

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'
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

  return (
    <>
      {/* Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
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
        <div className="sb-profile">
          <div className="sb-avatar">{initials}</div>
          <div className="sb-profile-text">
            <span className="sb-name">{user?.name ?? 'Pengguna'}</span>
            <span className="sb-role">{displayedRole}</span>
          </div>
        </div>

        {/* Menu */}
        <nav className="sb-menu">
          <a href="#" className="sb-item active" onClick={(e) => { e.preventDefault(); router.push('/customer/dashboard'); }}>
            <DashboardIcon className="sb-icon" />
            Dashboard
          </a>
          <a href="#" className="sb-item" onClick={(e) => { e.preventDefault(); router.push('/customer/bookings'); }}>
            <ReviewsIcon className="sb-icon" />
            Riwayat
          </a>
          <a href="#" className="sb-item" onClick={(e) => { e.preventDefault(); }}>
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
          <div className="account-menu" ref={accountMenuRef}>
            <button
              type="button"
              className={`avatar avatar-button${accountMenuOpen ? ' active' : ''}`}
              onClick={() => setAccountMenuOpen((current) => !current)}
              aria-haspopup="menu"
              aria-expanded={accountMenuOpen}
            >
              {initials}
            </button>

            {accountMenuOpen && (
              <div className="account-dropdown" role="menu">
                <div className="account-dropdown-header">
                  <span className="account-dropdown-name">{user?.name ?? 'Pengguna'}</span>
                  <span className="account-dropdown-role">{displayedRole}</span>
                </div>
                <button type="button" className="account-dropdown-item" onClick={handleProfileClick}>
                  Profil
                </button>
                <button type="button" className="account-dropdown-item danger" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  )
}

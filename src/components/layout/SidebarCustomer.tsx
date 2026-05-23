'use client'

import './SidebarCustomer.css'
import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@/types'
import DashboardIcon from '@/components/icons/DashboardIcon';
import ReviewsIcon from '@/components/icons/ReviewsIcon';
import HelpIcon from '@/components/icons/HelpIcon';
import AccountDropdown from '@/components/layout/AccountDropdown';

interface SidebarCustomerProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  accountMenuOpen: boolean
  setAccountMenuOpen: (open: boolean) => void
  user: User | null
  avatarImageError: boolean
  setAvatarImageError: (error: boolean) => void
  isOwner: boolean
  isOwnerPending: boolean
  ownerActionLabel: string
  ownerActionCaption: string
  displayedRole: string
  isPathActive: (path: string) => boolean
  handleSidebarNavigate: (path: string) => void
  handleProfileClick: () => void
  handleLogout: () => void
  handleOwnerAction: () => void
}

export default function SidebarCustomer({
  sidebarOpen,
  setSidebarOpen,
  accountMenuOpen,
  setAccountMenuOpen,
  user,
  avatarImageError,
  setAvatarImageError,
  isOwner,
  isOwnerPending,
  ownerActionLabel,
  ownerActionCaption,
  displayedRole,
  isPathActive,
  handleSidebarNavigate,
  handleProfileClick,
  handleLogout,
  handleOwnerAction,
}: SidebarCustomerProps) {
  const router = useRouter()
  const accountMenuRef = useRef<HTMLDivElement | null>(null)

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'
  const hasProfileImage = Boolean(user?.profile_image) && !avatarImageError

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
            onClick={() => setAccountMenuOpen(!accountMenuOpen)}
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
    </>
  )
}

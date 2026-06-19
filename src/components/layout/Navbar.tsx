'use client'

import './Navbar.css'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { User } from '@/types'
import SidebarCustomer from '@/components/layout/SidebarCustomer'
import RegisterOwnerOverlay from '@/components/ui/overlay/customer/RegisterOwnerOverlay'
import Notification from '@/components/ui/notification/notification'
import NotificationIcon from '@/components/icons/NotificationIcon'

type OwnerApplicationStatus = 'pending' | 'active' | 'rejected' | null

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [ownerApplicationStatus, setOwnerApplicationStatus] = useState<OwnerApplicationStatus>(null)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [avatarImageError, setAvatarImageError] = useState(false)
  const [showRegisterOverlay, setShowRegisterOverlay] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [hasNewNotification, setHasNewNotification] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    // Add has-navbar class to body when navbar is mounted
    document.body.classList.add('has-navbar')

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

        // Fetch unread notifications count
        if (parsedUser.user_id) {
          const notificationsResponse = await fetch(`/api/notifications?user_id=${encodeURIComponent(parsedUser.user_id)}`, { cache: 'no-store' })
          const notificationsResult = await notificationsResponse.json()
          if (notificationsResponse.ok && notificationsResult.success && notificationsResult.notifications) {
            const unreadCount = notificationsResult.notifications.filter((n: any) => !n.is_read).length
            setHasNewNotification(unreadCount > 0)
          }
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
      document.body.classList.remove('has-navbar')
    }
  }, [])

  useEffect(() => {
    setAvatarImageError(false)
  }, [user?.profile_image])


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

    setShowRegisterOverlay(true)
  }

  function handleRegisterOverlayConfirm() {
    setShowRegisterOverlay(false)
    router.push('/customer/owner-application')
  }

  function handleRegisterOverlayCancel() {
    setShowRegisterOverlay(false)
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
  const isOwner = user?.role === 'owner'
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
      {showRegisterOverlay && (
        <RegisterOwnerOverlay
          onConfirm={handleRegisterOverlayConfirm}
          onCancel={handleRegisterOverlayCancel}
        />
      )}
      <Notification
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
        userId={user?.user_id}
      />
      <SidebarCustomer
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        accountMenuOpen={accountMenuOpen}
        setAccountMenuOpen={setAccountMenuOpen}
        user={user}
        avatarImageError={avatarImageError}
        setAvatarImageError={setAvatarImageError}
        isOwner={isOwner}
        isOwnerPending={isOwnerPending}
        ownerActionLabel={ownerActionLabel}
        ownerActionCaption={ownerActionCaption}
        displayedRole={displayedRole}
        isPathActive={isPathActive}
        handleSidebarNavigate={handleSidebarNavigate}
        handleProfileClick={handleProfileClick}
        handleLogout={handleLogout}
        handleOwnerAction={handleOwnerAction}
      />

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
          <button
            className="notification-button"
            onClick={() => setNotificationOpen(true)}
            aria-label="Buka notifikasi"
          >
            <NotificationIcon hasNotification={hasNewNotification} />
            <span className="notification-text">Notifikasi</span>
          </button>
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

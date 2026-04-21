'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@/types'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
  }, [])

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/auth/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

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
            <span className="sb-role">Customer</span>
          </div>
        </div>

        {/* Menu */}
        <nav className="sb-menu">
          <a href="#" className="sb-item active" onClick={(e) => { e.preventDefault(); router.push('/customer/dashboard'); }}>Dashboard</a>
          <a href="#" className="sb-item" onClick={(e) => { e.preventDefault(); router.push('/customer/profile'); }}>Profil</a>
          <a href="#" className="sb-item" onClick={(e) => { e.preventDefault(); router.push('/customer/bookings'); }}>History</a>
          <a href="#" className="sb-item" onClick={(e) => { e.preventDefault(); /* help */ }}>Help</a>
        </nav>
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
          <div className="avatar">{initials}</div>
        </div>
      </header>
    </>
  )
}

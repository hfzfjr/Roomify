'use client'

import { useState, useEffect } from 'react'
import './notification.css'

interface NotificationItem {
  id: string
  title: string
  description: string
  timestamp: string
  type: 'payment' | 'facility' | 'booking' | 'reminder' | 'system'
  color: 'orange' | 'green' | 'blue' | 'red' | 'gray'
}

interface NotificationGroup {
  label: string
  items: NotificationItem[]
}

interface NotificationProps {
  isOpen: boolean
  onClose: () => void
  userId?: string
}

export default function Notification({ isOpen, onClose, userId }: NotificationProps) {
  const [notificationGroups, setNotificationGroups] = useState<NotificationGroup[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !userId) return

    async function fetchNotifications() {
      setLoading(true)
      try {
        const response = await fetch(`/api/notifications?user_id=${encodeURIComponent(userId!)}`, { cache: 'no-store' })
        const result = await response.json()

        if (result.success && result.notifications) {
          const grouped = groupNotificationsByDate(result.notifications)
          setNotificationGroups(grouped)
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [isOpen, userId])

  if (!isOpen) return null

  function groupNotificationsByDate(notifications: any[]): NotificationGroup[] {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const groups: Record<string, NotificationItem[]> = {
      'Hari ini': [],
      'Kemarin': [],
      'Minggu ini': [],
      'Lebih lama': []
    }

    notifications.forEach((notif) => {
      const createdDate = new Date(notif.created_at)
      const item: NotificationItem = {
        id: notif.id,
        title: notif.title,
        description: notif.description || '',
        timestamp: formatTimestamp(notif.created_at),
        type: notif.type,
        color: getColorByType(notif.type)
      }

      if (createdDate >= today) {
        groups['Hari ini'].push(item)
      } else if (createdDate >= yesterday) {
        groups['Kemarin'].push(item)
      } else if (createdDate >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
        groups['Minggu ini'].push(item)
      } else {
        groups['Lebih lama'].push(item)
      }
    })

    return Object.entries(groups)
      .filter(([_, items]) => items.length > 0)
      .map(([label, items]) => ({ label, items }))
  }

  function formatTimestamp(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Baru saja'
    if (diffMins < 60) return `${diffMins} menit yang lalu`
    if (diffHours < 24) return `${diffHours} jam yang lalu`
    if (diffDays === 1) return 'Kemarin'
    if (diffDays < 7) return `${diffDays} hari yang lalu`

    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' +
           date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
  }

  function getColorByType(type: string): NotificationItem['color'] {
    switch (type) {
      case 'payment': return 'orange'
      case 'facility': return 'green'
      case 'booking': return 'blue'
      case 'reminder': return 'red'
      case 'system': return 'gray'
      default: return 'blue'
    }
  }

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'payment':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        )
      case 'facility':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        )
      case 'booking':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        )
      case 'reminder':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        )
      case 'system':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className="notification-overlay" onClick={onClose}>
      <div className="notification-container" onClick={(e) => e.stopPropagation()}>
        <div className="notification-header">
          <h2 className="notification-title">Notifikasi</h2>
          <button className="notification-close" onClick={onClose} aria-label="Tutup notifikasi">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="notification-content">
          {loading ? (
            <div className="notification-loading">Memuat notifikasi...</div>
          ) : notificationGroups.length === 0 ? (
            <div className="notification-empty">Tidak ada notifikasi</div>
          ) : (
            notificationGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="notification-group">
                <div className="notification-group-label">{group.label}</div>
                {group.items.map((item) => (
                  <div key={item.id} className={`notification-item notification-item-${item.color}`}>
                    <div className="notification-item-bar"></div>
                    <div className="notification-item-icon">
                      {getIcon(item.type)}
                    </div>
                    <div className="notification-item-content">
                      <div className="notification-item-title">{item.title}</div>
                      <div className="notification-item-description">{item.description}</div>
                      <div className="notification-item-timestamp">{item.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

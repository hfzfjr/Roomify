'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import './notification.css'
import PaymentPendingIcon from '../../icons/notification/PaymentPendingIcon'
import PaymentSuccessIcon from '@/components/icons/notification/PaymentSuccessIcon'
import OrderCanceledIcon from '../../icons/notification/OrderCanceledIcon'
import FacilityApprovedIcon from '../../icons/notification/FacilityApprovedIcon'
import FacilityRejectedIcon from '../../icons/notification/FacilityRejectedIcon'
import ReminderIcon from '../../icons/notification/ReminderIcon'
import FeedbackQuestionIcon from '../../icons/notification/FeedbackQuestionIcon'

interface NotificationItem {
  id: string
  title: string
  description: string
  timestamp: string
  type: 'payment' | 'facility' | 'booking' | 'reminder' | 'system'
  color: 'orange' | 'green' | 'blue' | 'red' | 'gray'
  is_read: boolean
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
  const router = useRouter()
  const [notificationGroups, setNotificationGroups] = useState<NotificationGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [markingAllRead, setMarkingAllRead] = useState(false)

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

    const lastWeekStart = new Date(today)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)

    const lastMonthStart = new Date(today)
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1)

    const groups: Record<string, NotificationItem[]> = {}

    notifications.forEach((notif) => {
      const createdDate = new Date(notif.created_at)
      const item: NotificationItem = {
        id: notif.id,
        title: notif.title,
        description: notif.description || '',
        timestamp: formatTimestamp(notif.created_at),
        type: notif.type,
        color: getColorByType(notif.type, notif.title),
        is_read: notif.is_read || false,
      }

      let groupLabel: string

      if (createdDate >= today) {
        groupLabel = 'Hari ini'
      } else if (createdDate >= yesterday) {
        groupLabel = 'Kemarin'
      } else if (createdDate >= lastWeekStart) {
        groupLabel = 'Minggu lalu'
      } else if (createdDate >= lastMonthStart) {
        groupLabel = 'Bulan lalu'
      } else {
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
        groupLabel = `${monthNames[createdDate.getMonth()]} ${createdDate.getFullYear()}`
      }

      if (!groups[groupLabel]) {
        groups[groupLabel] = []
      }
      groups[groupLabel].push(item)
    })

    const sortedGroups = Object.entries(groups)
      .sort(([labelA], [labelB]) => {
        const order = ['Hari ini', 'Kemarin', 'Minggu lalu', 'Bulan lalu']
        const indexA = order.indexOf(labelA)
        const indexB = order.indexOf(labelB)

        if (indexA !== -1 && indexB !== -1) return indexA - indexB
        if (indexA !== -1) return -1
        if (indexB !== -1) return 1

        const dateA = parseMonthYear(labelA)
        const dateB = parseMonthYear(labelB)
        return dateB.getTime() - dateA.getTime()
      })
      .map(([label, items]) => ({ label, items }))

    return sortedGroups
  }

  function parseMonthYear(label: string): Date {
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
    const parts = label.split(' ')
    const monthIndex = monthNames.indexOf(parts[0])
    const year = parseInt(parts[1])
    return new Date(year, monthIndex, 1)
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

  function getColorByType(type: string, title?: string): NotificationItem['color'] {
    const titleLower = title?.toLowerCase() || ''

    switch (type) {
      case 'payment':
        if (titleLower.includes('berhasil') || titleLower.includes('lunas') || titleLower.includes('diterima')) return 'green'
        return 'orange'
      case 'facility':
        if (titleLower.includes('ditolak')) return 'red'
        return 'green'
      case 'booking':
        if (titleLower.includes('dibatalkan')) return 'red'
        return 'blue'
      case 'reminder': return 'red'
      case 'system': return 'gray'
      default: return 'blue'
    }
  }

  const getIcon = (type: NotificationItem['type'], title?: string) => {
    const titleLower = title?.toLowerCase() || ''

    switch (type) {
      case 'payment':
        if (titleLower.includes('berhasil') || titleLower.includes('lunas') || titleLower.includes('diterima')) return <PaymentSuccessIcon />
        return <PaymentPendingIcon />
      case 'facility':
        if (titleLower.includes('ditolak')) return <FacilityRejectedIcon />
        return <FacilityApprovedIcon />
      case 'booking':
        if (titleLower.includes('dibatalkan')) return <OrderCanceledIcon />
        return <OrderCanceledIcon />
      case 'reminder':
        return <ReminderIcon />
      case 'system':
        return <FeedbackQuestionIcon />
      default:
        return null
    }
  }

  const handleNotificationClick = async (item: NotificationItem) => {
    // Optimistically update local state
    setNotificationGroups(prevGroups =>
      prevGroups.map(group => ({
        ...group,
        items: group.items.map(i =>
          i.id === item.id ? { ...i, is_read: true } : i
        )
      }))
    )

    // Mark as read in backend
    if (!item.is_read && userId) {
      try {
        await fetch(`/api/notifications/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId })
        })
      } catch (error) {
        console.error('Error marking notification as read:', error)
      }
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!userId) return

    setMarkingAllRead(true)
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      })

      if (response.ok) {
        // Optimistically update local state
        setNotificationGroups(prevGroups =>
          prevGroups.map(group => ({
            ...group,
            items: group.items.map(i => ({ ...i, is_read: true }))
          }))
        )
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    } finally {
      setMarkingAllRead(false)
    }
  }

  return (
    <div className="notification-overlay" onClick={onClose}>
      <div className="notification-container" onClick={(e) => e.stopPropagation()}>
        <div className="notification-header">
          <h2 className="notification-title">Notifikasi</h2>
          <div className="notification-header-actions">
            <button
              className="notification-mark-all-read"
              onClick={handleMarkAllAsRead}
              disabled={markingAllRead}
              aria-label="Tandai semua dibaca"
            >
              {markingAllRead ? 'Memproses...' : 'Tandai semua dibaca'}
            </button>
            <button className="notification-close" onClick={onClose} aria-label="Tutup notifikasi">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
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
                  <div
                    key={item.id}
                    className={`notification-item notification-item-${item.color} ${!item.is_read ? 'notification-item-unread' : ''}`}
                    onClick={() => handleNotificationClick(item)}
                  >
                    <div className="notification-item-bar"></div>
                    <div className="notification-item-icon">
                      {getIcon(item.type, item.title)}
                    </div>
                    <div className="notification-item-content">
                      <div className="notification-item-title-row">
                        <div className="notification-item-title">{item.title}</div>
                        <div className="notification-item-timestamp">{item.timestamp}</div>
                      </div>
                      <div className="notification-item-description">{item.description}</div>
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

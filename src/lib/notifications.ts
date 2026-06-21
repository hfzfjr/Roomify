import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface CreateNotificationParams {
  user_id: string
  title: string
  description?: string
  type: 'payment' | 'booking' | 'facility' | 'reminder' | 'system'
  priority?: 'low' | 'medium' | 'high'
  related_id?: string
  related_type?: 'booking' | 'payment' | 'facility_request' | 'invoice' | 'review' | 'report'
}

export async function createNotification(params: CreateNotificationParams): Promise<{ success: boolean; error?: string; notification_id?: string }> {
  try {
    const { user_id, title, description, type, priority = 'medium', related_id, related_type } = params

    if (!user_id || !title || !type) {
      return { success: false, error: 'user_id, title, dan type wajib diisi.' }
    }

    const adminSupabase = createAdminClient()

    if (!adminSupabase) {
      return { success: false, error: 'Gagal membuat admin Supabase client.' }
    }

    // Generate unique notification ID
    const { data: lastNotification, error: lastError } = await adminSupabase
      .from('notifications')
      .select('id')
      .like('id', 'n-%')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()

    let nextNumber = 1
    if (!lastError && lastNotification) {
      const match = lastNotification.id.match(/n-(\d+)/)
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1
      }
    }

    const notification_id = `n-${String(nextNumber).padStart(3, '0')}`

    const { error: insertError } = await adminSupabase
      .from('notifications')
      .insert({
        id: notification_id,
        user_id,
        title,
        description: description || null,
        type,
        priority,
        related_id: related_id || null,
        related_type: related_type || null,
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('Error creating notification:', insertError)
      return { success: false, error: insertError.message }
    }

    return { success: true, notification_id }
  } catch (error) {
    console.error('Error in createNotification:', error)
    return { success: false, error: 'Terjadi kesalahan saat membuat notifikasi.' }
  }
}

export async function getUnreadNotificationCount(userId: string): Promise<{ count: number; error?: string }> {
  try {
    const supabase = await createClient()

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) {
      return { count: 0, error: error.message }
    }

    return { count: count || 0 }
  } catch (error) {
    console.error('Error getting unread notification count:', error)
    return { count: 0, error: 'Terjadi kesalahan saat mengambil jumlah notifikasi.' }
  }
}

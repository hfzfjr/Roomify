'use client'

import { useEffect, useState } from 'react'
import { useFacilityRequests } from '@/hooks/useDashboard'

interface FacilityRequest {
  request_id: string
  booking_id: string
  customer_id: string
  customer_name?: string | null
  room_name?: string | null
  details?: string
  message?: string
  priority?: string
  status: string
  created_at: string
}

export default function OwnerFacilityRequests() {
  const [user, setUser] = useState<any>(null)
  const { requests, loading, updateRequestStatus, refetch } = useFacilityRequests(user?.user_id || null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleApprove = async (requestId: string) => {
    const success = await updateRequestStatus(requestId, 'approved')
    if (success) refetch()
  }

  const handleReject = async (requestId: string) => {
    const success = await updateRequestStatus(requestId, 'rejected')
    if (success) refetch()
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Facility Requests</h1>
        <p style={{ color: '#6b7280' }}>
          Menampilkan permintaan fasilitas untuk ruangan yang Anda miliki.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '32px', textAlign: 'center', color: '#374151' }}>
          Loading facility requests...
        </div>
      ) : requests.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
          Tidak ada permintaan fasilitas saat ini.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '16px 12px', color: '#111827' }}>Request ID</th>
                <th style={{ padding: '16px 12px', color: '#111827' }}>Room</th>
                <th style={{ padding: '16px 12px', color: '#111827' }}>Requester</th>
                <th style={{ padding: '16px 12px', color: '#111827' }}>Message</th>
                <th style={{ padding: '16px 12px', color: '#111827' }}>Status</th>
                <th style={{ padding: '16px 12px', color: '#111827' }}>Date</th>
                <th style={{ padding: '16px 12px', color: '#111827' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request: FacilityRequest) => (
                <tr key={request.request_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '16px 12px', color: '#111827' }}>{request.request_id}</td>
                  <td style={{ padding: '16px 12px', color: '#111827' }}>{request.room_name || 'Unknown Room'}</td>
                  <td style={{ padding: '16px 12px', color: '#111827' }}>{request.customer_name || request.customer_id || 'Unknown'}</td>
                  <td style={{ padding: '16px 12px', color: '#4b5563', maxWidth: '280px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {request.message || request.details || 'No details provided'}
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, color: request.status === 'approved' ? '#065f46' : request.status === 'rejected' ? '#991b1b' : '#0f172a', backgroundColor: request.status === 'approved' ? '#d1fae5' : request.status === 'rejected' ? '#fecaca' : '#e2e8f0' }}>
                      {request.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 12px', color: '#6b7280' }}>
                    {new Date(request.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    {request.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleApprove(request.request_id)} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', backgroundColor: '#22c55e', color: 'white', cursor: 'pointer' }}>
                          Approve
                        </button>
                        <button onClick={() => handleReject(request.request_id)} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', backgroundColor: '#ef4444', color: 'white', cursor: 'pointer' }}>
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: '#6b7280' }}>No action</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

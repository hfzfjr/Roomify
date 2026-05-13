'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import BackButton from '@/components/layout/BackButton'
import '@/styles/profile.css'

interface UserProfile {
  user_id: string
  name: string
  email: string
  phone_number: string | null
  profile_image: string | null
  created_at: string
}

export default function CustomerProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Form states
  const [name, setName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhoneNumber, setEditPhoneNumber] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  useEffect(() => {
    // Update navbar when profile changes
    if (profile) {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        const user = JSON.parse(storedUser)
        user.name = profile.name
        user.profile_image = profile.profile_image
        localStorage.setItem('user', JSON.stringify(user))
        // Trigger navbar update
        window.dispatchEvent(new Event('storage'))
      }
    }
  }, [profile])

  const fetchProfile = async () => {
    try {
      // Get user ID from localStorage
      const storedUser = localStorage.getItem('user')
      const user = storedUser ? JSON.parse(storedUser) : null
      
      const response = await fetch('/api/user/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.user_id || '',
        }
      })

      if (response.ok) {
        const result = await response.json()
        setProfile(result.data)
        setName(result.data.name)
        setPhoneNumber(result.data.phone_number || '')
        setEditName(result.data.name)
        setEditPhoneNumber(result.data.phone_number || '')
      } else {
        setMessage({ type: 'error', text: 'Failed to fetch profile' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error fetching profile' })
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      // Get user ID from localStorage
      const storedUser = localStorage.getItem('user')
      const user = storedUser ? JSON.parse(storedUser) : null
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.user_id || '',
        },
        body: JSON.stringify({
          name: editName,
          phone_number: editPhoneNumber || null,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setProfile(result.data)
        setName(result.data.name)
        setPhoneNumber(result.data.phone_number || '')
        setIsEditing(false)
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to update profile' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating profile' })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      // Get user ID from localStorage
      const storedUser = localStorage.getItem('user')
      const user = storedUser ? JSON.parse(storedUser) : null
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.user_id || '',
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password updated successfully!' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setShowPasswordForm(false)
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to update password' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating password' })
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setMessage(null)

    try {
      // Get user ID from localStorage
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

      if (response.ok) {
        const result = await response.json()
        console.log('Upload result:', result)
        
        // Update profile state with new image
        setProfile(prev => prev ? { ...prev, profile_image: result.profile_image } : null)
        
        // Update localStorage with new profile image
        if (storedUser) {
          const updatedUser = JSON.parse(storedUser)
          updatedUser.profile_image = result.profile_image
          localStorage.setItem('user', JSON.stringify(updatedUser))
          
          // Trigger navbar update
          window.dispatchEvent(new Event('storage'))
        }
        
        // Force re-render by adding timestamp to URL
        const timestamp = Date.now()
        const imageUrlWithTimestamp = `${result.profile_image}?t=${timestamp}`
        
        setProfile(prev => prev ? { ...prev, profile_image: imageUrlWithTimestamp } : null)
        
        setMessage({ type: 'success', text: 'Profile image updated successfully!' })
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to upload image' })
      }
    } catch (error) {
      console.error('Upload error:', error)
      setMessage({ type: 'error', text: 'Error uploading image' })
    } finally {
      setUploading(false)
    }
  }

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing
      setEditName(name)
      setEditPhoneNumber(phoneNumber)
    }
    setIsEditing(!isEditing)
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="profile-loading-content">
          <div className="profile-spinner"></div>
          <div className="profile-loading-text">Loading profile...</div>
        </div>
      </div>
    )
  }

  return (
      <div className="profile-container">
      <BackButton />
      <div className="max-w-4xl mx-auto">
        <div className="profile-header">
          <h1>Profile Settings</h1>
          <p>Manage your personal information and account settings</p>
        </div>

        {message && (
          <div className={`profile-alert ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="profile-grid">
          {/* Profile Image Section */}
          <div>
            <div className="profile-card">
              <div className="profile-card-header">
                <h2>Profile Photo</h2>
              </div>
              <div className="profile-card-body">
                <div className="profile-photo-container">
                  <div className={`profile-photo-wrapper ${uploading ? 'profile-photo-uploading' : ''}`}>
                    {profile?.profile_image ? (
                      <img
                        src={profile.profile_image}
                        alt="Profile"
                        className="profile-photo"
                        key={profile.profile_image} // Force re-render when URL changes
                      />
                    ) : (
                      <div className="profile-avatar">
                        {profile ? getInitials(profile.name) : 'U'}
                      </div>
                    )}
                    
                    <label className="profile-photo-upload">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="profile-photo-input"
                        disabled={uploading}
                      />
                    </label>
                  </div>
                  
                  <p className="profile-photo-text">
                    {uploading ? 'Uploading...' : 'Click the camera icon to change your photo'}
                  </p>
                  
                  <p className="profile-photo-hint">
                    JPG, PNG, WebP, GIF (Max 5MB)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Forms Section */}
          <div className="space-y-8">
            {/* Personal Information Form */}
            <div className="profile-card">
              <div className="profile-card-header">
                <h2>Personal Information</h2>
              </div>
              <div className="profile-card-body">
                {!isEditing ? (
                  <div className="space-y-4">
                    <div className="profile-info-display">
                      <div className="profile-info-label">Nama Lengkap</div>
                      <div className="profile-info-value">{name || '-'}</div>
                    </div>
                    <div className="profile-info-display">
                      <div className="profile-info-label">Nomor Telepon</div>
                      <div className="profile-info-value">{phoneNumber || '-'}</div>
                    </div>
                    <div className="profile-btn-group">
                      <button
                        type="button"
                        onClick={handleEditToggle}
                        className="profile-btn profile-btn-secondary"
                        disabled={saving}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleProfileUpdate} className="profile-form">
                    <div className="profile-form-group">
                      <label className="profile-form-label">
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="profile-form-input"
                        required
                      />
                    </div>

                    <div className="profile-form-group">
                      <label className="profile-form-label">
                        Nomor Telepon
                      </label>
                      <input
                        type="tel"
                        value={editPhoneNumber}
                        onChange={(e) => setEditPhoneNumber(e.target.value)}
                        placeholder="+62 812-3456-7890"
                        className="profile-form-input"
                      />
                    </div>

                    <div className="profile-btn-group">
                      <button
                        type="button"
                        onClick={handleEditToggle}
                        className="profile-btn profile-btn-secondary"
                        disabled={saving}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="profile-btn profile-btn-primary"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Account Information */}
            <div className="profile-card">
              <div className="profile-card-header">
                <h2>Account Information</h2>
              </div>
              <div className="profile-card-body">
                <div className="account-info-item">
                  <div className="account-info-label">Email</div>
                  <div className="account-info-value">{profile?.email || '-'}</div>
                </div>
                <div className="account-info-item">
                  <div className="account-info-label">Member Since</div>
                  <div className="account-info-value">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* Change Password Button */}
            <div className="profile-card">
              <div className="profile-card-body">
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="profile-btn profile-btn-danger w-full"
                >
                  Ganti Password
                </button>
                
                {showPasswordForm && (
                  <form onSubmit={handlePasswordUpdate} className="password-form mt-4">
                    <div className="profile-form-group">
                      <label className="profile-form-label">
                        Password Saat Ini
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="profile-form-input"
                        required
                      />
                    </div>

                    <div className="profile-form-group">
                      <label className="profile-form-label">
                        Password Baru
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="profile-form-input"
                        required
                        minLength={6}
                      />
                    </div>

                    <div className="profile-form-group">
                      <label className="profile-form-label">
                        Konfirmasi Password Baru
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="profile-form-input"
                        required
                        minLength={6}
                      />
                    </div>

                    <div className="profile-btn-group">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordForm(false)
                          setCurrentPassword('')
                          setNewPassword('')
                          setConfirmPassword('')
                        }}
                        className="profile-btn profile-btn-secondary"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="profile-btn profile-btn-primary"
                      >
                        {saving ? 'Mengupdate...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useEffect, useState, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import BackButton from '@/components/ui/BackButton'
import styles from './EditRoomPage.module.css'

interface SessionUser {
  user_id: string
  name: string
  email: string
  role: string
}

interface Region {
  region_id: string
  name: string
  province_id: string
}

interface Province {
  province_id: string
  name: string
}

interface PhotoItem {
  id: string
  url: string
  file?: File
  isExisting: boolean
}

const facilitiesList = [
  'Microphone',
  'Whiteboard',
  'Sound System',
  'Proyektor',
  'AC',
  'Podium',
  'Monitor',
  'HDMI Cable',
  'Lighting',
  'Green Screen',
  'Komputer'
]

const roomTypesList = [
  { value: 'meeting_room', label: 'Meeting Room' },
  { value: 'studio', label: 'Studio' },
  { value: 'ballroom', label: 'Ballroom' },
  { value: 'working_space', label: 'Working Space' },
  { value: 'training_room', label: 'Traingin Room' },
  { value: 'function_room', label: 'Function Room' }
]

function getStoredUser(): SessionUser | null {
  if (typeof window === 'undefined') {
    return null
  }
  const userData = localStorage.getItem('user')
  if (!userData) {
    return null
  }
  try {
    return JSON.parse(userData) as SessionUser
  } catch {
    return null
  }
}

function StepNumber({ done, number }: { done: boolean; number: number }) {
  if (done) {
    return (
      <span className={`${styles.stepBadge} ${styles.stepDone}`}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    )
  }
  return <span className={styles.stepBadge}>{number}</span>
}

function EditRoomForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roomId = searchParams.get('id')

  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [showValidation, setShowValidation] = useState(false)

  // Basic Info States
  const [roomName, setRoomName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [capacity, setCapacity] = useState('')

  // Facilities
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([])

  // Room Type
  const [roomType, setRoomType] = useState('')

  // Location States
  const [provinces, setProvinces] = useState<Province[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [provinceId, setProvinceId] = useState('')
  const [provinceName, setProvinceName] = useState('')
  const [regionId, setRegionId] = useState('')
  const [regionName, setRegionName] = useState('')
  const [address, setAddress] = useState('')

  // Location Dropdown States
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false)
  const [showRegionDropdown, setShowRegionDropdown] = useState(false)
  const [provinceSearch, setProvinceSearch] = useState('')
  const [regionSearch, setRegionSearch] = useState('')

  const provinceDropdownRef = useRef<HTMLDivElement>(null)
  const regionDropdownRef = useRef<HTMLDivElement>(null)

  // Photos States
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const formatPriceString = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '')
    if (!clean) return ''
    return new Intl.NumberFormat('id-ID').format(Number(clean))
  }

  // Load User session
  useEffect(() => {
    const storedUser = getStoredUser()
    if (!storedUser) {
      router.push('/auth/login')
      return
    }
    setUser(storedUser)
  }, [router])

  // Load locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const [regionsRes, provincesRes] = await Promise.all([
          fetch('/api/locations?type=region'),
          fetch('/api/locations?type=province')
        ])
        const regionsData = await regionsRes.json()
        const provincesData = await provincesRes.json()
        if (regionsData.success) setRegions(regionsData.data || [])
        if (provincesData.success) setProvinces(provincesData.data || [])
      } catch (err) {
        console.error('Error fetching locations:', err)
      }
    }
    fetchLocations()
  }, [])

  // Load Room Details
  useEffect(() => {
    if (!roomId) {
      setLoading(false)
      setError('ID Ruangan tidak ditemukan di parameter URL. Silakan kembali dari Dashboard Owner.')
      return
    }

    const fetchRoomDetail = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/rooms/${roomId}`)
        const resData = await res.json()

        if (!res.ok) {
          throw new Error(resData.message || 'Gagal memuat detail ruangan.')
        }

        const r = resData.data
        if (r) {
          setRoomName(r.name || '')
          setDescription(r.description || '')
          setPrice(formatPriceString(String(r.price_per_hour || '')))
          setCapacity(String(r.capacity || ''))
          setSelectedFacilities(r.facilities || [])
          setRoomType(r.type || '')
          setAddress(r.location || '')
          setRegionId(r.region_id || '')

          if (r.images && Array.isArray(r.images)) {
            setPhotos(r.images.map((url: string, i: number) => ({
              id: `existing-${i}-${Date.now()}`,
              url,
              isExisting: true
            })))
          }
        }
      } catch (err: any) {
        console.error('Error fetching room detail:', err)
        setError(err.message || 'Terjadi kesalahan saat memuat detail ruangan.')
      } finally {
        setLoading(false)
      }
    }

    fetchRoomDetail()
  }, [roomId])

  // Resolve region and province names once locations and room details are loaded
  useEffect(() => {
    if (regionId && regions.length > 0 && provinces.length > 0) {
      const activeRegion = regions.find(reg => reg.region_id === regionId)
      if (activeRegion) {
        setRegionName(activeRegion.name)
        setProvinceId(activeRegion.province_id)
        const activeProvince = provinces.find(prov => prov.province_id === activeRegion.province_id)
        if (activeProvince) {
          setProvinceName(activeProvince.name)
        }
      }
    }
  }, [regionId, regions, provinces])

  // Dropdown dismiss on outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (provinceDropdownRef.current && !provinceDropdownRef.current.contains(event.target as Node)) {
        setShowProvinceDropdown(false)
        setProvinceSearch('')
      }
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(event.target as Node)) {
        setShowRegionDropdown(false)
        setRegionSearch('')
      }
    }

    if (showProvinceDropdown || showRegionDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProvinceDropdown, showRegionDropdown])

  // Location filters
  const filteredProvinces = provinces.filter(p =>
    p.name.toLowerCase().includes(provinceSearch.toLowerCase())
  )

  const filteredRegions = regions
    .filter(r => !provinceId || r.province_id === provinceId)
    .filter(r => r.name.toLowerCase().includes(regionSearch.toLowerCase()))

  const handleProvinceSelect = (province: Province) => {
    setProvinceId(province.province_id)
    setProvinceName(province.name)
    if (provinceId !== province.province_id) {
      setRegionId('')
      setRegionName('')
    }
    setShowProvinceDropdown(false)
    setProvinceSearch('')
  }

  const handleRegionSelect = (region: Region) => {
    const province = provinces.find(p => p.province_id === region.province_id)
    setRegionId(region.region_id)
    setRegionName(region.name)
    setProvinceId(region.province_id)
    setProvinceName(province?.name || '')
    setShowRegionDropdown(false)
    setRegionSearch('')
  }

  // Amenities logic
  const handleToggleFacility = (label: string) => {
    setSelectedFacilities(prev =>
      prev.includes(label)
        ? prev.filter(f => f !== label)
        : [...prev, label]
    )
  }

  // Photos Drop and Upload Select logic
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles = Array.from(files).slice(0, 8 - photos.length)
    const newItems: PhotoItem[] = newFiles.map(file => ({
      id: `new-${Date.now()}-${Math.random()}`,
      url: URL.createObjectURL(file),
      file,
      isExisting: false
    }))

    setPhotos(prev => [...prev, ...newItems].slice(0, 8))
  }, [photos])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (!files) return

    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, 8 - photos.length)
    const newItems: PhotoItem[] = imageFiles.map(file => ({
      id: `new-${Date.now()}-${Math.random()}`,
      url: URL.createObjectURL(file),
      file,
      isExisting: false
    }))

    setPhotos(prev => [...prev, ...newItems].slice(0, 8))
  }, [photos])

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  // Drag and drop photo reordering
  const handlePhotoDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handlePhotoDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handlePhotoDragLeave = () => {
    setDragOverIndex(null)
  }

  const handlePhotoDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const nextPhotos = [...photos]
    const [draggedItem] = nextPhotos.splice(draggedIndex, 1)
    nextPhotos.splice(dropIndex, 0, draggedItem)

    setPhotos(nextPhotos)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handlePhotoDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleUploadAreaDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Completed Checklist sections
  const completedSections = [
    !!roomName.trim() && !!description.trim() && !!price.trim() && !!capacity.trim(),
    !!roomType,
    selectedFacilities.length > 0,
    !!regionId && !!address.trim(),
    photos.length > 0
  ]

  const validateForm = () => {
    return (
      !!roomName.trim() &&
      !!description.trim() &&
      !!price.trim() &&
      !!capacity.trim() &&
      !!roomType &&
      !!regionId &&
      !!address.trim() &&
      photos.length > 0
    )
  }

  const handleSave = async () => {
    setShowValidation(true)
    if (!roomId) return

    if (!validateForm()) {
      setError('Harap lengkapi semua field wajib dan pastikan mengunggah minimal 1 foto.')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setMessage(null)

      const cleanPrice = Number(price.replace(/[^0-9]/g, ''))
      
      // Separate out new photo uploads and existing photos
      const newPhotosToUpload = photos.filter(p => !p.isExisting)
      let finalUrls: string[] = []

      // If we have new photos, upload them first
      if (newPhotosToUpload.length > 0 && user) {
        const formDataUpload = new FormData()
        newPhotosToUpload.forEach(p => {
          if (p.file) {
            formDataUpload.append('photos', p.file)
          }
        })
        formDataUpload.append('room_id', roomId)
        formDataUpload.append('user_id', user.user_id)
        formDataUpload.append('room_name', roomName)

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload
        })
        const uploadResult = await uploadRes.json()

        if (!uploadRes.ok || !uploadResult.success) {
          throw new Error(uploadResult.message || 'Gagal mengunggah foto baru.')
        }

        // Map photos array back, replacing the temp object url with final database url returned
        let uploadedIndex = 0
        finalUrls = photos.map(p => {
          if (p.isExisting) {
            return p.url
          }
          const uploadedUrl = uploadResult.urls[uploadedIndex]
          uploadedIndex++
          return uploadedUrl
        })
      } else {
        // No new images to upload, just grab the URL sequence
        finalUrls = photos.map(p => p.url)
      }

      // Now run PUT to update all room fields, amenities, and remaining images
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: roomName,
          description,
          price_per_hour: cleanPrice,
          capacity: Number(capacity),
          facilities: selectedFacilities,
          type: roomType,
          location: address,
          region_id: regionId,
          photos: finalUrls
        })
      })

      const resData = await res.json()
      if (!res.ok) {
        throw new Error(resData.message || 'Gagal menyimpan pembaruan ruangan.')
      }

      setMessage('Pembaruan ruangan berhasil disimpan!')
      setTimeout(() => {
        router.push('/owner/dashboard')
      }, 1500)
    } catch (err: any) {
      console.error('Error saving room updates:', err)
      setError(err.message || 'Gagal menyimpan perubahan ruangan.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.page} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ background: '#ffffff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '16px', color: '#101828' }}>Memuat data ruangan dari database...</p>
        </div>
      </div>
    )
  }

  if (error && !roomName) {
    return (
      <div className={styles.page} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ background: '#ffffff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'center', maxWidth: '400px' }}>
          <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: '18px', color: '#ff1c1c' }}>Terjadi Masalah</p>
          <p style={{ margin: '0 0 24px', color: '#6b7280', fontSize: '14px', lineHeight: 1.5 }}>{error}</p>
          <Link href="/owner/dashboard" style={{ background: '#17c2e0', color: '#ffffff', padding: '12px 24px', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, display: 'inline-block' }}>
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <BackButton href="/owner/dashboard" title="Edit Ruangan" />

      <main className={styles.main}>
        <aside className={styles.sidebarCard}>
          <h2>Kelengkapan</h2>
          <div className={styles.cardDivider} />

          <div className={styles.stepList}>
            <div className={`${styles.stepItem} ${completedSections[0] ? styles.stepActive : ''}`}>
              <StepNumber done={completedSections[0]} number={1} />
              <span>Informasi Dasar</span>
            </div>
            <div className={`${styles.stepItem} ${completedSections[1] ? styles.stepActive : ''}`}>
              <StepNumber done={completedSections[1]} number={2} />
              <span>Tipe Ruangan</span>
            </div>
            <div className={`${styles.stepItem} ${completedSections[2] ? styles.stepActive : ''}`}>
              <StepNumber done={completedSections[2]} number={3} />
              <span>Fasilitas</span>
            </div>
            <div className={`${styles.stepItem} ${completedSections[3] ? styles.stepActive : ''}`}>
              <StepNumber done={completedSections[3]} number={4} />
              <span>Lokasi</span>
            </div>
            <div className={`${styles.stepItem} ${completedSections[4] ? styles.stepActive : ''}`}>
              <StepNumber done={completedSections[4]} number={5} />
              <span>Foto Ruangan</span>
            </div>
          </div>

          <div className={styles.sidebarActions}>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={() => router.push('/owner/dashboard')}
              disabled={saving}
            >
              Batal
            </button>
            <button
              type="button"
              className={styles.btnSave}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </aside>

        <section className={styles.content}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '16px', borderRadius: '12px', color: '#991b1b', fontWeight: 600, fontSize: '14px', margin: '0 32px' }}>
              ⚠️ {error}
            </div>
          )}

          {message && (
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '16px', borderRadius: '12px', color: '#065f46', fontWeight: 600, fontSize: '14px', margin: '0 32px' }}>
              ✅ {message}
            </div>
          )}

          {/* Informasi Dasar */}
          <article className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h3>Informasi Dasar</h3>
              <p>Nama, deskripsi, dan harga ruangan</p>
            </div>
            <div className={styles.cardDivider} />

            <div className={styles.formBody}>
              <div className={styles.field}>
                <div className={styles.fieldLabel}>
                  <span>Nama Ruangan</span>
                  <span className={styles.required}>Wajib</span>
                </div>
                <input
                  className={styles.input}
                  value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  placeholder="Masukkan nama ruangan"
                  disabled={saving}
                />
              </div>

              <div className={styles.field}>
                <div className={styles.fieldLabel}>
                  <span>Deskripsi</span>
                  <span className={styles.required}>Wajib</span>
                </div>
                <textarea
                  className={styles.textarea}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Deskripsikan ruangan Anda"
                  disabled={saving}
                />
              </div>

              <div className={styles.row2}>
                <div className={styles.field}>
                  <div className={styles.fieldLabel}>
                    <span>Harga per jam</span>
                    <span className={styles.required}>Wajib</span>
                  </div>
                  <div className={styles.affixInput}>
                    <span className={styles.prefix}>Rp</span>
                    <input
                      className={styles.input}
                      value={price}
                      onChange={e => setPrice(formatPriceString(e.target.value))}
                      placeholder="Contoh: 350.000"
                      disabled={saving}
                    />
                    <span className={styles.suffix}>/jam</span>
                  </div>
                </div>

                <div className={styles.field}>
                  <div className={styles.fieldLabel}>
                    <span>Kapasitas</span>
                    <span className={styles.required}>Wajib</span>
                  </div>
                  <div className={styles.affixInput}>
                    <input
                      className={styles.input}
                      value={capacity}
                      onChange={e => setCapacity(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Kapasitas orang"
                      disabled={saving}
                    />
                    <span className={styles.suffixIcon}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Fasilitas */}
          <article className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h3>Fasilitas</h3>
              <p>Pilih fasilitas yang ada</p>
            </div>
            <div className={styles.cardDivider} />

            <div className={styles.facilityGrid}>
              {facilitiesList.map(label => {
                const isActive = selectedFacilities.includes(label)
                return (
                  <button
                    key={label}
                    type="button"
                    className={`${styles.facilityChip}${isActive ? ` ${styles.facilityChipActive}` : ''}`}
                    onClick={() => handleToggleFacility(label)}
                    disabled={saving}
                  >
                    <span className={styles.chipIcon}>
                      {isActive ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    {label}
                  </button>
                )
              })}
            </div>
          </article>

          {/* Tipe Ruangan */}
          <article className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h3>Tipe Ruangan</h3>
              <p>Pilih kategori paling sesuai</p>
            </div>
            <div className={styles.cardDivider} />

            <div className={styles.roomTypeGrid}>
              {roomTypesList.map(t => {
                const isActive = roomType === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    className={`${styles.roomTypeButton}${isActive ? ` ${styles.roomTypeButtonActive}` : ''}`}
                    onClick={() => setRoomType(t.value)}
                    disabled={saving}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>
          </article>

          {/* Lokasi */}
          <article className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h3>Lokasi</h3>
              <p>Provinsi, kota, dan alamat lengkap</p>
            </div>
            <div className={styles.cardDivider} />

            <div className={styles.formBody}>
              <div className={styles.row2}>
                {/* Provinsi Dropdown */}
                <div className={styles.field} ref={provinceDropdownRef}>
                  <div className={styles.fieldLabel}>
                    <span>Provinsi</span>
                    <span className={styles.required}>Wajib</span>
                  </div>
                  <div className={styles.selectWrapper}>
                    <button
                      type="button"
                      className={styles.selectTrigger}
                      onClick={() => setShowProvinceDropdown(!showProvinceDropdown)}
                      disabled={saving}
                    >
                      <span className={provinceName ? styles.selectValue : styles.selectPlaceholder}>
                        {provinceName || 'Pilih Provinsi'}
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>

                    {showProvinceDropdown && (
                      <div className={styles.selectDropdown}>
                        <div className={styles.searchBox}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <input
                            type="text"
                            placeholder="Cari provinsi..."
                            value={provinceSearch}
                            onChange={e => setProvinceSearch(e.target.value)}
                            className={styles.searchInput}
                            autoFocus
                          />
                        </div>
                        <div className={styles.dropdownList}>
                          {filteredProvinces.map(prov => (
                            <button
                              key={prov.province_id}
                              type="button"
                              className={styles.selectOption}
                              onClick={() => handleProvinceSelect(prov)}
                            >
                              <div className={styles.optionIcon}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v9" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </div>
                              <div className={styles.optionContent}>
                                <span className={styles.optionTitle}>Prov. {prov.name}</span>
                                <span className={styles.optionSubtitle}>{prov.name}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Kota Dropdown */}
                <div className={styles.field} ref={regionDropdownRef}>
                  <div className={styles.fieldLabel}>
                    <span>Kota/Kabupaten</span>
                    <span className={styles.required}>Wajib</span>
                  </div>
                  <div className={styles.selectWrapper}>
                    <button
                      type="button"
                      className={`${styles.selectTrigger} ${!provinceId ? styles.selectTriggerDisabled : ''}`}
                      onClick={() => provinceId && setShowRegionDropdown(!showRegionDropdown)}
                      disabled={saving || !provinceId}
                    >
                      <span className={regionName ? styles.selectValue : styles.selectPlaceholder}>
                        {regionName || (provinceId ? 'Pilih Kota/Kabupaten' : 'Pilih Provinsi terlebih dahulu')}
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>

                    {showRegionDropdown && (
                      <div className={styles.selectDropdown}>
                        <div className={styles.searchBox}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <input
                            type="text"
                            placeholder="Cari kota/kabupaten..."
                            value={regionSearch}
                            onChange={e => setRegionSearch(e.target.value)}
                            className={styles.searchInput}
                            autoFocus
                          />
                        </div>
                        <div className={styles.dropdownList}>
                          {filteredRegions.map(reg => (
                            <button
                              key={reg.region_id}
                              type="button"
                              className={styles.selectOption}
                              onClick={() => handleRegionSelect(reg)}
                            >
                              <div className={styles.optionIcon}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v9" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </div>
                              <div className={styles.optionContent}>
                                <span className={styles.optionTitle}>{reg.name}</span>
                                <span className={styles.optionSubtitle}>
                                  {provinces.find(p => p.province_id === reg.province_id)?.name || ''}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Alamat Lengkap */}
              <div className={styles.field}>
                <div className={styles.fieldLabel}>
                  <span>Alamat Lengkap</span>
                  <span className={styles.required}>Wajib</span>
                </div>
                <textarea
                  className={styles.textarea}
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Contoh: Jalan Buah Batu Nomor 162, Kelurahan Turangga, Kecamatan Lengkong, Kota Bandung"
                  disabled={saving}
                  rows={3}
                />
              </div>
            </div>
          </article>

          {/* Foto Ruangan */}
          <article className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h3>Foto Ruangan</h3>
              <p>Unggah minimal 1 foto, maks 8 foto</p>
            </div>
            <div className={styles.cardDivider} />

            {/* Upload Area */}
            <div
              className={styles.uploadArea}
              onDrop={handleDrop}
              onDragOver={handleUploadAreaDragOver}
              onClick={() => document.getElementById('photo-input-edit')?.click()}
            >
              <input
                id="photo-input-edit"
                type="file"
                accept="image/jpeg,image/png"
                multiple
                className={styles.hiddenInput}
                onChange={handleFileSelect}
                disabled={saving}
              />
              <div className={styles.uploadIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="17,8 12,3 7,8" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className={styles.uploadText}>Seret foto ke sini atau klik untuk pilih</p>
              <p className={styles.uploadSubtext}>Format JPG, PNG · Maks. 5 MB per foto</p>
              <button
                type="button"
                className={styles.uploadButton}
                onClick={e => {
                  e.stopPropagation()
                  document.getElementById('photo-input-edit')?.click()
                }}
                disabled={saving}
              >
                Pilih dari perangkat
              </button>
            </div>

            {/* Previews */}
            {photos.length > 0 && (
              <div className={styles.photoPreviewSection}>
                <h4 className={styles.previewTitle}>Preview foto</h4>
                <div className={styles.photoGrid}>
                  {photos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className={`${styles.photoItem} ${draggedIndex === index ? styles.dragging : ''} ${dragOverIndex === index ? styles.dragOver : ''}`}
                      draggable={!saving}
                      onDragStart={() => handlePhotoDragStart(index)}
                      onDragOver={e => handlePhotoDragOver(e, index)}
                      onDragLeave={handlePhotoDragLeave}
                      onDrop={e => handlePhotoDrop(e, index)}
                      onDragEnd={handlePhotoDragEnd}
                    >
                      <img src={photo.url} alt={`Preview ${index + 1}`} className={styles.photoThumb} draggable={false} />
                      <button
                        type="button"
                        className={styles.photoRemove}
                        onClick={e => {
                          e.stopPropagation()
                          handleRemovePhoto(index)
                        }}
                        disabled={saving}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
                          <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
                        </svg>
                      </button>
                      {index === 0 && <span className={styles.mainPhotoBadge}>Utama</span>}
                    </div>
                  ))}
                </div>
                <div className={styles.photoInfo}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" strokeLinecap="round" />
                    <line x1="12" y1="8" x2="12.01" y2="8" strokeLinecap="round" />
                  </svg>
                  <span>Foto pertama akan dijadikan foto utama. Seret untuk mengubah urutan.</span>
                </div>
              </div>
            )}
          </article>
        </section>
      </main>
    </div>
  )
}

export default function EditRoomPage() {
  return (
    <Suspense fallback={
      <div className={styles.page} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ background: '#ffffff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '16px', color: '#101828' }}>Memuat halaman...</p>
        </div>
      </div>
    }>
      <EditRoomForm />
    </Suspense>
  )
}

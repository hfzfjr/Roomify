'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import BackButton from '@/components/ui/BackButton'
import styles from './page.module.css'

interface Booking {
    booking_id: string
    room_id: string
    customer_id: string
    check_in: string
    check_out: string
    room: {
        name: string
        room_id: string
        type?: string
        location?: string
        capacity?: number
    }
    booking_date: string
    status: string
}

export default function ReportRoomPage() {
    const searchParams = useSearchParams()
    const bookingId = searchParams.get('booking_id')

    const [reportType, setReportType] = useState('')
    const [description, setDescription] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([])
    const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState<string[]>([])
    const [booking, setBooking] = useState<Booking | null>(null)
    const [loading, setLoading] = useState(true)
    const [showValidationErrors, setShowValidationErrors] = useState(false)
    const [categories, setCategories] = useState<{ value: string, label: string }[]>([])

    useEffect(() => {
        if (bookingId) {
            fetchBookingData()
        }
        fetchCategories()
    }, [bookingId])

    async function fetchBookingData() {
        try {
            const response = await fetch(`/api/bookings/${bookingId}`)
            const result = await response.json()

            console.log('Booking API response:', result)

            if (response.ok && result.success) {
                console.log('Setting booking data:', result.data)
                setBooking(result.data)
            } else {
                console.error('Failed to fetch booking:', result.message)
                setBooking(null)
            }
        } catch (error) {
            console.error('Error fetching booking:', error)
            setBooking(null)
        } finally {
            setLoading(false)
        }
    }

    async function fetchCategories() {
        try {
            const response = await fetch('/api/categories')
            const result = await response.json()

            if (result.success) {
                setCategories(result.data.categories || [])
            }
        } catch (error) {
            console.error('Error fetching categories:', error)
        }
    }

    async function handleSubmit() {
        if (!reportType || !description) {
            setShowValidationErrors(true)
            alert('Mohon lengkapi semua field')
            return
        }

        if (!booking) {
            alert('Data booking tidak ditemukan')
            return
        }

        setIsSubmitting(true)
        try {
            console.log('Submitting report with:', {
                customer_id: booking.customer_id,
                room_id: booking.room.room_id,
                category: reportType,
                description,
                has_images: uploadedPhotos.length > 0
            })

            const formData = new FormData()
            formData.append('customer_id', booking.customer_id)
            formData.append('room_id', booking.room.room_id)
            formData.append('booking_id', booking.booking_id)
            formData.append('category', reportType)
            formData.append('description', description)
            uploadedPhotos.forEach((file) => {
                formData.append('images', file)
            })

            const response = await fetch('/api/customer-reports', {
                method: 'POST',
                body: formData
            })

            const result = await response.json()
            console.log('Report submission response:', result)

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Gagal mengirim laporan')
            }

            alert('Laporan berhasil dikirim')
            window.history.back()
        } catch (error) {
            console.error('Report submission error:', error)
            alert(error instanceof Error ? error.message : 'Gagal mengirim laporan')
        } finally {
            setIsSubmitting(false)
        }
    }

    function handleCancel() {
        // Navigate back
        window.history.back()
    }

    function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files
        if (files && files.length > 0) {
            const newFiles: File[] = []
            const newUrls: string[] = []
            const remainingSlots = 7 - uploadedPhotos.length

            for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
                const file = files[i]
                if (file.size <= 5 * 1024 * 1024) { // Max 5MB
                    newFiles.push(file)
                    newUrls.push(URL.createObjectURL(file))
                } else {
                    alert(`File ${file.name} melebihi 5MB`)
                }
            }

            setUploadedPhotos(prev => [...prev, ...newFiles])
            setUploadedPhotoUrls(prev => [...prev, ...newUrls])

            if (files.length > remainingSlots) {
                alert(`Maksimal 7 foto. Hanya ${remainingSlots} foto yang akan diupload.`)
            }
        }
    }

    function handleDragOver(e: React.DragEvent) {
        e.preventDefault()
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault()
        const files = e.dataTransfer.files
        if (files && files.length > 0) {
            const newFiles: File[] = []
            const newUrls: string[] = []
            const remainingSlots = 7 - uploadedPhotos.length

            for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
                const file = files[i]
                if (file.size <= 5 * 1024 * 1024) {
                    newFiles.push(file)
                    newUrls.push(URL.createObjectURL(file))
                } else {
                    alert(`File ${file.name} melebihi 5MB`)
                }
            }

            setUploadedPhotos(prev => [...prev, ...newFiles])
            setUploadedPhotoUrls(prev => [...prev, ...newUrls])

            if (files.length > remainingSlots) {
                alert(`Maksimal 7 foto. Hanya ${remainingSlots} foto yang akan diupload.`)
            }
        }
    }

    function removePhoto(index: number) {
        setUploadedPhotos(prev => prev.filter((_, i) => i !== index))
        setUploadedPhotoUrls(prev => prev.filter((_, i) => i !== index))
    }

    return (
        <div className={styles.page}>
            <BackButton title="Laporkan Ruangan" />
            <div className={styles.container}>
                {/* Informasi Transaksi */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <div>
                            <h3 className={styles.sectionTitle}>Informasi Transaksi</h3>
                            <p className={styles.sectionSubtitle}>Informasi detail transaksi ruangan</p>
                        </div>
                        {booking && (
                            <div className={styles.statusWrapper}>
                                <span className={styles.statusLabel}>Status Penyewaan:</span>
                                <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>
                                    {booking.status === 'completed' ? 'Selesai' : booking.status === 'confirmed' ? 'Lunas' : booking.status}
                                </span>
                            </div>
                        )}
                    </div>
                    {loading ? (
                        <p className={styles.infoLabel}>Memuat data transaksi...</p>
                    ) : booking ? (
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Nama Ruangan</span>
                                <span className={styles.infoValue}>{booking.room.name || '-'}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>ID Ruangan</span>
                                <span className={styles.infoValue}>{booking.room.room_id || '-'}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Jenis Ruangan</span>
                                <span className={styles.infoValue}>{booking.room.type || '-'}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>ID Transaksi</span>
                                <span className={styles.infoValue}>{booking.booking_id || '-'}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Tanggal Sewa</span>
                                <span className={styles.infoValue}>
                                    {booking.check_in && booking.check_out ? (
                                        (() => {
                                            const checkIn = new Date(booking.check_in)
                                            const checkOut = new Date(booking.check_out)
                                            const date = checkIn.toISOString().split('T')[0]
                                            const startTime = checkIn.toTimeString().slice(0, 5)
                                            const endTime = checkOut.toTimeString().slice(0, 5)
                                            return `${date} (${startTime} - ${endTime})`
                                        })()
                                    ) : booking.booking_date || '-'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <p className={styles.infoLabel}>Data transaksi tidak ditemukan</p>
                    )}
                </div>

                {/* Detail Keluhan */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <div>
                            <h3 className={styles.sectionTitle}>Detail Keluhan</h3>
                            <p className={styles.sectionSubtitle}>Pengisian detail keuluhan</p>
                        </div>
                    </div>
                    <div className={styles.form}>
                        <div className={styles.field}>
                            <label className={styles.label}>
                                Kategori Keluhan
                                {showValidationErrors && !reportType && <span className={styles.required}>Wajib</span>}
                            </label>
                            <select
                                className={styles.select}
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                                required
                            >
                                <option value="">Pilih kategori keluhan</option>
                                {categories.map((category) => (
                                    <option key={category.value} value={category.value}>
                                        {category.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>
                                Detail Keluhan
                                {showValidationErrors && !description && <span className={styles.required}>Wajib</span>}
                            </label>
                            <textarea
                                className={styles.textarea}
                                rows={5}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Jelaskan detail masalah yang Anda alami..."
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Lampiran Bukti Foto */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h3 className={styles.sectionTitle}>Lampiran Bukti Foto</h3>
                    </div>
                    <div
                        className={styles.dropzone}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        <div className={styles.dropzoneContent}>
                            <svg className={styles.uploadIcon} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className={styles.dropzoneText}>Seret foto ke sini atau klik untuk pilih</p>
                            <p className={styles.dropzoneSubtext}>Format JPG, PNG Maks. 5 MB per foto</p>
                            <button type="button" className={styles.selectDeviceBtn}>
                                Pilih dari perangkat
                            </button>
                        </div>
                        <input
                            type="file"
                            className={styles.fileInput}
                            accept="image/jpeg,image/png"
                            multiple
                            onChange={handlePhotoUpload}
                        />
                    </div>

                    {uploadedPhotoUrls.length > 0 && (
                        <>
                            <p className={styles.photoInfo}>
                                Foto bukti keluhan ({uploadedPhotoUrls.length}/7)
                            </p>
                            <div className={styles.photoGrid}>
                                {uploadedPhotoUrls.map((photo, index) => (
                                    <div key={index} className={styles.photoItem}>
                                        <img src={photo} alt={`Foto ${index + 1}`} className={styles.photoThumbnail} />
                                        <button
                                            type="button"
                                            className={styles.removePhotoBtn}
                                            onClick={() => removePhoto(index)}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Action Buttons */}
                <div className={styles.footer}>
                    <button
                        type="button"
                        className={`${styles.btn} ${styles.btnCancel}`}
                        onClick={handleCancel}
                        disabled={isSubmitting}
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        className={`${styles.btn} ${styles.btnSubmit}`}
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Mengirim...' : 'Laporkan'}
                    </button>
                </div>
            </div>
        </div>
    )
}
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './AddRoomPage.module.css';

interface SessionUser {
  user_id: string;
  name: string;
  email: string;
  role: string;
}

interface Region {
  region_id: string;
  name: string;
  province_id: string;
}

interface Province {
  province_id: string;
  name: string;
}

const roomTypes = [
  { value: 'meeting_room', label: 'Meeting Room' },
  { value: 'conference_room', label: 'Conference Room' },
  { value: 'seminar_room', label: 'Seminar Room' },
  { value: 'coworking_space', label: 'Coworking Space' },
  { value: 'training_room', label: 'Training Room' },
  { value: 'studio', label: 'Studio' },
  { value: 'event_hall', label: 'Event Hall' },
];

function getStoredUser(): SessionUser | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const userData = localStorage.getItem('user');
  if (!userData) {
    return null;
  }

  try {
    return JSON.parse(userData) as SessionUser;
  } catch {
    return null;
  }
}

export default function AddRoomPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Location data
  const [regions, setRegions] = useState<Region[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
  const [regionSearch, setRegionSearch] = useState('');
  const [provinceSearch, setProvinceSearch] = useState('');
  const regionDropdownRef = useRef<HTMLDivElement>(null);
  const provinceDropdownRef = useRef<HTMLDivElement>(null);

  // Photos
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const fileInputRef = useState<HTMLInputElement | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_per_hour: '',
    capacity: '',
    type: '',
    region_id: '',
    region_name: '',
    province_id: '',
    province_name: '',
    address: '',
  });

  // Fetch regions and provinces
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const [regionsRes, provincesRes] = await Promise.all([
          fetch('/api/locations?type=region'),
          fetch('/api/locations?type=province'),
        ]);
        const regionsData = await regionsRes.json();
        const provincesData = await provincesRes.json();
        if (regionsData.success) setRegions(regionsData.data || []);
        if (provincesData.success) setProvinces(provincesData.data || []);
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };
    fetchLocations();
  }, []);

  // Filter regions by selected province and search
  const filteredRegions = regions
    .filter((r) => !formData.province_id || r.province_id === formData.province_id)
    .filter((r) => r.name.toLowerCase().includes(regionSearch.toLowerCase()));

  // Filter provinces by search
  const filteredProvinces = provinces.filter((p) =>
    p.name.toLowerCase().includes(provinceSearch.toLowerCase())
  );

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      router.push('/auth/login');
      return;
    }
    setUser(storedUser);
  }, [router]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(event.target as Node)) {
        setShowRegionDropdown(false);
        setRegionSearch('');
      }
      if (provinceDropdownRef.current && !provinceDropdownRef.current.contains(event.target as Node)) {
        setShowProvinceDropdown(false);
        setProvinceSearch('');
      }
    };

    if (showRegionDropdown || showProvinceDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showRegionDropdown, showProvinceDropdown]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (submitError) setSubmitError(null);
  };

  const handleRegionSelect = (region: Region) => {
    const province = provinces.find((p) => p.province_id === region.province_id);
    setFormData((prev) => ({
      ...prev,
      region_id: region.region_id,
      region_name: region.name,
      province_id: region.province_id,
      province_name: province?.name || prev.province_name,
    }));
    setShowRegionDropdown(false);
    setRegionSearch('');
  };

  const handleProvinceSelect = (province: Province) => {
    setFormData((prev) => ({
      ...prev,
      province_id: province.province_id,
      province_name: province.name,
      // Reset region if it's from different province
      region_id: prev.province_id !== province.province_id ? '' : prev.region_id,
      region_name: prev.province_id !== province.province_id ? '' : prev.region_name,
    }));
    setShowProvinceDropdown(false);
    setProvinceSearch('');
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files).slice(0, 8 - photos.length);
    const newPhotos = [...photos, ...newFiles].slice(0, 8);
    const newUrls = newPhotos.map((file) => URL.createObjectURL(file));

    setPhotos(newPhotos);
    setPhotoUrls(newUrls);
  }, [photos]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files) return;

    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/')).slice(0, 8 - photos.length);
    const newPhotos = [...photos, ...imageFiles].slice(0, 8);
    const newUrls = newPhotos.map((file) => URL.createObjectURL(file));

    setPhotos(newPhotos);
    setPhotoUrls(newUrls);
  }, [photos]);

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    const newUrls = newPhotos.map((file) => URL.createObjectURL(file));
    setPhotos(newPhotos);
    setPhotoUrls(newUrls);
  };

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handlePhotoDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handlePhotoDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handlePhotoDragLeave = () => {
    setDragOverIndex(null);
  };

  const handlePhotoDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder photos
    const newPhotos = [...photos];
    const [draggedPhoto] = newPhotos.splice(draggedIndex, 1);
    newPhotos.splice(dropIndex, 0, draggedPhoto);

    const newUrls = newPhotos.map((file) => URL.createObjectURL(file));
    setPhotos(newPhotos);
    setPhotoUrls(newUrls);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handlePhotoDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleUploadAreaDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const isFieldEmpty = (value: string) => value.trim() === '';

  const isFieldValid = (field: string) => {
    if (!showValidation) return true;
    const value = formData[field as keyof typeof formData];
    return !isFieldEmpty(value as string);
  };

  const completedSections = [
    !isFieldEmpty(formData.name) &&
      !isFieldEmpty(formData.description) &&
      !isFieldEmpty(formData.price_per_hour) &&
      !isFieldEmpty(formData.capacity),
    !isFieldEmpty(formData.type),
    !isFieldEmpty(formData.region_id) && !isFieldEmpty(formData.address),
    photos.length > 0,
  ];

  const handleBack = () => {
    router.push('/owner/dashboard');
  };

  const validateForm = () => {
    const requiredFields = ['name', 'description', 'price_per_hour', 'capacity', 'type', 'region_id', 'address'];
    return requiredFields.every((field) => !isFieldEmpty(formData[field as keyof typeof formData]));
  };

  const buildLocationString = () => {
    const parts = [formData.address, formData.region_name, formData.province_name].filter(Boolean);
    return parts.join(', ');
  };

  const handleSubmit = async () => {
    setShowValidation(true);
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    if (!user?.user_id) {
      setSubmitError('Sesi login tidak valid. Silakan login kembali.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload photos first if any
      let imageUrls: string[] = [];
      if (photos.length > 0) {
        const formDataUpload = new FormData();
        photos.forEach((photo) => formDataUpload.append('photos', photo));
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload,
        });
        const uploadResult = await uploadRes.json();
        if (uploadResult.success && uploadResult.urls?.length > 0) {
          imageUrls = uploadResult.urls;
        }
      }

      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.user_id,
          name: formData.name,
          description: formData.description,
          price_per_hour: Number(formData.price_per_hour),
          capacity: Number(formData.capacity),
          type: formData.type,
          location: buildLocationString(),
          region_id: formData.region_id,
          images: imageUrls.length > 0 ? imageUrls : undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        router.push('/owner/dashboard');
      } else {
        setSubmitError(result.message || 'Gagal menambahkan ruangan. Silakan coba lagi.');
      }
    } catch {
      setSubmitError('Terjadi kesalahan saat menyimpan data. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!user) {
    return (
      <div className={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backButton} onClick={handleBack} type="button">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className={styles.headerTitle}>Tambah Ruangan</h1>
      </header>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Form Sections */}
        <div className={styles.formSections}>
          {/* Informasi Dasar */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Informasi Dasar</h2>
              <p className={styles.sectionSubtitle}>Nama, deskripsi, dan harga ruangan</p>
            </div>

            <div className={styles.formGrid}>
              {/* Nama Ruangan */}
              <div className={`${styles.formField} ${styles.formFieldFull}`}>
                <label className={styles.fieldLabel}>
                  <span>Nama Ruangan</span>
                  <span className={`${styles.requiredBadge} ${!isFieldValid('name') ? styles.visible : ''}`}>
                    wajib diisi
                  </span>
                </label>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="Masukkan nama ruangan"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>

              {/* Deskripsi */}
              <div className={`${styles.formField} ${styles.formFieldFull}`}>
                <label className={styles.fieldLabel}>
                  <span>Deskripsi</span>
                  <span className={`${styles.requiredBadge} ${!isFieldValid('description') ? styles.visible : ''}`}>
                    wajib diisi
                  </span>
                </label>
                <textarea
                  className={styles.textareaInput}
                  placeholder="Masukkan deskripsi ruangan"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                />
              </div>

              {/* Harga per jam */}
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>
                  <span>Harga per jam</span>
                  <span className={`${styles.requiredBadge} ${!isFieldValid('price_per_hour') ? styles.visible : ''}`}>
                    wajib diisi
                  </span>
                </label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputPrefix}>Rp</span>
                  <input
                    type="number"
                    className={`${styles.textInput} ${styles.withPrefix}`}
                    placeholder="Masukkan harga sewa"
                    value={formData.price_per_hour}
                    onChange={(e) => handleInputChange('price_per_hour', e.target.value)}
                  />
                  <span className={styles.inputSuffix}>/jam</span>
                </div>
              </div>

              {/* Kapasitas */}
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>
                  <span>Kapasitas</span>
                  <span className={`${styles.requiredBadge} ${!isFieldValid('capacity') ? styles.visible : ''}`}>
                    wajib diisi
                  </span>
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    type="number"
                    className={styles.textInput}
                    placeholder="Masukkan kapasitas"
                    value={formData.capacity}
                    onChange={(e) => handleInputChange('capacity', e.target.value)}
                  />
                  <span className={styles.inputSuffix}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tipe Ruangan */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Tipe Ruangan</h2>
              <p className={styles.sectionSubtitle}>Pilih kategori paling sesuai</p>
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>
                <span>Tipe ruangan</span>
                <span className={`${styles.requiredBadge} ${!isFieldValid('type') ? styles.visible : ''}`}>
                  Pilih salah satu
                </span>
              </label>
              <div className={styles.roomTypeGrid}>
                {roomTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    className={`${styles.roomTypeButton} ${formData.type === type.value ? styles.selected : ''}`}
                    onClick={() => handleInputChange('type', type.value)}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Lokasi */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Lokasi</h2>
              <p className={styles.sectionSubtitle}>Provinsi, kota, dan alamat lengkap</p>
            </div>

            <div className={styles.formGrid}>
              {/* Provinsi */}
              <div className={styles.formField} ref={provinceDropdownRef}>
                <label className={styles.fieldLabel}>
                  <span>Provinsi</span>
                  <span className={`${styles.requiredBadge} ${!isFieldValid('province_id') ? styles.visible : ''}`}>
                    wajib
                  </span>
                </label>
                <div className={styles.selectWrapper}>
                  <button
                    type="button"
                    className={styles.selectTrigger}
                    onClick={() => setShowProvinceDropdown(!showProvinceDropdown)}
                  >
                    <span className={formData.province_name ? styles.selectValue : styles.selectPlaceholder}>
                      {formData.province_name || 'Masukkan nama provinsi'}
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
                          onChange={(e) => setProvinceSearch(e.target.value)}
                          className={styles.searchInput}
                          autoFocus
                        />
                      </div>
                      <div className={styles.dropdownList}>
                        {filteredProvinces.map((province) => (
                          <button
                            key={province.province_id}
                            type="button"
                            className={styles.selectOption}
                            onClick={() => handleProvinceSelect(province)}
                          >
                            <div className={styles.optionIcon}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v9" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            <div className={styles.optionContent}>
                              <span className={styles.optionTitle}>Prov. {province.name}</span>
                              <span className={styles.optionSubtitle}>{province.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Kota/Kabupaten */}
              <div className={styles.formField} ref={regionDropdownRef}>
                <label className={styles.fieldLabel}>
                  <span>Kota/Kabupaten</span>
                  <span className={`${styles.requiredBadge} ${!isFieldValid('region_id') ? styles.visible : ''}`}>
                    wajib
                  </span>
                </label>
                <div className={styles.selectWrapper}>
                  <button
                    type="button"
                    className={styles.selectTrigger}
                    onClick={() => setShowRegionDropdown(!showRegionDropdown)}
                    disabled={!formData.province_id}
                  >
                    <span className={formData.region_name ? styles.selectValue : styles.selectPlaceholder}>
                      {formData.region_name || (formData.province_id ? 'Masukkan kota/kabupaten' : 'Pilih provinsi terlebih dahulu')}
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
                          onChange={(e) => setRegionSearch(e.target.value)}
                          className={styles.searchInput}
                          autoFocus
                        />
                      </div>
                      <div className={styles.dropdownList}>
                        {filteredRegions.map((region) => (
                          <button
                            key={region.region_id}
                            type="button"
                            className={styles.selectOption}
                            onClick={() => handleRegionSelect(region)}
                          >
                            <div className={styles.optionIcon}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v9" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            <div className={styles.optionContent}>
                              <span className={styles.optionTitle}>{region.name}</span>
                              <span className={styles.optionSubtitle}>
                                {provinces.find((p) => p.province_id === region.province_id)?.name || ''}
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
            <div className={`${styles.formField} ${styles.formFieldFull}`} style={{ marginTop: '20px' }}>
              <label className={styles.fieldLabel}>
                <span>Alamat Lengkap</span>
                <span className={`${styles.requiredBadge} ${!isFieldValid('address') ? styles.visible : ''}`}>
                  wajib
                </span>
              </label>
              <textarea
                className={styles.textareaInput}
                placeholder="Masukkan alamat lengkap ruangan"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Foto Ruangan */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Foto Ruangan</h2>
              <p className={styles.sectionSubtitle}>Unggah minimal 1 foto, maks 8 foto</p>
            </div>

            {/* Upload Area */}
            <div
              className={styles.uploadArea}
              onDrop={handleDrop}
              onDragOver={handleUploadAreaDragOver}
              onClick={() => document.getElementById('photo-input')?.click()}
            >
              <input
                id="photo-input"
                type="file"
                accept="image/jpeg,image/png"
                multiple
                className={styles.hiddenInput}
                onChange={handleFileSelect}
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
              <button type="button" className={styles.uploadButton} onClick={(e) => { e.stopPropagation(); document.getElementById('photo-input')?.click(); }}>
                Pilih dari perangkat
              </button>
            </div>

            {/* Preview Photos */}
            {photoUrls.length > 0 && (
              <div className={styles.photoPreviewSection}>
                <h4 className={styles.previewTitle}>Preview foto</h4>
                <div className={styles.photoGrid}>
                  {photoUrls.map((url, index) => (
                    <div
                      key={index}
                      className={`${styles.photoItem} ${draggedIndex === index ? styles.dragging : ''} ${dragOverIndex === index ? styles.dragOver : ''}`}
                      draggable
                      onDragStart={() => handlePhotoDragStart(index)}
                      onDragOver={(e) => handlePhotoDragOver(e, index)}
                      onDragLeave={handlePhotoDragLeave}
                      onDrop={(e) => handlePhotoDrop(e, index)}
                      onDragEnd={handlePhotoDragEnd}
                    >
                      <img src={url} alt={`Preview ${index + 1}`} className={styles.photoThumb} draggable={false} />
                      <button
                        type="button"
                        className={styles.photoRemove}
                        onClick={() => handleRemovePhoto(index)}
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
          </div>
        </div>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <h3 className={styles.sidebarTitle}>Kelengkapan</h3>

            <div className={styles.checklist}>
              <div className={`${styles.checklistItem} ${completedSections[0] ? styles.active : ''}`}>
                <span className={`${styles.checkNumber} ${completedSections[0] ? styles.completed : ''}`}>
                  {completedSections[0] ? (
                    <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    '1'
                  )}
                </span>
                <span>Informasi Dasar</span>
              </div>

              <div className={`${styles.checklistItem} ${completedSections[1] ? styles.active : ''}`}>
                <span className={`${styles.checkNumber} ${completedSections[1] ? styles.completed : ''}`}>
                  {completedSections[1] ? (
                    <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    '2'
                  )}
                </span>
                <span>Tipe Ruangan</span>
              </div>

              <div className={`${styles.checklistItem} ${completedSections[2] ? styles.active : ''}`}>
                <span className={`${styles.checkNumber} ${completedSections[2] ? styles.completed : ''}`}>
                  {completedSections[2] ? (
                    <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    '3'
                  )}
                </span>
                <span>Lokasi</span>
              </div>

              <div className={`${styles.checklistItem} ${completedSections[3] ? styles.active : ''}`}>
                <span className={`${styles.checkNumber} ${completedSections[3] ? styles.completed : ''}`}>
                  {completedSections[3] ? (
                    <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    '4'
                  )}
                </span>
                <span>Foto Ruangan</span>
              </div>
            </div>

            {showValidation && !validateForm() && (
              <div className={styles.validationMessage}>
                Silahkan lengkapi pengisian terlebih dahulu
              </div>
            )}

            {submitError && (
              <div className={styles.errorMessage}>
                {submitError}
              </div>
            )}

            <div className={styles.actionButtons}>
              <button className={styles.previewButton} onClick={handlePreview} type="button">
                Preview
              </button>
              <button
                className={styles.saveButton}
                onClick={handleSubmit}
                disabled={isSubmitting}
                type="button"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className={styles.modalOverlay} onClick={() => setShowPreview(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Preview Ruangan</h2>
              <button className={styles.modalClose} onClick={() => setShowPreview(false)} type="button">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
                  <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Room Image */}
              <div className={styles.previewImageContainer}>
                {photoUrls.length > 0 ? (
                  <img src={photoUrls[0]} alt="Room Preview" className={styles.previewImage} />
                ) : (
                  <div className={styles.previewImagePlaceholder}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21,15 16,10 5,21" />
                    </svg>
                    <span>Belum ada foto</span>
                  </div>
                )}
              </div>

              {/* Room Info */}
              <div className={styles.previewInfo}>
                <h3 className={styles.previewRoomName}>
                  {formData.name || 'Nama Ruangan'}
                </h3>

                <div className={styles.previewMeta}>
                  <span className={styles.previewType}>
                    {roomTypes.find(t => t.value === formData.type)?.label || 'Tipe Ruangan'}
                  </span>
                  <span className={styles.previewCapacity}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    {formData.capacity || '0'} orang
                  </span>
                </div>

                <div className={styles.previewPrice}>
                  {formData.price_per_hour ? formatCurrency(Number(formData.price_per_hour)) : 'Rp 0'}/jam
                </div>

                <div className={styles.previewLocation}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{buildLocationString() || 'Lokasi belum diisi'}</span>
                </div>

                <div className={styles.previewDescription}>
                  <h4>Deskripsi</h4>
                  <p>{formData.description || 'Belum ada deskripsi'}</p>
                </div>

                {photoUrls.length > 1 && (
                  <div className={styles.previewGallery}>
                    <h4>Galeri Foto</h4>
                    <div className={styles.previewThumbs}>
                      {photoUrls.slice(1).map((url, idx) => (
                        <img key={idx} src={url} alt={`Gallery ${idx + 2}`} className={styles.previewThumb} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.modalCloseBtn} onClick={() => setShowPreview(false)} type="button">
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

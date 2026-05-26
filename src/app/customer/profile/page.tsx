'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import ProfilePage from '@/components/profile/ProfilePage'

export default function CustomerProfile() {
  const router = useRouter()
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      const user = JSON.parse(stored)
      setIsOwner(user?.role === 'owner')
    }
  }, [])

  return (
    <ProfilePage
      showNavbar={true}
      NavbarComponent={Navbar}
      onNavigateToBusiness={isOwner ? () => router.push('/owner/profile') : undefined}
      showBusinessTab={false}
    />
  )
}

'use client'

import BackButton from '@/components/ui/BackButton'
import ProfilePage from '@/components/profile/ProfilePage'

export default function OwnerProfilePage() {
  return (
    <div className="owner-profile-container">
      <BackButton href="/owner/dashboard" title="Profil" />
      <ProfilePage
        showNavbar={false}
        showBusinessTab={true}
      />
    </div>
  )
}

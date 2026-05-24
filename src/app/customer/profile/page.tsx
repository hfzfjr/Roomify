import Navbar from '@/components/layout/Navbar'
import ProfilePage from '@/components/profile/ProfilePage'

export default function CustomerProfile() {
  return <ProfilePage showNavbar={true} NavbarComponent={Navbar} />
}

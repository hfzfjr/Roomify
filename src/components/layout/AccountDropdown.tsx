'use client'

import './AccountDropdown.css'

interface AccountDropdownProps {
  name: string
  role: string
  onProfileClick: () => void
  onLogout: () => void
}

export default function AccountDropdown({ name, role, onProfileClick, onLogout }: AccountDropdownProps) {
  return (
    <div className="account-dropdown" role="menu">
      <div className="account-dropdown-header">
        <span className="account-dropdown-name">{name}</span>
        <span className="account-dropdown-role">{role}</span>
      </div>
      <button type="button" className="account-dropdown-item" onClick={onProfileClick}>
        Profil
      </button>
      <button type="button" className="account-dropdown-item danger" onClick={onLogout}>
        Logout
      </button>
    </div>
  )
}

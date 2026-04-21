// Type definitions for locations
export interface Location {
  id?: string | number
  city: string
  province: string
  type?: 'province' | 'region'
  regionType?: string
}

export function getLocationDisplay(city: string, province: string): string {
  return `${city}, ${province}`
}

export function getLocationPrimaryLabel(location: Location): string {
  return location.type === 'province' ? location.province : location.city
}

export function getLocationSearchText(location: Location): string {
  return [location.city, location.province, getLocationOptionLabel(location), location.regionType]
    .filter(Boolean)
    .join(' ')
    .trim()
    .toLowerCase()
}

export function getLocationOptionLabel(location: Location): string {
  if (location.type === 'province') {
    return location.province
  }

  if (location.regionType === 'kota') {
    return `Kota ${location.city}`
  }

  if (location.regionType === 'kabupaten') {
    return `Kabupaten ${location.city}`
  }

  return location.city
}

export function getLocationQueryValue(location: Location): string {
  return location.type === 'province' ? location.province : location.city
}

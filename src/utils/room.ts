import { Room } from '@/types'

export const ROOM_IMAGE_PLACEHOLDER = '/images/gambarRuangan.png'

export const ROOM_TYPE_LABELS: Record<string, string> = {
  meeting_room: 'Meeting Room',
  seminar_room: 'Seminar Room',
  studio: 'Studio',
  training_room: 'Training Room',
  coworking_space: 'Coworking Space',
  event_hall: 'Event Hall'
}

export function getRoomTypeLabel(type?: string | null) {
  if (!type) {
    return 'Ruangan'
  }

  return ROOM_TYPE_LABELS[type] ?? type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function getRoomImages(imageUrl?: string | null) {
  return imageUrl ? [imageUrl] : []
}

export function normalizeRoom(room: Omit<Room, 'facilities' | 'images'> & {
  facilities?: string[]
  image_url?: string | null
  images?: string[]
}) {
  return {
    ...room,
    facilities: room.facilities ?? [],
    image_url: room.image_url ?? room.images?.[0] ?? null,
    images: room.images ?? getRoomImages(room.image_url)
  }
}

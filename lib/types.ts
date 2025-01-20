export type User = {
  id: string
  email: string
  full_name: string | null
  created_at: string
  updated_at: string
}

export type Event = {
  event_id: string
  title: string
  description: string | null
  organization: string
  location: string
  date: string
  max_participants: number
  category: string
  image: string | null
  participant_count: number
  registration_id?: string
  user_id?: string
  registered_name?: string
  registered_email?: string
  registration_status?: string
  registration_date?: string
  created_at: string
}

export type Registration = {
  id: string
  user_id: string
  event_id: string
  name: string
  email: string
  phone: string | null
  status: 'active' | 'cancelled'
  created_at: string
} 
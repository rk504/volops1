export type User = {
  id: string
  email: string
  full_name: string | null
  created_at: string
  updated_at: string
}

export type Event = {
  id: string
  title: string
  description: string | null
  location: string
  date: string
  max_participants: number
  current_participants: number
  created_at: string
  updated_at: string
}

export type Registration = {
  id: string
  user_id: string
  event_id: string
  created_at: string
} 
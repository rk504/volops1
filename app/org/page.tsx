import { useAuth } from '@/lib/auth/AuthContext'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function OrgPage() {
  const { user } = useAuth()
  
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4 p-4 text-center">
        <h1 className="text-2xl font-bold">Organization Portal</h1>
        <p className="text-lg text-gray-600">Sign in to create and manage volunteer opportunities</p>
        <div className="space-x-4">
          <Link href="/">
            <Button variant="outline">Return to Home</Button>
          </Link>
          <Link href="/auth/signin">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    )
  }

  // ... rest of the existing code ...
} 
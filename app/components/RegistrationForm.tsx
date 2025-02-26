import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'

interface RegistrationFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { name: string; email: string; phone?: string }) => void
  title: string
}

export default function RegistrationForm({ isOpen, onClose, onSubmit, title }: RegistrationFormProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const { session } = useAuth()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    console.log('Pre-registration auth check:', {
      hasSession: !!session,
      userId: session?.user?.id
    })

    if (!session) {
      console.error('No active session')
      return
    }

    onSubmit({ 
      name, 
      email: session.user.email || '', 
      phone 
    })
    setName('')
    setPhone('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" aria-describedby="registration-form-description">
        <DialogHeader>
          <DialogTitle>Register for {title}</DialogTitle>
          <DialogDescription id="registration-form-description">
            Fill out your information below to register for this opportunity.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!session}>
              Register
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 
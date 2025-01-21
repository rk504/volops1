import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

interface RegistrationSuccessProps {
  isOpen: boolean
  onClose: () => void
  title: string
}

export default function RegistrationSuccess({ isOpen, onClose, title }: RegistrationSuccessProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] text-center">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">You're Registered! 🎉</DialogTitle>
        </DialogHeader>
        <div className="py-6 flex flex-col items-center space-y-4">
          <CheckCircle2 className="w-20 h-20 text-green-500" />
          <p className="text-lg">
            Successfully registered for<br />
            <span className="font-semibold">{title}</span>
          </p>
          <p className="text-sm text-gray-500">
            Check your dashboard for event details.<br />
            We'll send you a reminder email 48 hours before the event.
          </p>
        </div>
        <div className="flex justify-center">
          <Button onClick={onClose}>
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
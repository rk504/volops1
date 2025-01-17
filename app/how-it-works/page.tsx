import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, UserCheck, Calendar, Heart } from 'lucide-react'

export default function HowItWorks() {
  const steps = [
    {
      title: "Search Opportunities",
      description: "Browse through a wide range of volunteer opportunities in your area.",
      icon: Search,
    },
    {
      title: "Sign Up",
      description: "Create an account and complete your volunteer profile.",
      icon: UserCheck,
    },
    {
      title: "Schedule",
      description: "Choose the dates and times that work best for you.",
      icon: Calendar,
    },
    {
      title: "Make a Difference",
      description: "Contribute to your community and make a positive impact.",
      icon: Heart,
    },
  ]

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold text-center mb-12">How Volops Works</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {steps.map((step, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <step.icon className="w-6 h-6 text-blue-500" />
                <span>{step.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{step.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}


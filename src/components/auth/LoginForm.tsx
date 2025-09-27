'use client'

import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/contexts/AuthContext'
import { LogIn } from 'lucide-react'

interface LoginFormProps {
  onSuccess?: () => void
  className?: string
}

export function LoginForm({ onSuccess, className }: LoginFormProps) {
  const { connect, isLoading, connectError } = useAuth()
  const { addToast } = useToast()

  const handleSignIn = async () => {
    try {
      await connect()
      addToast({
        type: 'success',
        title: 'Login Successful',
        message: 'Welcome to Deal Master!'
      })
      onSuccess?.()
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Login Failed',
        message: error instanceof Error ? error.message : 'Failed to sign in'
      })
    }
  }

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-gray-900">
          Welcome to Deal Master
        </CardTitle>
        <p className="text-gray-600">
          Sign in to start playing Deal or No Deal
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {connectError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">{connectError.message}</p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            variant="primary"
            size="lg"
            onClick={handleSignIn}
            loading={isLoading}
            className="w-full flex items-center justify-center space-x-2"
          >
            <LogIn className="h-5 w-5" />
            <span>Sign In</span>
          </Button>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

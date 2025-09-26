'use client'

import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/contexts/AuthContext'
import { Mail, Wallet } from 'lucide-react'

interface LoginFormProps {
  onSuccess?: () => void
  className?: string
}

export function LoginForm({ onSuccess, className }: LoginFormProps) {
  const { loginWithGoogle, loginWithWallet, isLoading, error } = useAuth()
  const { addToast } = useToast()

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle()
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
        message: error instanceof Error ? error.message : 'Failed to login with Google'
      })
    }
  }

  const handleWalletLogin = async () => {
    try {
      await loginWithWallet()
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
        message: error instanceof Error ? error.message : 'Failed to login with wallet'
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
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            variant="primary"
            size="lg"
            onClick={handleGoogleLogin}
            loading={isLoading}
            className="w-full flex items-center justify-center space-x-2"
          >
            <Mail className="h-5 w-5" />
            <span>Continue with Google</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={handleWalletLogin}
            loading={isLoading}
            className="w-full flex items-center justify-center space-x-2"
          >
            <Wallet className="h-5 w-5" />
            <span>Connect Wallet</span>
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

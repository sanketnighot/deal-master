'use client'

import { LoginForm } from '@/components/auth/LoginForm'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'
import { Play, Shield, Trophy, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Disable static generation for this page
export const dynamic = 'force-dynamic'

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Deal or No Deal
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Experience the thrill of the classic game with Web3 authentication.
            Choose your case, burn others, and decide when to take the banker's offer!
          </p>

          {/* Login Form */}
          <div className="max-w-md mx-auto mb-12">
            <LoginForm />
          </div>

          {/* Demo Button */}
          <div className="mb-16">
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push('/demo')}
              className="flex items-center space-x-2 mx-auto"
            >
              <Play className="h-5 w-5" />
              <span>Try Demo (No Login Required)</span>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary-600" />
              </div>
              <CardTitle>Secure Authentication</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Login with your wallet or Google account using Web3Auth for secure, decentralized authentication.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mb-4">
                <Trophy className="h-6 w-6 text-secondary-600" />
              </div>
              <CardTitle>Classic Gameplay</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Experience the authentic Deal or No Deal gameplay with 5 cases, banker offers, and strategic decisions.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Fast & Fair</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Server-side game logic ensures fair play with cryptographically secure randomness and transparent rules.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How to Play */}
        <div className="mt-16 max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">How to Play</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold">Choose Your Case</h3>
                    <p className="text-gray-600">Select one of 5 cases to keep throughout the game.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold">Burn Cases</h3>
                    <p className="text-gray-600">Reveal and remove other cases to narrow down the possibilities.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold">Banker's Offers</h3>
                    <p className="text-gray-600">The banker will make offers based on remaining cases. Accept or continue playing.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold">Final Decision</h3>
                    <p className="text-gray-600">When only 2 cases remain, choose to keep your case or swap with the other.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

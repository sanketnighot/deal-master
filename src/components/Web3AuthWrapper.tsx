'use client'

import { web3authConfig } from '@/lib/web3auth'
import { Web3AuthProvider } from '@web3auth/modal/react'
import { ReactNode, useEffect, useState } from 'react'

interface Web3AuthWrapperProps {
  children: ReactNode
}

export function Web3AuthWrapper({ children }: Web3AuthWrapperProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <Web3AuthProvider config={web3authConfig}>
      {children}
    </Web3AuthProvider>
  )
}

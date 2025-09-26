import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Web3Auth
jest.mock('@/lib/web3auth', () => ({
  getWeb3Auth: jest.fn(),
  getAuthState: jest.fn(),
  loginWithGoogle: jest.fn(),
  loginWithWallet: jest.fn(),
  logout: jest.fn(),
  getAuthHeader: jest.fn(),
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID = 'test-client-id'
process.env.WEB3AUTH_ISSUER = 'https://test.web3auth.com'

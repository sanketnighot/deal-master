import { Web3Auth } from '@web3auth/modal'
import { OpenloginAdapter } from '@web3auth/openlogin-adapter'

// Web3Auth configuration
const web3authConfig = {
  clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID!,
  web3AuthNetwork: 'sapphire_devnet', // Use sapphire_mainnet for production
  chainConfig: {
    chainNamespace: 'eip155',
    chainId: '0x1', // Ethereum mainnet
    rpcTarget: 'https://rpc.ankr.com/eth',
    displayName: 'Ethereum Mainnet',
    blockExplorer: 'https://etherscan.io',
    ticker: 'ETH',
    tickerName: 'Ethereum',
  },
}

// OpenLogin adapter configuration
const openloginAdapterConfig = {
  adapterSettings: {
    uxMode: 'popup',
    whiteLabel: {
      name: 'Deal Master',
      logoLight: '/logo-light.png',
      logoDark: '/logo-dark.png',
      defaultLanguage: 'en',
      dark: false,
    },
    loginConfig: {
      google: {
        verifier: 'google',
        typeOfLogin: 'google',
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      },
    },
  },
}

// Initialize Web3Auth instance
let web3authInstance: Web3Auth | null = null

export async function getWeb3Auth(): Promise<Web3Auth> {
  if (web3authInstance) {
    return web3authInstance
  }

  if (typeof window === 'undefined') {
    throw new Error('Web3Auth can only be used in the browser')
  }

  web3authInstance = new Web3Auth(web3authConfig)

  // Add OpenLogin adapter
  const openloginAdapter = new OpenloginAdapter(openloginAdapterConfig)
  web3authInstance.configureAdapter(openloginAdapter)

  // Initialize Web3Auth
  await web3authInstance.init()

  return web3authInstance
}

// Authentication state management
export interface AuthState {
  isAuthenticated: boolean
  user: {
    id: string
    email?: string
    name?: string
    walletAddress?: string
  } | null
  idToken: string | null
}

// Get current authentication state
export async function getAuthState(): Promise<AuthState> {
  try {
    const web3auth = await getWeb3Auth()

    if (!web3auth.connected) {
      return {
        isAuthenticated: false,
        user: null,
        idToken: null
      }
    }

    const user = await web3auth.getUserInfo()
    const idToken = await web3auth.authenticateUser()

    return {
      isAuthenticated: true,
      user: {
        id: user.verifierId || user.verifier || 'unknown',
        email: user.email,
        name: user.name,
        walletAddress: user.verifierId
      },
      idToken: idToken.idToken
    }
  } catch (error) {
    console.error('Error getting auth state:', error)
    return {
      isAuthenticated: false,
      user: null,
      idToken: null
    }
  }
}

// Login with Google
export async function loginWithGoogle(): Promise<AuthState> {
  try {
    const web3auth = await getWeb3Auth()

    const web3authProvider = await web3auth.connectTo('openlogin', {
      loginProvider: 'google',
    })

    if (!web3authProvider) {
      throw new Error('Failed to connect to Web3Auth')
    }

    return await getAuthState()
  } catch (error) {
    console.error('Google login error:', error)
    throw error
  }
}

// Login with wallet
export async function loginWithWallet(): Promise<AuthState> {
  try {
    const web3auth = await getWeb3Auth()

    const web3authProvider = await web3auth.connectTo('openlogin', {
      loginProvider: 'metamask',
    })

    if (!web3authProvider) {
      throw new Error('Failed to connect to Web3Auth')
    }

    return await getAuthState()
  } catch (error) {
    console.error('Wallet login error:', error)
    throw error
  }
}

// Logout
export async function logout(): Promise<void> {
  try {
    const web3auth = await getWeb3Auth()
    await web3auth.logout()
  } catch (error) {
    console.error('Logout error:', error)
    throw error
  }
}

// Get authorization header for API calls
export async function getAuthHeader(): Promise<string | null> {
  try {
    const authState = await getAuthState()
    return authState.idToken ? `Bearer ${authState.idToken}` : null
  } catch (error) {
    console.error('Error getting auth header:', error)
    return null
  }
}

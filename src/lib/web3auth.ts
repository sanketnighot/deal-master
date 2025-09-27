// Web3Auth configuration for React hooks
export const web3authConfig = {
  web3AuthOptions: {
    clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID!,
    web3AuthNetwork: "sapphire_devnet" as const, // Use 'sapphire_mainnet' for production
    chainConfig: {
      chainNamespace: "eip155" as const,
      chainId: "0x1", // Ethereum mainnet
      rpcTarget: "https://rpc.ankr.com/eth",
      displayName: "Ethereum Mainnet",
      blockExplorerUrl: "https://etherscan.io",
      ticker: "ETH",
      tickerName: "Ethereum",
    },
    uiConfig: {
      appName: "Deal Master",
      mode: "light" as const,
      loginMethodsOrder: [
        "google",
        "facebook",
        "twitter",
        "github",
        "discord",
        "email_passwordless",
        "metamask",
        "walletconnect",
      ],
      logoLight: "https://web3auth.io/images/web3authlog.png",
      logoDark: "https://web3auth.io/images/web3authlogodark.png",
      defaultLanguage: "en" as const,
      theme: {
        primary: "#0364ff",
      },
    },
  },
};

// Authentication state management
export interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: string;
    email?: string;
    name?: string;
    walletAddress?: string;
  } | null;
  idToken: string | null;
}

'use client'

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { pyusd_abi } from "@/lib/abi";
import { ADMIN_ADDRESS, PYUSD_ADDRESS } from "@/lib/config";
import { formatCurrency } from "@/lib/utils";
import { useWeb3Auth } from "@web3auth/modal/react";
import { ethers } from "ethers";
import { AlertCircle, CheckCircle, Loader2, Wallet, Info, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";

interface PYUSDPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (txHash: string, walletAddress: string) => void;
  entryFeeCents: number;
}

interface PaymentStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  error?: string;
}

export function PYUSDPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  entryFeeCents,
}: PYUSDPaymentModalProps) {
  const { walletAddress, authenticatedFetch } = useAuth();
  const { web3Auth } = useWeb3Auth();
  const { addToast } = useToast();
  const [steps, setSteps] = useState<PaymentStep[]>([
    {
      id: 'check-balance',
      title: 'Check PYUSD Balance',
      description: 'Verifying you have sufficient PYUSD tokens',
      status: 'pending',
    },
    {
      id: 'transfer',
      title: 'Transfer Entry Fee',
      description: 'Send PYUSD payment to admin wallet',
      status: 'pending',
    },
  ]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userBalance, setUserBalance] = useState<string>('0');
  const [txHash, setTxHash] = useState<string>('');
  const [walletType, setWalletType] = useState<'embedded' | 'external' | 'unknown'>('embedded');
  const [networkCorrect, setNetworkCorrect] = useState<boolean>(false);

  // We'll get decimals dynamically from the contract
  const entryFeeDisplay = formatCurrency(entryFeeCents);

  const updateStepStatus = (stepId: string, status: PaymentStep['status'], error?: string) => {
    setSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, status, error } : step
    ));
  };

  // Check wallet type and network on modal open
  useEffect(() => {
    if (isOpen && web3Auth) {
      detectWalletType();
      checkNetwork();
    }
  }, [isOpen, web3Auth]);

  const detectWalletType = async () => {
    try {
      if (!web3Auth?.provider) {
        setWalletType('embedded');
        return;
      }

      // Since we're using Web3Auth, we can assume it's an embedded wallet
      // Web3Auth handles both social logins (embedded) and external wallet connections
      // For this implementation, we'll treat all as embedded since Web3Auth manages the flow
      setWalletType('embedded');
    } catch (error) {
      console.error('Error detecting wallet type:', error);
      setWalletType('embedded');
    }
  };

  const checkNetwork = async () => {
    try {
      if (!web3Auth?.provider) {
        setNetworkCorrect(false);
        return;
      }

      const provider = new ethers.BrowserProvider(web3Auth.provider);
      const network = await provider.getNetwork();

      // Check if we're on Sepolia testnet (chainId 11155111)
      const isCorrectNetwork = network.chainId === BigInt(11155111);
      setNetworkCorrect(isCorrectNetwork);

      if (!isCorrectNetwork) {
        addToast({
          type: 'error',
          title: 'Wrong Network',
          message: 'Please switch to Ethereum Sepolia testnet',
        });
      }
    } catch (error) {
      console.error('Error checking network:', error);
      setNetworkCorrect(false);
    }
  };

  const switchToSepoliaNetwork = async () => {
    try {
      if (!web3Auth?.provider) {
        addToast({
          type: 'error',
          title: 'Network Switch Failed',
          message: 'Web3Auth provider not available',
        });
        return;
      }

      const provider = new ethers.BrowserProvider(web3Auth.provider);

      // Try to switch network using the provider
      try {
        await provider.send('wallet_switchEthereumChain', [
          { chainId: '0xaa36a7' } // Sepolia testnet
        ]);
        await checkNetwork();
        addToast({
          type: 'success',
          title: 'Network Switched',
          message: 'Successfully switched to Sepolia testnet',
        });
      } catch (switchError: any) {
        // If switching fails, try adding the network
        if (switchError.code === 4902) {
          await provider.send('wallet_addEthereumChain', [{
            chainId: '0xaa36a7',
            chainName: 'Ethereum Sepolia',
            rpcUrls: ['https://sepolia.infura.io/v3/'],
            nativeCurrency: {
              name: 'Ethereum',
              symbol: 'ETH',
              decimals: 18,
            },
            blockExplorerUrls: ['https://sepolia.etherscan.io/'],
          }]);
          await checkNetwork();
        } else {
          throw switchError;
        }
      }
    } catch (error: any) {
      console.error('Error switching network:', error);
      addToast({
        type: 'error',
        title: 'Network Switch Failed',
        message: 'Please manually switch to Sepolia testnet in your Web3Auth settings',
      });
    }
  };


  const handlePayment = async () => {
    if (!walletAddress) {
      addToast({
        type: 'error',
        title: 'Wallet Not Connected',
        message: 'Please connect your wallet first',
      });
      return;
    }

    if (!networkCorrect) {
      addToast({
        type: 'error',
        title: 'Wrong Network',
        message: 'Please switch to Ethereum Sepolia testnet',
      });
      return;
    }

    setIsProcessing(true);
    setCurrentStep(0);

    // Reset steps status
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending', error: undefined })));

    try {
      // Get Web3Auth provider
      if (!web3Auth) {
        throw new Error('Web3Auth instance not available');
      }

      const web3authProvider = web3Auth.provider;
      if (!web3authProvider) {
        throw new Error('Web3Auth provider not available. Please ensure you are properly logged in.');
      }

      // Create ethers provider and signer
      const provider = new ethers.BrowserProvider(web3authProvider);
      const signer = await provider.getSigner();

      // Verify we can get the signer address
      const signerAddress = await signer.getAddress();
      console.log('Signer address from payment modal:', signerAddress);
      console.log('Wallet type detected:', walletType);

      // Use signer address if walletAddress prop is not available
      const addressToUse = walletAddress || signerAddress;
      console.log('Using address for payment:', addressToUse);

      // Create PYUSD contract instance
      const pyusdContract = new ethers.Contract(PYUSD_ADDRESS, pyusd_abi, signer);

      // Step 1: Check balance
      updateStepStatus('check-balance', 'loading');

      let decimals: number;
      let entryFeeWei: bigint;

      try {
        console.log('Checking balance for wallet:', addressToUse);
        console.log('PYUSD contract address:', PYUSD_ADDRESS);

        // Get decimals from the contract
        decimals = await pyusdContract.decimals();
        console.log('PYUSD decimals:', decimals);

        // Convert entry fee to the correct units
        entryFeeWei = ethers.parseUnits((entryFeeCents / 100).toString(), decimals);
        console.log('Entry fee in wei:', entryFeeWei.toString());

        const balance = await pyusdContract.balanceOf(addressToUse);
        console.log('User balance in wei:', balance.toString());

        const formattedBalance = ethers.formatUnits(balance, decimals);
        setUserBalance(formattedBalance);
        console.log('Formatted balance:', formattedBalance);

        if (balance < entryFeeWei) {
          updateStepStatus('check-balance', 'error', 'Insufficient PYUSD balance');
          addToast({
            type: 'error',
            title: 'Insufficient Balance',
            message: `You have ${formattedBalance} PYUSD, but need ${entryFeeDisplay} PYUSD to play`,
          });
          return;
        }
      } catch (error) {
        console.error('Error checking PYUSD balance:', error);
        updateStepStatus('check-balance', 'error', 'Failed to check balance');
        addToast({
          type: 'error',
          title: 'Balance Check Failed',
          message: `Unable to check PYUSD balance. Please ensure you're connected to Sepolia testnet and the PYUSD contract is correct.`,
        });
        return;
      }

      updateStepStatus('check-balance', 'success');
      setCurrentStep(1);

      // Step 2: Transfer entry fee
      updateStepStatus('transfer', 'loading');

      // Show different messages based on wallet type
      if (walletType === 'external') {
        addToast({
          type: 'info',
          title: 'Confirm Transaction',
          message: 'Please confirm the transaction in your wallet',
        });
      } else {
        addToast({
          type: 'info',
          title: 'Processing Payment',
          message: 'Web3Auth will handle the transaction signing',
        });
      }

      const transferTx = await pyusdContract.transfer(
        ADMIN_ADDRESS,
        entryFeeWei
      );

      addToast({
        type: 'info',
        title: 'Transaction Submitted',
        message: 'Waiting for confirmation on the blockchain...',
      });

      const receipt = await transferTx.wait();
      setTxHash(receipt.hash);

      updateStepStatus('transfer', 'success');

      addToast({
        type: 'success',
        title: 'Payment Successful!',
        message: `Entry fee of ${entryFeeDisplay} PYUSD has been paid`,
      });

      // Call success callback with transaction hash
      onSuccess(receipt.hash, addressToUse);

    } catch (error: any) {
      console.error('Payment error:', error);

      let errorMessage = error.reason || error.message || 'Payment failed';
      let errorTitle = 'Payment Failed';

      // Handle specific error types
      if (error.code === 4001 || error.message?.includes('User rejected')) {
        errorMessage = 'Transaction was rejected by user';
        errorTitle = 'Transaction Rejected';
      } else if (error.code === -32002) {
        errorMessage = 'Please check your wallet for pending requests';
        errorTitle = 'Pending Request';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient ETH for gas fees';
        errorTitle = 'Insufficient Gas';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again';
        errorTitle = 'Network Error';
      }

      updateStepStatus(steps[currentStep].id, 'error', errorMessage);

      addToast({
        type: 'error',
        title: errorTitle,
        message: errorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStepIcon = (status: PaymentStep['status']) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="h-5 w-5" />
            <span>Pay with PYUSD</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Network and Wallet Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${networkCorrect ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm font-medium">Network:</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm">
                  {networkCorrect ? 'Sepolia Testnet' : 'Wrong Network'}
                </span>
                {!networkCorrect && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={switchToSepoliaNetwork}
                    className="text-xs px-2 py-1 h-6"
                  >
                    Switch
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Wallet className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">Wallet Type:</span>
              </div>
              <span className="text-sm capitalize">
                {walletType === 'embedded' ? 'Web3Auth Wallet' :
                 walletType === 'external' ? 'External Wallet' : 'Detecting...'}
              </span>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-blue-700 font-medium">Entry Fee:</span>
              <span className="font-semibold text-blue-900">{entryFeeDisplay} PYUSD</span>
            </div>
            {userBalance !== '0' && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700">Your Balance:</span>
                <span className="text-sm text-blue-800">{parseFloat(userBalance).toFixed(2)} PYUSD</span>
              </div>
            )}
            <div className="mt-3 pt-2 border-t border-blue-200">
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-blue-600">
                  Payment will be sent directly to admin wallet
                </span>
              </div>
            </div>
          </div>

          {/* Payment Steps */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Payment Process</h4>
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getStepIcon(step.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {step.title}
                    </p>
                    {index === currentStep && isProcessing && (
                      <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600">{step.description}</p>
                  {step.error && (
                    <p className="text-xs text-red-600 mt-1">{step.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Transaction Hash */}
          {txHash && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-800 font-medium mb-1">
                Transaction Successful
              </p>
              <p className="text-xs text-green-700 font-mono break-all">
                {txHash}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handlePayment}
              loading={isProcessing}
              disabled={isProcessing || !networkCorrect}
              className="flex-1"
            >
              {isProcessing ? 'Processing...' :
               !networkCorrect ? 'Switch Network First' :
               'Pay & Start Game'}
            </Button>
          </div>

          {/* Network Info */}
          <div className="text-xs text-gray-500 text-center space-y-1">
            <div className="flex items-center justify-center space-x-2">
              <span>Admin Wallet:</span>
              <span className="font-mono">{ADMIN_ADDRESS.slice(0, 6)}...{ADMIN_ADDRESS.slice(-4)}</span>
              <button
                onClick={() => window.open(`https://sepolia.etherscan.io/address/${ADMIN_ADDRESS}`, '_blank')}
                className="text-blue-500 hover:text-blue-600"
              >
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span>PYUSD Contract:</span>
              <span className="font-mono">{PYUSD_ADDRESS.slice(0, 6)}...{PYUSD_ADDRESS.slice(-4)}</span>
              <button
                onClick={() => window.open(`https://sepolia.etherscan.io/address/${PYUSD_ADDRESS}`, '_blank')}
                className="text-blue-500 hover:text-blue-600"
              >
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

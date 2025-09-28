'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { CHAIN_ID, CONTRACT_ENTRY_FEE_CENTS, DEAL_MASTER_ADDRESS, USD_ADDRESS } from "@/lib/config";
import { dealMasterAbi } from "@/lib/deal_master_abi";
import { checkPYUSDApproval, CONTRACT_CONSTANTS } from "@/lib/dealMasterContract";
import { pyusd_abi } from "@/lib/pyusd_abi";
import { formatCurrency } from "@/lib/utils";
import { useWeb3Auth } from "@web3auth/modal/react";
import { ethers } from "ethers";
import {
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Info,
  Loader2,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";

interface ContractPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (txHash: string, walletAddress: string) => void;
}

interface PaymentStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "loading" | "success" | "error";
  error?: string;
}

export function ContractPaymentModal({
  isOpen,
  onClose,
  onSuccess,
}: ContractPaymentModalProps) {
  const { walletAddress, authenticatedFetch } = useAuth();
  const { web3Auth } = useWeb3Auth();
  const { addToast } = useToast();

  const [steps, setSteps] = useState<PaymentStep[]>([
    {
      id: "check-balance",
      title: "Check PYUSD Balance",
      description: "Verifying you have sufficient PYUSD tokens",
      status: "pending",
    },
    {
      id: "check-approval",
      title: "Check PYUSD Approval",
      description: "Checking if contract can spend your PYUSD",
      status: "pending",
    },
    {
      id: "approve-pyusd",
      title: "Approve PYUSD Spending",
      description: "Allow contract to spend PYUSD for game entry",
      status: "pending",
    },
    {
      id: "start-game",
      title: "Start Game",
      description: "Create new game on smart contract",
      status: "pending",
    },
  ]);

  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userBalance, setUserBalance] = useState<string>("0");
  const [approvalNeeded, setApprovalNeeded] = useState(false);
  const [txHash, setTxHash] = useState<string>("");
  const [networkCorrect, setNetworkCorrect] = useState<boolean>(false);

  const entryFeeDisplay = formatCurrency(CONTRACT_ENTRY_FEE_CENTS);

  const updateStepStatus = (
    stepId: string,
    status: PaymentStep["status"],
    error?: string
  ) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === stepId ? { ...step, status, error } : step
      )
    );
  };

  // Check network on modal open
  useEffect(() => {
    if (isOpen && web3Auth) {
      checkNetwork();
    }
  }, [isOpen, web3Auth]);

  const checkNetwork = async () => {
    try {
      if (!web3Auth?.provider) {
        setNetworkCorrect(false);
        return;
      }

      const provider = new ethers.BrowserProvider(web3Auth.provider);
      const network = await provider.getNetwork();
      const isCorrectNetwork = network.chainId === BigInt(CHAIN_ID);
      setNetworkCorrect(isCorrectNetwork);

      if (!isCorrectNetwork) {
        addToast({
          type: "error",
          title: "Wrong Network",
          message: `Please switch to the correct network (Chain ID: ${CHAIN_ID})`,
        });
      }
    } catch (error) {
      console.error("Error checking network:", error);
      setNetworkCorrect(false);
    }
  };

  const switchToCorrectNetwork = async () => {
    try {
      if (!web3Auth?.provider) {
        addToast({
          type: "error",
          title: "Network Switch Failed",
          message: "Web3Auth provider not available",
        });
        return;
      }

      const provider = new ethers.BrowserProvider(web3Auth.provider);
      const chainIdHex = `0x${CHAIN_ID.toString(16)}`;

      const getNetworkConfig = (chainId: number) => {
        switch (chainId) {
          case 545:
            return {
              chainId: chainIdHex,
              chainName: "Flow EVM Testnet",
              rpcUrls: ["https://testnet.evm.nodes.onflow.org"],
              nativeCurrency: { name: "Flow", symbol: "FLOW", decimals: 18 },
              blockExplorerUrls: ["https://evm-testnet.flowscan.io/"],
            };
          case 11155111:
            return {
              chainId: chainIdHex,
              chainName: "Ethereum Sepolia",
              rpcUrls: ["https://sepolia.infura.io/v3/"],
              nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
              blockExplorerUrls: ["https://sepolia.etherscan.io/"],
            };
          default:
            return {
              chainId: chainIdHex,
              chainName: `Network ${chainId}`,
              rpcUrls: [""],
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
              blockExplorerUrls: [""],
            };
        }
      };

      const networkConfig = getNetworkConfig(CHAIN_ID);

      try {
        await provider.send("wallet_switchEthereumChain", [{ chainId: chainIdHex }]);
        await checkNetwork();
        addToast({
          type: "success",
          title: "Network Switched",
          message: `Successfully switched to ${networkConfig.chainName}`,
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await provider.send("wallet_addEthereumChain", [networkConfig]);
          await checkNetwork();
        } else {
          throw switchError;
        }
      }
    } catch (error: any) {
      console.error("Error switching network:", error);
      addToast({
        type: "error",
        title: "Network Switch Failed",
        message: `Please manually switch to the correct network (Chain ID: ${CHAIN_ID})`,
      });
    }
  };

  const handlePayment = async () => {
    if (!walletAddress) {
      addToast({
        type: "error",
        title: "Wallet Not Connected",
        message: "Please connect your wallet first",
      });
      return;
    }

    if (!networkCorrect) {
      addToast({
        type: "error",
        title: "Wrong Network",
        message: `Please switch to the correct network (Chain ID: ${CHAIN_ID})`,
      });
      return;
    }

    setIsProcessing(true);
    setCurrentStep(0);

    // Reset steps status
    setSteps((prev) =>
      prev.map((step) => ({ ...step, status: "pending", error: undefined }))
    );

    try {
      if (!web3Auth?.provider) {
        throw new Error("Web3Auth provider not available");
      }

      const provider = new ethers.BrowserProvider(web3Auth.provider);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      const addressToUse = walletAddress || signerAddress;

      // Step 1: Check PYUSD balance
      updateStepStatus("check-balance", "loading");
      setCurrentStep(0);

      const pyusdContract = new ethers.Contract(USD_ADDRESS, pyusd_abi, signer);
      const balance = await pyusdContract.balanceOf(addressToUse);
      const decimals = await pyusdContract.decimals();
      const formattedBalance = ethers.formatUnits(balance, decimals);
      setUserBalance(formattedBalance);

      const requiredAmount = BigInt(CONTRACT_CONSTANTS.ENTRY_FEE);
      if (balance < requiredAmount) {
        updateStepStatus("check-balance", "error", "Insufficient PYUSD balance");
        addToast({
          type: "error",
          title: "Insufficient Balance",
          message: `You have ${formattedBalance} PYUSD, but need ${entryFeeDisplay} PYUSD to play`,
        });
        return;
      }

      updateStepStatus("check-balance", "success");
      setCurrentStep(1);

      // Step 2: Check PYUSD approval
      updateStepStatus("check-approval", "loading");

      const approvalStatus = await checkPYUSDApproval(addressToUse, web3Auth.provider);
      setApprovalNeeded(!approvalStatus.approved);

      if (approvalStatus.approved) {
        updateStepStatus("check-approval", "success");
        updateStepStatus("approve-pyusd", "success");
        setCurrentStep(3);
      } else {
        updateStepStatus("check-approval", "success");
        setCurrentStep(2);

        // Step 3: Approve PYUSD spending
        updateStepStatus("approve-pyusd", "loading");

        addToast({
          type: "info",
          title: "Approval Required",
          message: "Please approve PYUSD spending in your wallet",
        });

        const approveTx = await pyusdContract.approve(
          DEAL_MASTER_ADDRESS,
          requiredAmount
        );

        addToast({
          type: "info",
          title: "Approval Submitted",
          message: "Waiting for approval confirmation...",
        });

        await approveTx.wait();
        updateStepStatus("approve-pyusd", "success");
        setCurrentStep(3);
      }

      // Step 4: Start game on smart contract
      updateStepStatus("start-game", "loading");

      const dealMasterContract = new ethers.Contract(
        DEAL_MASTER_ADDRESS,
        dealMasterAbi,
        signer
      );

      addToast({
        type: "info",
        title: "Starting Game",
        message: "Please confirm the game creation transaction",
      });

      const startGameTx = await dealMasterContract.startGame();

      addToast({
        type: "info",
        title: "Transaction Submitted",
        message: "Waiting for game creation confirmation...",
      });

      const receipt = await startGameTx.wait();
      setTxHash(receipt.hash);

      updateStepStatus("start-game", "success");

      addToast({
        type: "success",
        title: "Game Created Successfully!",
        message: `Your game has been created on the smart contract`,
      });

      // Call success callback with transaction hash
      onSuccess(receipt.hash, addressToUse);
    } catch (error: any) {
      console.error("Contract payment error:", error);

      let errorMessage = error.reason || error.message || "Payment failed";
      let errorTitle = "Payment Failed";

      if (error.code === 4001 || error.message?.includes("User rejected")) {
        errorMessage = "Transaction was rejected by user";
        errorTitle = "Transaction Rejected";
      } else if (error.code === -32002) {
        errorMessage = "Please check your wallet for pending requests";
        errorTitle = "Pending Request";
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient ETH for gas fees";
        errorTitle = "Insufficient Gas";
      }

      updateStepStatus(steps[currentStep].id, "error", errorMessage);

      addToast({
        type: "error",
        title: errorTitle,
        message: errorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStepIcon = (status: PaymentStep["status"]) => {
    switch (status) {
      case "loading":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
    >
      <div className="crt-overlay" />
      <Card
        variant="pixel"
        className="w-full max-w-lg mx-auto animate-text-flicker relative z-10"
        style={{
          backgroundColor: "rgba(28, 0, 51, 0.95)",
          backdropFilter: "blur(10px)",
        }}
      >
        <CardHeader
          className="text-center border-b-4 pb-4"
          style={{ borderBottomColor: "rgb(0, 255, 255)" }}
        >
          <CardTitle
            className="flex items-center justify-center space-x-3 font-pixel text-lg animate-text-flicker"
            style={{ color: "rgb(0, 255, 255)" }}
          >
            <Wallet className="h-6 w-6" />
            <span>🎮 SMART CONTRACT GAME</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {/* Network Status */}
          <div className="space-y-4">
            <h3
              className="font-pixel text-sm mb-3"
              style={{ color: "rgb(255, 0, 255)" }}
            >
              🌐 NETWORK STATUS
            </h3>

            <div
              className="flex items-center justify-between p-4 border-4 animate-text-flicker"
              style={{
                backgroundColor: networkCorrect
                  ? "rgba(0, 255, 0, 0.1)"
                  : "rgba(255, 0, 0, 0.1)",
                borderColor: networkCorrect
                  ? "rgb(0, 255, 0)"
                  : "rgb(255, 0, 0)",
              }}
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-3 h-3 rounded-full animate-text-flicker"
                  style={{
                    backgroundColor: networkCorrect
                      ? "rgb(0, 255, 0)"
                      : "rgb(255, 0, 0)",
                  }}
                />
                <span
                  className="text-sm font-pixel"
                  style={{
                    color: networkCorrect ? "rgb(0, 255, 0)" : "rgb(255, 0, 0)",
                  }}
                >
                  Network:
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <span
                  className="text-sm font-pixel"
                  style={{ color: "rgb(255, 255, 255)" }}
                >
                  {networkCorrect
                    ? CHAIN_ID === 545
                      ? "Flow EVM Testnet"
                      : CHAIN_ID === 11155111
                        ? "Sepolia Testnet"
                        : `Network ${CHAIN_ID}`
                    : "Wrong Network"}
                </span>
                {!networkCorrect && (
                  <Button
                    variant="magenta"
                    size="sm"
                    onClick={switchToCorrectNetwork}
                    className="text-xs px-3 py-1 h-7 font-pixel"
                  >
                    SWITCH
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="space-y-4">
            <h3
              className="font-pixel text-sm"
              style={{ color: "rgb(255, 0, 255)" }}
            >
              💰 GAME DETAILS
            </h3>

            <div
              className="border-4 p-5 animate-text-flicker"
              style={{
                backgroundColor: "rgba(255, 255, 0, 0.1)",
                borderColor: "rgb(255, 255, 0)",
              }}
            >
              <div className="flex justify-between items-center mb-4">
                <span
                  className="text-sm font-pixel"
                  style={{ color: "rgb(255, 255, 0)" }}
                >
                  💵 Entry Fee:
                </span>
                <span
                  className="font-pixel text-lg"
                  style={{ color: "rgb(255, 255, 255)" }}
                >
                  {entryFeeDisplay} PYUSD
                </span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span
                  className="text-sm font-pixel"
                  style={{ color: "rgb(255, 255, 0)" }}
                >
                  📦 Boxes:
                </span>
                <span
                  className="font-pixel text-lg"
                  style={{ color: "rgb(255, 255, 255)" }}
                >
                  8 Boxes
                </span>
              </div>
              {userBalance !== "0" && (
                <div className="flex justify-between items-center mb-4">
                  <span
                    className="text-sm font-pixel"
                    style={{ color: "rgb(255, 255, 0)" }}
                  >
                    💳 Your Balance:
                  </span>
                  <span
                    className="text-sm font-pixel"
                    style={{ color: "rgb(255, 255, 255)" }}
                  >
                    {parseFloat(userBalance).toFixed(2)} PYUSD
                  </span>
                </div>
              )}
              <div
                className="mt-4 pt-3 border-t-4"
                style={{ borderTopColor: "rgb(255, 255, 0)" }}
              >
                <div className="flex items-start space-x-3">
                  <Info
                    className="w-5 h-5 mt-0.5"
                    style={{ color: "rgb(255, 255, 0)" }}
                  />
                  <span
                    className="text-sm font-pixel leading-relaxed"
                    style={{ color: "rgb(255, 255, 0)" }}
                  >
                    Game runs entirely on smart contract - fully decentralized!
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Steps */}
          <div className="space-y-4">
            <h3
              className="font-pixel text-sm"
              style={{ color: "rgb(255, 0, 255)" }}
            >
              ⚡ SETUP PROCESS
            </h3>
            <div className="space-y-4">
              {steps.map((step, index) => {
                // Skip approval step if not needed
                if (step.id === "approve-pyusd" && !approvalNeeded && step.status === "pending") {
                  return null;
                }

                return (
                  <div
                    key={step.id}
                    className={`flex items-start space-x-4 p-3 border-2 ${
                      step.status === "loading" ? "animate-text-flicker" : ""
                    }`}
                    style={{
                      backgroundColor:
                        step.status === "success"
                          ? "rgba(0, 255, 0, 0.1)"
                          : step.status === "error"
                            ? "rgba(255, 0, 0, 0.1)"
                            : step.status === "loading"
                              ? "rgba(0, 255, 255, 0.1)"
                              : "rgba(255, 255, 255, 0.05)",
                      borderColor:
                        step.status === "success"
                          ? "rgb(0, 255, 0)"
                          : step.status === "error"
                            ? "rgb(255, 0, 0)"
                            : step.status === "loading"
                              ? "rgb(0, 255, 255)"
                              : "rgba(255, 255, 255, 0.3)",
                    }}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getStepIcon(step.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p
                          className="text-sm font-pixel"
                          style={{
                            color:
                              step.status === "success"
                                ? "rgb(0, 255, 0)"
                                : step.status === "error"
                                  ? "rgb(255, 0, 0)"
                                  : "rgb(0, 255, 255)",
                          }}
                        >
                          {step.title}
                        </p>
                        {index === currentStep && isProcessing && (
                          <Loader2
                            className="h-4 w-4 animate-spin"
                            style={{ color: "rgb(0, 255, 255)" }}
                          />
                        )}
                      </div>
                      <p
                        className="text-sm font-pixel leading-relaxed"
                        style={{ color: "rgb(255, 255, 255)" }}
                      >
                        {step.description}
                      </p>
                      {step.error && (
                        <p
                          className="text-sm font-pixel mt-2 p-2 border-2 animate-text-flicker"
                          style={{
                            color: "rgb(255, 0, 0)",
                            backgroundColor: "rgba(255, 0, 0, 0.1)",
                            borderColor: "rgb(255, 0, 0)"
                          }}
                        >
                          ❌ {step.error}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transaction Hash */}
          {txHash && (
            <div className="space-y-3">
              <h3
                className="font-pixel text-sm"
                style={{ color: "rgb(255, 0, 255)" }}
              >
                ✅ GAME CREATED
              </h3>
              <div
                className="border-4 p-4 animate-text-flicker"
                style={{
                  backgroundColor: "rgba(0, 255, 0, 0.1)",
                  borderColor: "rgb(0, 255, 0)",
                }}
              >
                <p
                  className="text-sm font-pixel mb-3"
                  style={{ color: "rgb(0, 255, 0)" }}
                >
                  🎉 Smart Contract Game Created Successfully!
                </p>
                <p
                  className="text-xs font-pixel break-all p-2 border-2"
                  style={{
                    color: "rgb(255, 255, 255)",
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                    borderColor: "rgba(0, 255, 0, 0.5)",
                  }}
                >
                  {txHash}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 font-pixel"
            >
              CANCEL
            </Button>
            <Button
              variant="cyan"
              onClick={handlePayment}
              loading={isProcessing}
              disabled={isProcessing || !networkCorrect}
              className="flex-1 font-pixel"
            >
              {isProcessing
                ? "PROCESSING..."
                : !networkCorrect
                  ? "SWITCH NETWORK FIRST"
                  : "CREATE SMART CONTRACT GAME"}
            </Button>
          </div>

          {/* Contract Info */}
          <div
            className="space-y-3 pt-4 border-t-2"
            style={{ borderTopColor: "rgba(0, 255, 255, 0.3)" }}
          >
            <h3
              className="font-pixel text-sm text-center"
              style={{ color: "rgb(255, 0, 255)" }}
            >
              🔗 CONTRACT INFO
            </h3>
            <div className="space-y-3">
              <div
                className="flex items-center justify-between p-3 border-2"
                style={{
                  backgroundColor: "rgba(0, 255, 255, 0.05)",
                  borderColor: "rgba(0, 255, 255, 0.3)",
                }}
              >
                <span
                  className="text-sm font-pixel"
                  style={{ color: "rgba(0, 255, 255, 0.8)" }}
                >
                  🎮 Game Contract:
                </span>
                <div className="flex items-center space-x-2">
                  <span
                    className="font-pixel text-sm"
                    style={{ color: "rgb(255, 255, 255)" }}
                  >
                    {DEAL_MASTER_ADDRESS.slice(0, 6)}...{DEAL_MASTER_ADDRESS.slice(-4)}
                  </span>
                  <button
                    onClick={() => {
                      const explorerUrl =
                        CHAIN_ID === 545
                          ? `https://evm-testnet.flowscan.io/address/${DEAL_MASTER_ADDRESS}`
                          : CHAIN_ID === 11155111
                            ? `https://sepolia.etherscan.io/address/${DEAL_MASTER_ADDRESS}`
                            : `#`;
                      window.open(explorerUrl, "_blank");
                    }}
                    className="hover:opacity-80 transition-opacity"
                    style={{ color: "rgb(0, 255, 255)" }}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

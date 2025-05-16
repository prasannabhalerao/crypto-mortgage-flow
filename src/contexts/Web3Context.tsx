
import React, { createContext, useState, useContext, useEffect } from "react";
import { ethers } from "ethers";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";

interface Web3ContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  account: string | null;
  chainId: number | null;
  connectWallet: () => Promise<void>;
  disconnect: () => void;
  isConnected: boolean;
  simpleMintToken: (propertyId: string, value: number, toAddress: string) => Promise<string>;
  simpleRepayLoan: (loanId: string, amount: number) => Promise<boolean>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const { updateUserAddress } = useAuth();

  // Check if MetaMask is installed
  const checkIfWalletIsConnected = async () => {
    if (!window.ethereum) {
      toast.error("Please install MetaMask to use this application");
      return false;
    }
    return true;
  };

  // Connect wallet function
  const connectWallet = async () => {
    try {
      const isMetaMaskInstalled = await checkIfWalletIsConnected();
      if (!isMetaMaskInstalled) return;

      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      
      if (accounts.length > 0) {
        const newSigner = await browserProvider.getSigner();
        const network = await browserProvider.getNetwork();
        
        setProvider(browserProvider);
        setSigner(newSigner);
        setAccount(accounts[0]);
        setChainId(Number(network.chainId));
        
        // Update user's wallet address in auth context
        updateUserAddress(accounts[0]);
        
        toast.success("Wallet connected successfully!");
        
        // Log connection details for debugging
        console.log("Connected to account:", accounts[0]);
        console.log("Chain ID:", Number(network.chainId));
        console.log("Network name:", network.name);
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error("Failed to connect wallet.");
    }
  };

  const disconnect = () => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    // Update user's wallet address in auth context
    updateUserAddress("");
    toast.info("Wallet disconnected");
  };

  // Simplified minting function that doesn't rely on complex contract interactions
  const simpleMintToken = async (propertyId: string, value: number, toAddress: string): Promise<string> => {
    try {
      if (!signer) {
        throw new Error("No wallet connected");
      }
      
      console.log(`Starting simplified minting for property ${propertyId}`);
      
      // Simple transaction to confirm wallet is working
      // This will open MetaMask for user confirmation
      const tx = await signer.sendTransaction({
        to: toAddress,
        value: ethers.parseUnits("0", "ether") // Zero ETH transfer just to trigger MetaMask
      });
      
      console.log("Transaction sent:", tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);
      
      // Generate a unique token ID based on timestamp and property ID
      // In a real application, this would come from your actual contract
      const tokenId = `${Date.now()}-${propertyId}`;
      
      console.log("Generated token ID:", tokenId);
      toast.success("Property tokenized successfully!");
      
      return tokenId;
    } catch (error) {
      console.error("Error in simplified minting:", error);
      let errorMessage = "Property tokenization failed";
      
      if (error instanceof Error) {
        errorMessage = `Property tokenization failed - ${error.message}`;
      }
      
      throw new Error(errorMessage);
    }
  };

  // Simplified loan repayment function
  const simpleRepayLoan = async (loanId: string, amount: number): Promise<boolean> => {
    try {
      if (!signer) {
        throw new Error("No wallet connected");
      }
      
      console.log(`Starting simplified loan repayment for loan ${loanId}`);
      console.log(`Repayment amount: ${amount}`);
      
      // Get the sender address
      const fromAddress = await signer.getAddress();
      
      // Generate a recipient address (this would be the loan contract in a real application)
      const toAddress = "0x000000000000000000000000000000000000dEaD"; // Burn address as placeholder
      
      // Calculate the ETH value (simulating the payment amount)
      // In a real app, this would be the actual payment amount converted to ETH
      // Here we use a small amount just to trigger MetaMask
      const ethValue = "0.00001"; // Very small amount for testing
      
      console.log(`Sending transaction from ${fromAddress} to ${toAddress}`);
      console.log(`Transaction value: ${ethValue} ETH`);
      
      // Create and send the transaction
      const tx = await signer.sendTransaction({
        to: toAddress,
        value: ethers.parseUnits(ethValue, "ether")
      });
      
      console.log("Transaction sent:", tx.hash);
      
      // Wait for the transaction to be confirmed
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);
      
      // Update the loan payments in localStorage to track this payment
      updateLoanPaymentInLocalStorage(loanId, amount);
      
      toast.success("Loan payment successful!");
      return true;
    } catch (error) {
      console.error("Error in loan repayment:", error);
      let errorMessage = "Payment failed";
      
      if (error instanceof Error) {
        errorMessage = `Payment failed - ${error.message}`;
      }
      
      throw new Error(errorMessage);
    }
  };
  
  // Helper function to update loan payment in localStorage
  const updateLoanPaymentInLocalStorage = (loanId: string, amount: number) => {
    try {
      // Get existing loan payments
      const paymentsJSON = localStorage.getItem('loanPayments');
      const payments = paymentsJSON ? JSON.parse(paymentsJSON) : {};
      
      // Get existing payment history for this loan
      const loanPayments = payments[loanId] || [];
      
      // Add new payment
      loanPayments.push({
        date: new Date().toISOString(),
        amount: amount
      });
      
      // Update for this loan
      payments[loanId] = loanPayments;
      
      // Save back to localStorage
      localStorage.setItem('loanPayments', JSON.stringify(payments));
      
      console.log(`Payment of ${amount} recorded for loan ${loanId}`);
    } catch (error) {
      console.error("Error updating loan payment in localStorage:", error);
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          updateUserAddress(accounts[0]);
        } else {
          disconnect();
        }
      });

      window.ethereum.on("chainChanged", (newChainId: string) => {
        setChainId(parseInt(newChainId, 16));
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged");
        window.ethereum.removeAllListeners("chainChanged");
      }
    };
  }, []);

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        account,
        chainId,
        connectWallet,
        disconnect,
        isConnected: !!account,
        simpleMintToken,
        simpleRepayLoan
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
};

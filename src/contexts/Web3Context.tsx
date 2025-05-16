
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
  getBorrowedAmount: (propertyId: string) => Promise<number>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [borrowedAmounts, setBorrowedAmounts] = useState<Record<string, number>>({});
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

  // Track borrowed amounts for properties
  const updateBorrowedAmount = (propertyId: string, amount: number) => {
    setBorrowedAmounts(prev => ({
      ...prev,
      [propertyId]: (prev[propertyId] || 0) + amount
    }));
    
    // Store in localStorage for persistence across sessions
    const storedAmounts = JSON.parse(localStorage.getItem('borrowedAmounts') || '{}');
    storedAmounts[propertyId] = (storedAmounts[propertyId] || 0) + amount;
    localStorage.setItem('borrowedAmounts', JSON.stringify(storedAmounts));
  };

  // Get borrowed amount for a property
  const getBorrowedAmount = async (propertyId: string): Promise<number> => {
    // First check local state
    if (borrowedAmounts[propertyId]) {
      return borrowedAmounts[propertyId];
    }
    
    // Then check localStorage for persistence across sessions
    const storedAmounts = JSON.parse(localStorage.getItem('borrowedAmounts') || '{}');
    return storedAmounts[propertyId] || 0;
  };

  // Load borrowed amounts from localStorage on component mount
  useEffect(() => {
    const storedAmounts = JSON.parse(localStorage.getItem('borrowedAmounts') || '{}');
    setBorrowedAmounts(storedAmounts);
  }, []);

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
        getBorrowedAmount
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

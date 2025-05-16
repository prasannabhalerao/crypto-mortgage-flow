
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

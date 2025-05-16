import { ethers } from "ethers";
import PropertyTokenAbi from "../contracts/PropertyToken.json";
import LoanContractAbi from "../contracts/LoanContract.json";
import { toast } from "sonner";

// Mock contract addresses (in a real app, these would come from environment variables)
const PROPERTY_TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const LOAN_CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

// Create contract instances
export const getPropertyTokenContract = async (signer: ethers.JsonRpcSigner) => {
  try {
    return new ethers.Contract(
      PROPERTY_TOKEN_ADDRESS,
      PropertyTokenAbi.abi,
      signer
    );
  } catch (error) {
    console.error("Error getting property token contract:", error);
    throw new Error("Failed to connect to property token contract");
  }
};

export const getLoanContract = async (signer: ethers.JsonRpcSigner) => {
  try {
    return new ethers.Contract(
      LOAN_CONTRACT_ADDRESS,
      LoanContractAbi.abi,
      signer
    );
  } catch (error) {
    console.error("Error getting loan contract:", error);
    throw new Error("Failed to connect to loan contract");
  }
};

// Mint a property token
export const mintPropertyToken = async (
  signer: ethers.JsonRpcSigner,
  to: string,
  propertyId: string,
  propertyValue: number
) => {
  try {
    console.log("Starting property token minting process...");
    console.log("To address:", to);
    console.log("Property ID:", propertyId);
    console.log("Property Value:", propertyValue);
    
    const contract = await getPropertyTokenContract(signer);
    
    // Convert property value to wei (assuming the value is in USD)
    const valueInWei = ethers.parseUnits(propertyValue.toString(), 18);
    console.log("Value in Wei:", valueInWei.toString());
    
    // Check signer address
    const signerAddress = await signer.getAddress();
    console.log("Signer address:", signerAddress);
    
    // Check contract connection
    try {
      const name = await contract.name();
      console.log("Contract name:", name);
    } catch (e) {
      console.error("Error calling contract name:", e);
      throw new Error("Cannot connect to property token contract. Please check your network connection and contract address.");
    }
    
    console.log("Calling mintPropertyToken...");
    const tx = await contract.mintPropertyToken(to, propertyId, valueInWei);
    console.log("Transaction hash:", tx.hash);
    
    console.log("Waiting for transaction confirmation...");
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt);
    
    // Improved event parsing logic
    console.log("Parsing transaction logs...");
    
    // First, try to find the event directly
    let tokenId = null;
    
    // Method 1: Try direct event parsing
    try {
      const event = receipt.logs
        .map((log: any) => {
          try {
            return contract.interface.parseLog({
              topics: log.topics,
              data: log.data
            });
          } catch (e) {
            return null;
          }
        })
        .filter(Boolean)
        .find((event: any) => event.name === "PropertyTokenized");
        
      if (event) {
        console.log("Found PropertyTokenized event:", event);
        tokenId = event.args.tokenId.toString();
        console.log("Token ID from event:", tokenId);
      }
    } catch (error) {
      console.error("Error in direct event parsing:", error);
    }
    
    // Method 2: If event parsing failed, try alternative approach - get token balance and latest token
    if (!tokenId) {
      console.log("Direct event parsing failed, trying alternative method...");
      try {
        const balance = await contract.balanceOf(to);
        console.log("Current token balance:", balance.toString());
        
        if (balance > 0) {
          // Get the latest token ID owned by this address
          const index = balance - 1n;
          tokenId = await contract.tokenOfOwnerByIndex(to, index);
          console.log("Latest token ID from balance:", tokenId.toString());
          
          // Verify this token has the right property ID
          const propertyInfo = await contract.getTokenProperty(tokenId);
          console.log("Property info for token:", propertyInfo);
          
          if (propertyInfo && propertyInfo.propertyId === propertyId) {
            console.log("Token confirmed to match property ID:", propertyId);
            tokenId = tokenId.toString();
          } else {
            console.warn("Latest token doesn't match property ID, searching all tokens...");
            
            // If the latest token doesn't match, search through all tokens
            for (let i = 0; i < balance; i++) {
              const curTokenId = await contract.tokenOfOwnerByIndex(to, i);
              const curPropertyInfo = await contract.getTokenProperty(curTokenId);
              
              if (curPropertyInfo && curPropertyInfo.propertyId === propertyId) {
                tokenId = curTokenId.toString();
                console.log("Found matching token ID:", tokenId);
                break;
              }
            }
          }
        }
      } catch (error) {
        console.error("Error in alternative token ID retrieval:", error);
      }
    }
    
    // Method 3: Last resort - check for Transfer events
    if (!tokenId) {
      console.log("Trying to find Transfer event...");
      try {
        const transferEvent = receipt.logs
          .map((log: any) => {
            try {
              return contract.interface.parseLog({
                topics: log.topics,
                data: log.data
              });
            } catch (e) {
              return null;
            }
          })
          .filter(Boolean)
          .find((event: any) => event.name === "Transfer" && event.args.to.toLowerCase() === to.toLowerCase());
          
        if (transferEvent) {
          console.log("Found Transfer event:", transferEvent);
          tokenId = transferEvent.args.tokenId.toString();
          console.log("Token ID from Transfer event:", tokenId);
        }
      } catch (error) {
        console.error("Error parsing Transfer events:", error);
      }
    }
    
    // If still no token ID, check raw logs and topics
    if (!tokenId) {
      console.log("Analyzing raw logs as last resort...");
      console.log("Raw logs:", JSON.stringify(receipt.logs, null, 2));
      
      // Manually try to extract token ID from raw logs
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() === PROPERTY_TOKEN_ADDRESS.toLowerCase()) {
          console.log("Found log from token contract:", log);
          // Assuming the token ID might be in the last topic for Transfer events (common ERC721 pattern)
          if (log.topics.length >= 4) {
            const potentialTokenId = ethers.toBigInt(log.topics[3]);
            console.log("Potential token ID from raw topic:", potentialTokenId.toString());
            tokenId = potentialTokenId.toString();
            break;
          }
        }
      }
    }
    
    if (!tokenId) {
      throw new Error("Could not determine token ID from transaction receipt. Please check the contract events or try again.");
    }
    
    console.log("Final token ID:", tokenId);
    return tokenId;
    
  } catch (error) {
    console.error("Error minting property token:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    throw error;
  }
};

// Function to update property loan tracking
export const trackPropertyLoanInLocalStorage = (propertyId: string, amount: number) => {
  try {
    // Get existing property loans
    const propertyLoansJSON = localStorage.getItem('propertyLoans');
    const propertyLoans = propertyLoansJSON ? JSON.parse(propertyLoansJSON) : {};
    
    // Update for this property
    propertyLoans[propertyId] = (propertyLoans[propertyId] || 0) + amount;
    
    // Save back to localStorage
    localStorage.setItem('propertyLoans', JSON.stringify(propertyLoans));
    
    console.log(`Updated loan amount for property ${propertyId}: ${propertyLoans[propertyId]}`);
    return true;
  } catch (error) {
    console.error("Error updating property loan tracking:", error);
    return false;
  }
};

// Create a loan
export const createLoan = async (
  signer: ethers.JsonRpcSigner,
  tokenId: string,
  amount: number,
  term: number,
  interestRate: number,
  collateralAmount: number
) => {
  try {
    console.log("Creating loan with the following parameters:");
    console.log("Token ID:", tokenId);
    console.log("Loan Amount:", amount);
    console.log("Term:", term);
    console.log("Interest Rate:", interestRate);
    console.log("Collateral Amount:", collateralAmount);
    
    const contract = await getLoanContract(signer);
    
    // Convert amounts to wei
    const loanAmountInWei = ethers.parseUnits(amount.toString(), 18);
    const collateralInWei = ethers.parseUnits(collateralAmount.toString(), 18);
    
    // Multiply interest rate by 100 for the contract (e.g., 3.5% becomes 350)
    const interestRateForContract = Math.floor(interestRate * 100);
    
    console.log("Loan amount in Wei:", loanAmountInWei.toString());
    console.log("Collateral in Wei:", collateralInWei.toString());
    console.log("Interest rate for contract:", interestRateForContract);
    
    // First make sure the token is approved for the loan contract
    const propertyContract = await getPropertyTokenContract(signer);
    const isApproved = await propertyContract.getApproved(tokenId);
    console.log("Current approval for token:", isApproved);
    
    if (isApproved.toLowerCase() !== LOAN_CONTRACT_ADDRESS.toLowerCase()) {
      console.log("Approving token for loan contract...");
      const approveTx = await propertyContract.approve(LOAN_CONTRACT_ADDRESS, tokenId);
      console.log("Approval transaction hash:", approveTx.hash);
      await approveTx.wait();
      console.log("Token approved for loan contract");
    }
    
    const tx = await contract.createLoan(
      tokenId,
      loanAmountInWei,
      term,
      interestRateForContract,
      { value: collateralInWei }
    );
    
    console.log("Transaction hash:", tx.hash);
    console.log("Waiting for transaction confirmation...");
    
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt);
    
    // Improved event parsing for loan creation
    let loanId = null;
    
    // Try direct event parsing
    try {
      const event = receipt.logs
        .map((log: any) => {
          try {
            return contract.interface.parseLog({
              topics: log.topics,
              data: log.data
            });
          } catch (e) {
            console.error("Error parsing log:", e);
            return null;
          }
        })
        .filter(Boolean)
        .find((event: any) => event.name === "LoanCreated");

      if (event) {
        console.log("Found LoanCreated event:", event);
        loanId = event.args.loanId.toString();
        console.log("Loan ID from event:", loanId);
      }
    } catch (error) {
      console.error("Error in direct event parsing:", error);
    }
    
    // If event parsing failed, try to get latest loan
    if (!loanId) {
      console.log("Direct event parsing failed, trying alternative method...");
      try {
        const borrowerAddress = await signer.getAddress();
        const loans = await contract.getLoansByBorrower(borrowerAddress);
        
        if (loans && loans.length > 0) {
          // Get the latest loan ID
          loanId = loans[loans.length - 1].toString();
          console.log("Latest loan ID:", loanId);
        }
      } catch (error) {
        console.error("Error getting loans by borrower:", error);
      }
    }
    
    if (!loanId) {
      throw new Error("Could not determine loan ID from transaction receipt. Please check your loans dashboard.");
    }
    
    return loanId;
  } catch (error) {
    console.error("Error creating loan:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    throw error;
  }
};

// Repay a loan
export const repayLoan = async (
  signer: ethers.JsonRpcSigner,
  loanId: string,
  amount: number
) => {
  try {
    console.log("Repaying loan:", loanId);
    console.log("Repayment amount:", amount);
    
    const contract = await getLoanContract(signer);
    
    // Convert amount to wei
    const amountInWei = ethers.parseUnits(amount.toString(), 18);
    console.log("Amount in Wei:", amountInWei.toString());
    
    const tx = await contract.repayLoan(loanId, { value: amountInWei });
    console.log("Transaction hash:", tx.hash);
    console.log("Waiting for transaction confirmation...");
    
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt);
    
    return receipt;
  } catch (error) {
    console.error("Error repaying loan:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    throw error;
  }
};

// Get loans by borrower
export const getLoansByBorrower = async (
  provider: ethers.BrowserProvider,
  borrower: string
) => {
  try {
    console.log("Getting loans for borrower:", borrower);
    
    const contract = new ethers.Contract(
      LOAN_CONTRACT_ADDRESS,
      LoanContractAbi.abi,
      provider
    );
    
    const loanIds = await contract.getLoansByBorrower(borrower);
    console.log("Loan IDs:", loanIds);
    
    const loans = await Promise.all(
      loanIds.map(async (id: number) => {
        console.log("Fetching details for loan ID:", id);
        const loan = await contract.getLoan(id);
        console.log("Loan data:", loan);
        
        return {
          id: id.toString(),
          borrower: loan.borrower,
          tokenId: loan.tokenId.toString(),
          amount: ethers.formatUnits(loan.amount, 18),
          term: loan.term.toString(),
          interestRate: (Number(loan.interestRate) / 100).toString(),
          startTime: new Date(Number(loan.startTime) * 1000),
          collateralAmount: ethers.formatUnits(loan.collateralAmount, 18),
          active: loan.active,
          repaid: loan.repaid
        };
      })
    );
    
    console.log("Processed loans:", loans);
    return loans;
  } catch (error) {
    console.error("Error getting loans by borrower:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    throw error;
  }
};

// Get tokenized properties for a user
export const getTokenizedProperties = async (
  provider: ethers.BrowserProvider,
  userAddress: string
) => {
  try {
    console.log("Getting tokenized properties for user:", userAddress);
    
    const contract = new ethers.Contract(
      PROPERTY_TOKEN_ADDRESS,
      PropertyTokenAbi.abi,
      provider
    );
    
    // Get token balance
    const balance = await contract.balanceOf(userAddress);
    console.log("User token balance:", balance);
    
    const tokenIds = [];
    
    // Fetch all tokens owned by the user
    for (let i = 0; i < balance; i++) {
      const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i);
      tokenIds.push(tokenId);
    }
    
    console.log("User's token IDs:", tokenIds);
    
    // Get details for each token
    const properties = await Promise.all(
      tokenIds.map(async (tokenId) => {
        const tokenProperty = await contract.getTokenProperty(tokenId);
        console.log("Token property data:", tokenProperty);
        
        return {
          tokenId: tokenId.toString(),
          propertyId: tokenProperty.propertyId,
          value: ethers.formatUnits(tokenProperty.value, 18)
        };
      })
    );
    
    console.log("Processed properties:", properties);
    return properties;
  } catch (error) {
    console.error("Error getting tokenized properties:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return [];
  }
};

// Add a utility function to check network connection
export const checkNetworkConnection = async (provider: ethers.BrowserProvider) => {
  try {
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    
    console.log("Connected to chain ID:", chainId);
    
    // For local development (Ganache default)
    const isLocalDev = chainId === 1337 || chainId === 31337;
    
    if (!isLocalDev) {
      console.warn("Not connected to local development network!");
      return {
        connected: true,
        isLocalDev: false,
        chainId,
        networkName: network.name
      };
    }
    
    return {
      connected: true,
      isLocalDev: true,
      chainId,
      networkName: "Local Development"
    };
  } catch (error) {
    console.error("Error checking network connection:", error);
    return {
      connected: false,
      error: "Cannot connect to blockchain network"
    };
  }
};

// Add a utility function to verify contract connection
export const verifyContractConnection = async (signer: ethers.JsonRpcSigner) => {
  try {
    // Check Property Token contract
    const propertyContract = await getPropertyTokenContract(signer);
    const propertyName = await propertyContract.name();
    
    // Check Loan contract
    const loanContract = await getLoanContract(signer);
    const owner = await loanContract.owner();
    
    return {
      connected: true,
      propertyContractName: propertyName,
      loanContractOwner: owner
    };
  } catch (error) {
    console.error("Error verifying contract connection:", error);
    return {
      connected: false,
      error: "Cannot connect to smart contracts. Please check your network connection and contract addresses."
    };
  }
};

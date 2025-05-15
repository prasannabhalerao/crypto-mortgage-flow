
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
    const name = await contract.name().catch(e => {
      console.error("Error calling contract name:", e);
      return "Error";
    });
    console.log("Contract name:", name);
    
    console.log("Calling mintPropertyToken...");
    const tx = await contract.mintPropertyToken(to, propertyId, valueInWei);
    console.log("Transaction hash:", tx.hash);
    
    console.log("Waiting for transaction confirmation...");
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt);
    
    // Find the PropertyTokenized event
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
      .find((event: any) => event.name === "PropertyTokenized");

    if (!event) {
      console.error("PropertyTokenized event not found in logs");
      console.log("All events:", receipt.logs);
      throw new Error("Property tokenization failed - event not found");
    }

    console.log("Found PropertyTokenized event:", event);
    
    // Return the tokenId
    return event.args.tokenId.toString();
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
    
    // Find the LoanCreated event
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

    if (!event) {
      console.error("LoanCreated event not found in logs");
      console.log("All events:", receipt.logs);
      throw new Error("Loan creation failed - event not found");
    }

    console.log("Found LoanCreated event:", event);
    
    // Return the loanId
    return event.args.loanId.toString();
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

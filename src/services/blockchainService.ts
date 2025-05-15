
import { ethers } from "ethers";
import PropertyTokenAbi from "../contracts/PropertyToken.json";
import LoanContractAbi from "../contracts/LoanContract.json";

// Mock contract addresses (in a real app, these would come from environment variables)
const PROPERTY_TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const LOAN_CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

// Create contract instances
export const getPropertyTokenContract = async (signer: ethers.JsonRpcSigner) => {
  return new ethers.Contract(
    PROPERTY_TOKEN_ADDRESS,
    PropertyTokenAbi.abi,
    signer
  );
};

export const getLoanContract = async (signer: ethers.JsonRpcSigner) => {
  return new ethers.Contract(
    LOAN_CONTRACT_ADDRESS,
    LoanContractAbi.abi,
    signer
  );
};

// Mint a property token
export const mintPropertyToken = async (
  signer: ethers.JsonRpcSigner,
  to: string,
  propertyId: string,
  propertyValue: number
) => {
  try {
    const contract = await getPropertyTokenContract(signer);
    
    // Convert property value to wei (assuming the value is in USD)
    const valueInWei = ethers.parseUnits(propertyValue.toString(), 18);
    
    const tx = await contract.mintPropertyToken(to, propertyId, valueInWei);
    const receipt = await tx.wait();
    
    // Find the PropertyTokenized event
    const event = receipt.logs
      .map((log: any) => {
        try {
          return contract.interface.parseLog(log);
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean)
      .find((event: any) => event.name === "PropertyTokenized");

    if (!event) {
      throw new Error("Property tokenization failed");
    }

    // Return the tokenId
    return event.args.tokenId.toString();
  } catch (error) {
    console.error("Error minting property token:", error);
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
    const contract = await getLoanContract(signer);
    
    // Convert amounts to wei
    const loanAmountInWei = ethers.parseUnits(amount.toString(), 18);
    const collateralInWei = ethers.parseUnits(collateralAmount.toString(), 18);
    
    // Multiply interest rate by 100 for the contract (e.g., 3.5% becomes 350)
    const interestRateForContract = Math.floor(interestRate * 100);
    
    const tx = await contract.createLoan(
      tokenId,
      loanAmountInWei,
      term,
      interestRateForContract,
      { value: collateralInWei }
    );
    
    const receipt = await tx.wait();
    
    // Find the LoanCreated event
    const event = receipt.logs
      .map((log: any) => {
        try {
          return contract.interface.parseLog(log);
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean)
      .find((event: any) => event.name === "LoanCreated");

    if (!event) {
      throw new Error("Loan creation failed");
    }

    // Return the loanId
    return event.args.loanId.toString();
  } catch (error) {
    console.error("Error creating loan:", error);
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
    const contract = await getLoanContract(signer);
    
    // Convert amount to wei
    const amountInWei = ethers.parseUnits(amount.toString(), 18);
    
    const tx = await contract.repayLoan(loanId, { value: amountInWei });
    const receipt = await tx.wait();
    
    return receipt;
  } catch (error) {
    console.error("Error repaying loan:", error);
    throw error;
  }
};

// Get loans by borrower
export const getLoansByBorrower = async (
  provider: ethers.BrowserProvider,
  borrower: string
) => {
  try {
    const contract = new ethers.Contract(
      LOAN_CONTRACT_ADDRESS,
      LoanContractAbi.abi,
      provider
    );
    
    const loanIds = await contract.getLoansByBorrower(borrower);
    
    const loans = await Promise.all(
      loanIds.map(async (id: number) => {
        const loan = await contract.getLoan(id);
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
    
    return loans;
  } catch (error) {
    console.error("Error getting loans by borrower:", error);
    throw error;
  }
};

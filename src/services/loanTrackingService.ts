
import { createLoan as originalCreateLoan } from './blockchainService';
import { ethers } from 'ethers';
import { toast } from 'sonner';

// Function to track property loans in localStorage
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

// Function to check if a property has available value for a loan
export const checkPropertyAvailableValue = (propertyId: string, propertyValue: number) => {
  try {
    const propertyLoansJSON = localStorage.getItem('propertyLoans');
    if (!propertyLoansJSON) return propertyValue;
    
    const propertyLoans = JSON.parse(propertyLoansJSON);
    const loanedAmount = propertyLoans[propertyId] || 0;
    
    return Math.max(propertyValue - loanedAmount, 0);
  } catch (error) {
    console.error("Error checking property available value:", error);
    return propertyValue; // Default to full value if error
  }
};

// Enhanced createLoan that tracks property value
export const createLoanWithTracking = async (
  signer: ethers.JsonRpcSigner,
  propertyId: string,
  tokenId: string,
  amount: number,
  term: number,
  interestRate: number,
  collateralAmount: number,
  propertyValue: number
) => {
  // First check if the property has enough value remaining
  const availableValue = checkPropertyAvailableValue(propertyId, propertyValue);
  
  if (amount > availableValue) {
    toast.error(`Cannot create loan: requested amount (${amount}) exceeds available property value (${availableValue})`);
    throw new Error(`Loan amount exceeds available property value`);
  }
  
  try {
    // Create the loan using the original function
    const loanId = await originalCreateLoan(
      signer,
      tokenId,
      amount,
      term,
      interestRate,
      collateralAmount
    );
    
    // Track the loan against the property value
    trackPropertyLoanInLocalStorage(propertyId, amount);
    
    return loanId;
  } catch (error) {
    console.error("Error in createLoanWithTracking:", error);
    throw error;
  }
};

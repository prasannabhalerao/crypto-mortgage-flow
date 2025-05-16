
import { Loan } from "../types";
import { mockLoans } from "./mockData";

// Create a mutable copy of mockLoans for our mock service
let loans: Loan[] = [...mockLoans];

// Get all loans
export const getAllLoans = async (): Promise<Loan[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...loans];
};

// Get loans by borrower address
export const getLoansByBorrower = async (borrowerAddress: string): Promise<Loan[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return loans.filter(loan => loan.borrower.toLowerCase() === borrowerAddress.toLowerCase());
};

// Get loan by ID
export const getLoanById = async (id: string): Promise<Loan | undefined> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return loans.find(loan => loan.id === id);
};

// Get loans by property ID
export const getLoansByPropertyId = async (propertyId: string): Promise<Loan[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return loans.filter(loan => loan.propertyId === propertyId);
};

// Calculate remaining property value after existing loans
export const getAvailablePropertyValue = async (propertyId: string, totalValue: number): Promise<number> => {
  // Get all loans for this property
  const propertyLoans = await getLoansByPropertyId(propertyId);
  
  // Calculate total loaned amount
  const totalLoanedAmount = propertyLoans.reduce((total, loan) => {
    // Only count active or approved loans
    if (loan.status === "active" || loan.status === "approved" || loan.status === "pending") {
      return total + loan.amount;
    }
    return total;
  }, 0);
  
  // Calculate remaining value
  const remainingValue = totalValue - totalLoanedAmount;
  
  return Math.max(remainingValue, 0); // Ensure we don't return negative values
};

// Create a new loan request
export const createLoanRequest = async (loanRequest: Omit<Loan, "id" | "status" | "startDate">): Promise<Loan> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Update property value tracking in localStorage
  updatePropertyLoanValueInLocalStorage(loanRequest.propertyId, loanRequest.amount);
  
  const newLoan: Loan = {
    ...loanRequest,
    id: `loan${loans.length + 1}`,
    status: "pending",
    startDate: new Date()
  };
  
  loans.push(newLoan);
  return newLoan;
};

// Update property loan value in localStorage
const updatePropertyLoanValueInLocalStorage = (propertyId: string, loanAmount: number) => {
  try {
    // Get existing property loans
    const propertyLoansJSON = localStorage.getItem('propertyLoans');
    const propertyLoans = propertyLoansJSON ? JSON.parse(propertyLoansJSON) : {};
    
    // Update for this property
    propertyLoans[propertyId] = (propertyLoans[propertyId] || 0) + loanAmount;
    
    // Save back to localStorage
    localStorage.setItem('propertyLoans', JSON.stringify(propertyLoans));
    
    console.log(`Updated loan amount for property ${propertyId}: ${propertyLoans[propertyId]}`);
  } catch (error) {
    console.error("Error updating property loan value in localStorage:", error);
  }
};

// Get total loaned amount for a property from localStorage
export const getPropertyLoanedAmount = (propertyId: string): number => {
  try {
    const propertyLoansJSON = localStorage.getItem('propertyLoans');
    if (!propertyLoansJSON) return 0;
    
    const propertyLoans = JSON.parse(propertyLoansJSON);
    return propertyLoans[propertyId] || 0;
  } catch (error) {
    console.error("Error getting property loaned amount from localStorage:", error);
    return 0;
  }
};

// Update loan status
export const updateLoanStatus = async (id: string, status: Loan["status"]): Promise<Loan> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const loanIndex = loans.findIndex(l => l.id === id);
  if (loanIndex === -1) {
    throw new Error("Loan not found");
  }
  
  const updatedLoan = {
    ...loans[loanIndex],
    status,
    ...(status === "active" ? { startDate: new Date() } : {})
  };
  
  loans[loanIndex] = updatedLoan;
  return updatedLoan;
};

// Reset to mock data (for testing)
export const resetLoans = () => {
  loans = [...mockLoans];
};


import { Loan } from "../types";
import { mockLoans } from "./mockData";

// Create a mutable copy of mockLoans for our mock service
let loans: Loan[] = [...mockLoans];

// Track borrowed amounts per property
const borrowedAmountsByProperty: Record<string, number> = {};

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

// Get total borrowed amount for a property
export const getBorrowedAmountByProperty = async (propertyId: string): Promise<number> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Calculate total from actual loans for this property
  const propertyLoans = loans.filter(loan => 
    loan.propertyId === propertyId && 
    (loan.status === "active" || loan.status === "pending" || loan.status === "approved")
  );
  
  const totalBorrowed = propertyLoans.reduce((sum, loan) => sum + loan.amount, 0);
  borrowedAmountsByProperty[propertyId] = totalBorrowed;
  
  return totalBorrowed;
};

// Create a new loan request
export const createLoanRequest = async (loanRequest: Omit<Loan, "id" | "status" | "startDate">): Promise<Loan> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Check if the requested loan amount exceeds available equity
  const currentBorrowed = await getBorrowedAmountByProperty(loanRequest.propertyId);
  
  const newLoan: Loan = {
    ...loanRequest,
    id: `loan${loans.length + 1}`,
    status: "pending",
    startDate: new Date()
  };
  
  // Update borrowed amounts tracking
  borrowedAmountsByProperty[loanRequest.propertyId] = (borrowedAmountsByProperty[loanRequest.propertyId] || 0) + loanRequest.amount;
  
  loans.push(newLoan);
  return newLoan;
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
  
  // If loan is repaid or defaulted, remove the amount from borrowed tracking
  if (status === "repaid" || status === "defaulted") {
    const propertyId = updatedLoan.propertyId;
    borrowedAmountsByProperty[propertyId] = Math.max(0, 
      (borrowedAmountsByProperty[propertyId] || 0) - updatedLoan.amount);
  }
  
  return updatedLoan;
};

// Reset to mock data (for testing)
export const resetLoans = () => {
  loans = [...mockLoans];
  
  // Reset borrowed amounts tracking
  Object.keys(borrowedAmountsByProperty).forEach(key => {
    borrowedAmountsByProperty[key] = 0;
  });
};

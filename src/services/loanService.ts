
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

// Create a new loan request
export const createLoanRequest = async (loanRequest: Omit<Loan, "id" | "status" | "startDate">): Promise<Loan> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const newLoan: Loan = {
    ...loanRequest,
    id: `loan${loans.length + 1}`,
    status: "pending",
    startDate: new Date()
  };
  
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
  return updatedLoan;
};

// Reset to mock data (for testing)
export const resetLoans = () => {
  loans = [...mockLoans];
};

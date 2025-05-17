
import { supabase } from "../integrations/supabase/client";
import { Loan, Property } from "../types";
import { mockLoans } from "./mockData";
import { getPropertyById } from "./propertyService";

// Create a local backup of mockLoans (will be migrated to Supabase)
let loans: Loan[] = [...mockLoans];

// Get all loans
export const getAllLoans = async (): Promise<Loan[]> => {
  try {
    // First fetch loans
    const { data: loanData, error: loanError } = await supabase
      .from('loans')
      .select('*');
    
    if (loanError) throw loanError;
    
    // Then fetch repayment schedules for each loan
    const loansWithSchedules = await Promise.all(loanData.map(async (loan) => {
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('repayment_schedule')
        .select('*')
        .eq('loan_id', loan.id);
      
      if (scheduleError) throw scheduleError;
      
      // Convert types and format data
      return {
        id: loan.id,
        borrower: loan.borrower,
        propertyId: loan.property_id,
        tokenId: loan.token_id || '',
        amount: Number(loan.amount),
        interestRate: Number(loan.interest_rate),
        term: loan.term,
        startDate: new Date(loan.start_date),
        status: loan.status,
        collateralAmount: Number(loan.collateral_amount),
        loanToValue: Number(loan.loan_to_value),
        repaymentSchedule: scheduleData.map(schedule => ({
          date: new Date(schedule.date),
          amount: Number(schedule.amount),
          status: schedule.status as 'pending' | 'paid' | 'overdue'
        }))
      } as Loan;
    }));
    
    return loansWithSchedules;
  } catch (error) {
    console.error("Error fetching loans from Supabase:", error);
    
    // Fallback to mock data
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...loans];
  }
};

// Get loans by borrower address
export const getLoansByBorrower = async (borrowerAddress: string): Promise<Loan[]> => {
  if (!borrowerAddress) return [];
  
  try {
    // First fetch loans for this borrower
    const { data: loanData, error: loanError } = await supabase
      .from('loans')
      .select('*')
      .eq('borrower', borrowerAddress.toLowerCase());
    
    if (loanError) throw loanError;
    
    // Then fetch repayment schedules for each loan
    const loansWithSchedules = await Promise.all(loanData.map(async (loan) => {
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('repayment_schedule')
        .select('*')
        .eq('loan_id', loan.id);
      
      if (scheduleError) throw scheduleError;
      
      return {
        id: loan.id,
        borrower: loan.borrower,
        propertyId: loan.property_id,
        tokenId: loan.token_id || '',
        amount: Number(loan.amount),
        interestRate: Number(loan.interest_rate),
        term: loan.term,
        startDate: new Date(loan.start_date),
        status: loan.status,
        collateralAmount: Number(loan.collateral_amount),
        loanToValue: Number(loan.loan_to_value),
        repaymentSchedule: scheduleData.map(schedule => ({
          date: new Date(schedule.date),
          amount: Number(schedule.amount),
          status: schedule.status as 'pending' | 'paid' | 'overdue'
        }))
      } as Loan;
    }));
    
    return loansWithSchedules;
  } catch (error) {
    console.error("Error fetching loans by borrower from Supabase:", error);
    
    // Fallback to mock data
    await new Promise(resolve => setTimeout(resolve, 500));
    return loans.filter(loan => 
      loan.borrower.toLowerCase() === borrowerAddress.toLowerCase()
    );
  }
};

// Get loan by ID
export const getLoanById = async (id: string): Promise<Loan | undefined> => {
  try {
    // Fetch the loan
    const { data: loan, error: loanError } = await supabase
      .from('loans')
      .select('*')
      .eq('id', id)
      .single();
    
    if (loanError) throw loanError;
    
    // Fetch the repayment schedule
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('repayment_schedule')
      .select('*')
      .eq('loan_id', id);
    
    if (scheduleError) throw scheduleError;
    
    return {
      id: loan.id,
      borrower: loan.borrower,
      propertyId: loan.property_id,
      tokenId: loan.token_id || '',
      amount: Number(loan.amount),
      interestRate: Number(loan.interest_rate),
      term: loan.term,
      startDate: new Date(loan.start_date),
      status: loan.status,
      collateralAmount: Number(loan.collateral_amount),
      loanToValue: Number(loan.loan_to_value),
      repaymentSchedule: scheduleData.map(schedule => ({
        date: new Date(schedule.date),
        amount: Number(schedule.amount),
        status: schedule.status as 'pending' | 'paid' | 'overdue'
      }))
    } as Loan;
  } catch (error) {
    console.error("Error fetching loan by ID from Supabase:", error);
    
    // Fallback to mock data
    await new Promise(resolve => setTimeout(resolve, 500));
    return loans.find(loan => loan.id === id);
  }
};

// Get loans by property ID
export const getLoansByPropertyId = async (propertyId: string): Promise<Loan[]> => {
  try {
    // First fetch loans for this property
    const { data: loanData, error: loanError } = await supabase
      .from('loans')
      .select('*')
      .eq('property_id', propertyId);
    
    if (loanError) throw loanError;
    
    // Then fetch repayment schedules for each loan
    const loansWithSchedules = await Promise.all(loanData.map(async (loan) => {
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('repayment_schedule')
        .select('*')
        .eq('loan_id', loan.id);
      
      if (scheduleError) throw scheduleError;
      
      return {
        id: loan.id,
        borrower: loan.borrower,
        propertyId: loan.property_id,
        tokenId: loan.token_id || '',
        amount: Number(loan.amount),
        interestRate: Number(loan.interest_rate),
        term: loan.term,
        startDate: new Date(loan.start_date),
        status: loan.status,
        collateralAmount: Number(loan.collateral_amount),
        loanToValue: Number(loan.loan_to_value),
        repaymentSchedule: scheduleData.map(schedule => ({
          date: new Date(schedule.date),
          amount: Number(schedule.amount),
          status: schedule.status as 'pending' | 'paid' | 'overdue'
        }))
      } as Loan;
    }));
    
    return loansWithSchedules;
  } catch (error) {
    console.error("Error fetching loans by property ID from Supabase:", error);
    
    // Fallback to mock data
    await new Promise(resolve => setTimeout(resolve, 500));
    return loans.filter(loan => loan.propertyId === propertyId);
  }
};

// Calculate remaining property value after existing loans
export const getAvailablePropertyValue = async (propertyId: string, totalValue: number): Promise<number> => {
  try {
    // Get all loans for this property from Supabase
    const { data, error } = await supabase
      .from('loans')
      .select('amount, status')
      .eq('property_id', propertyId)
      .in('status', ['active', 'approved', 'pending']);
      
    if (error) throw error;
    
    // Calculate total loaned amount
    const totalLoanedAmount = data.reduce((total, loan) => {
      return total + Number(loan.amount);
    }, 0);
    
    // Calculate remaining value
    const remainingValue = totalValue - totalLoanedAmount;
    return Math.max(remainingValue, 0); // Ensure we don't return negative values
  } catch (error) {
    console.error("Error calculating available property value from Supabase:", error);
    
    // Fallback to mock implementation
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
    return Math.max(remainingValue, 0);
  }
};

// Create a new loan request
export const createLoanRequest = async (loanRequest: Omit<Loan, "id" | "status" | "startDate">): Promise<Loan> => {
  try {
    // Update property value tracking in localStorage
    updatePropertyLoanValueInLocalStorage(loanRequest.propertyId, loanRequest.amount);
    
    // Prepare loan data for Supabase
    const loanData = {
      borrower: loanRequest.borrower.toLowerCase(),
      property_id: loanRequest.propertyId,
      token_id: loanRequest.tokenId,
      amount: loanRequest.amount,
      interest_rate: loanRequest.interestRate,
      term: loanRequest.term,
      status: 'pending',
      collateral_amount: loanRequest.collateralAmount,
      loan_to_value: loanRequest.loanToValue
    };
    
    // Insert loan into Supabase
    const { data: loan, error: loanError } = await supabase
      .from('loans')
      .insert(loanData)
      .select()
      .single();
    
    if (loanError) throw loanError;
    
    // Generate repayment schedule
    const scheduleData = generateRepaymentSchedule(
      loan.id,
      Number(loan.amount),
      Number(loan.interest_rate),
      loan.term
    );
    
    // Insert repayment schedule into Supabase
    const { error: scheduleError } = await supabase
      .from('repayment_schedule')
      .insert(scheduleData);
    
    if (scheduleError) throw scheduleError;
    
    // Fetch the complete loan with repayment schedule
    return getLoanById(loan.id) as Promise<Loan>;
  } catch (error) {
    console.error("Error creating loan request in Supabase:", error);
    
    // Fallback to mock implementation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update property value tracking in localStorage
    updatePropertyLoanValueInLocalStorage(loanRequest.propertyId, loanRequest.amount);
    
    const newLoan: Loan = {
      ...loanRequest,
      id: `loan${loans.length + 1}`,
      status: "pending",
      startDate: new Date(),
      repaymentSchedule: []
    };
    
    loans.push(newLoan);
    return newLoan;
  }
};

// Generate repayment schedule for a loan
const generateRepaymentSchedule = (
  loanId: string,
  amount: number,
  interestRate: number,
  term: number
) => {
  const monthlyRate = interestRate / 100 / 12;
  const monthlyPayment = (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term));
  
  const schedule = [];
  let date = new Date();
  
  for (let i = 0; i < term; i++) {
    date = new Date(date);
    date.setMonth(date.getMonth() + 1);
    
    schedule.push({
      loan_id: loanId,
      date: date.toISOString(),
      amount: monthlyPayment,
      status: 'pending'
    });
  }
  
  return schedule;
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
  try {
    // Update loan status in Supabase
    const { data, error } = await supabase
      .from('loans')
      .update({ 
        status,
        ...(status === "active" ? { start_date: new Date().toISOString() } : {})
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Fetch the complete updated loan
    return getLoanById(id) as Promise<Loan>;
  } catch (error) {
    console.error("Error updating loan status in Supabase:", error);
    
    // Fallback to mock implementation
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
  }
};

// Migrate mock data to Supabase (can be called on app initialization)
export const migrateMockLoansToSupabase = async () => {
  try {
    // Check if we already have loans in Supabase
    const { count, error } = await supabase
      .from('loans')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    
    // Only migrate if no loans exist yet
    if (count === 0) {
      // Insert loans
      for (const loan of mockLoans) {
        // First, ensure the property exists
        const property = await getPropertyById(loan.propertyId);
        if (!property) {
          console.error(`Cannot migrate loan ${loan.id}: Property ${loan.propertyId} not found`);
          continue;
        }
        
        // Insert the loan
        const loanData = {
          id: loan.id,
          borrower: loan.borrower.toLowerCase(),
          property_id: loan.propertyId,
          token_id: loan.tokenId,
          amount: loan.amount,
          interest_rate: loan.interestRate,
          term: loan.term,
          status: loan.status,
          start_date: loan.startDate.toISOString(),
          collateral_amount: loan.collateralAmount,
          loan_to_value: loan.loanToValue
        };
        
        const { data: insertedLoan, error: loanError } = await supabase
          .from('loans')
          .insert(loanData)
          .select()
          .single();
        
        if (loanError) {
          console.error(`Error inserting loan ${loan.id}:`, loanError);
          continue;
        }
        
        // Insert repayment schedule
        const scheduleData = loan.repaymentSchedule.map(item => ({
          loan_id: insertedLoan.id,
          date: item.date.toISOString(),
          amount: item.amount,
          status: item.status
        }));
        
        if (scheduleData.length > 0) {
          const { error: scheduleError } = await supabase
            .from('repayment_schedule')
            .insert(scheduleData);
          
          if (scheduleError) {
            console.error(`Error inserting repayment schedule for loan ${loan.id}:`, scheduleError);
          }
        }
      }
      
      console.log("Successfully migrated mock loans to Supabase");
    }
  } catch (error) {
    console.error("Error migrating mock loans to Supabase:", error);
  }
};

// Reset to mock data (for testing)
export const resetLoans = () => {
  loans = [...mockLoans];
};

// Call this function to migrate data on app initialization
migrateMockLoansToSupabase();

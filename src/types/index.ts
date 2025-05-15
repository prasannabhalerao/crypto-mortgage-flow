
export interface Property {
  id: string;
  owner: string;
  title: string;
  description: string;
  location: string;
  value: number;
  imageUrl: string;
  status: "pending" | "approved" | "rejected" | "tokenized";
  tokenId?: string;
  createdAt: Date;
}

export interface Loan {
  id: string;
  borrower: string;
  propertyId: string;
  tokenId: string;
  amount: number;
  interestRate: number;
  term: number; // in months
  startDate: Date;
  status: "pending" | "approved" | "active" | "repaid" | "defaulted";
  repaymentSchedule: {
    date: Date;
    amount: number;
    status: "pending" | "paid" | "overdue";
  }[];
  collateralAmount: number;
  loanToValue: number; // LTV ratio
}

export type UserRole = "user" | "admin";

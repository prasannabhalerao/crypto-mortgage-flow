
import { Property, Loan } from "../types";

// Mock properties
export const mockProperties: Property[] = [
  {
    id: "prop1",
    owner: "0x123",
    title: "Downtown Apartment",
    description: "A beautiful apartment in the heart of downtown",
    location: "123 Main St, New York, NY",
    value: 500000,
    imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop",
    status: "tokenized",
    tokenId: "1",
    createdAt: new Date("2023-01-15")
  },
  {
    id: "prop2",
    owner: "0x123",
    title: "Beach House",
    description: "Stunning beach house with ocean views",
    location: "456 Ocean Ave, Miami, FL",
    value: 1200000,
    imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop",
    status: "approved",
    createdAt: new Date("2023-02-20")
  },
  {
    id: "prop3",
    owner: "0x456",
    title: "Mountain Cabin",
    description: "Cozy cabin in the mountains",
    location: "789 Pine Rd, Aspen, CO",
    value: 800000,
    imageUrl: "https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=800&auto=format&fit=crop",
    status: "pending",
    createdAt: new Date("2023-03-10")
  }
];

// Mock loans
export const mockLoans: Loan[] = [
  {
    id: "loan1",
    borrower: "0x123",
    propertyId: "prop1",
    tokenId: "1",
    amount: 300000,
    interestRate: 3.5,
    term: 360, // 30 years
    startDate: new Date("2023-02-01"),
    status: "active",
    repaymentSchedule: [
      {
        date: new Date("2023-03-01"),
        amount: 1347.13,
        status: "paid"
      },
      {
        date: new Date("2023-04-01"),
        amount: 1347.13,
        status: "paid"
      },
      {
        date: new Date("2023-05-01"),
        amount: 1347.13,
        status: "pending"
      }
    ],
    collateralAmount: 30000,
    loanToValue: 60 // 60%
  }
];

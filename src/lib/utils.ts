
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function truncateAddress(address: string, startLength = 6, endLength = 4): string {
  if (!address) return '';
  
  const start = address.substring(0, startLength);
  const end = address.substring(address.length - endLength);
  
  return `${start}...${end}`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date instanceof Date ? date : new Date(date));
}

export function calculateLTV(loanAmount: number, propertyValue: number): number {
  return (loanAmount / propertyValue) * 100;
}

export function calculateMonthlyPayment(principal: number, annualRate: number, termInMonths: number): number {
  const monthlyRate = annualRate / 100 / 12;
  
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, termInMonths)) / 
         (Math.pow(1 + monthlyRate, termInMonths) - 1);
}

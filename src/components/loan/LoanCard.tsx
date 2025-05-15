
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loan } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface LoanCardProps {
  loan: Loan;
  isAdmin?: boolean;
}

const LoanCard: React.FC<LoanCardProps> = ({ loan, isAdmin = false }) => {
  const getStatusColor = (status: Loan["status"]) => {
    switch (status) {
      case "active":
        return "bg-mortgage-success text-white";
      case "approved":
        return "bg-blue-500 text-white";
      case "pending":
        return "bg-yellow-500 text-white";
      case "repaid":
        return "bg-green-700 text-white";
      case "defaulted":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  // Calculate paid amount based on repayment schedule
  const paidAmount = loan.repaymentSchedule
    .filter(payment => payment.status === "paid")
    .reduce((total, payment) => total + payment.amount, 0);
  
  // Calculate next payment date
  const nextPayment = loan.repaymentSchedule.find(payment => payment.status === "pending");

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">Loan #{loan.id}</CardTitle>
          <Badge className={getStatusColor(loan.status)}>
            {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Loan Amount</p>
            <p className="font-semibold text-lg">{formatCurrency(loan.amount)}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-sm text-gray-500">Interest Rate</p>
              <p>{loan.interestRate}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Term</p>
              <p>{loan.term / 12} years</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-sm text-gray-500">Start Date</p>
              <p>{loan.startDate.toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">LTV Ratio</p>
              <p>{loan.loanToValue.toFixed(1)}%</p>
            </div>
          </div>
          
          {loan.status === "active" && (
            <>
              <div>
                <p className="text-sm text-gray-500">Next Payment</p>
                <p>
                  {nextPayment 
                    ? `${formatCurrency(nextPayment.amount)} due ${nextPayment.date.toLocaleDateString()}` 
                    : "No payments scheduled"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Repayment Progress</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-mortgage-primary h-2 rounded-full" 
                    style={{ width: `${(paidAmount / loan.amount) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-right mt-1">
                  {formatCurrency(paidAmount)} / {formatCurrency(loan.amount)} ({((paidAmount / loan.amount) * 100).toFixed(1)}%)
                </p>
              </div>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Link 
          to={isAdmin ? `/admin/loans/${loan.id}` : `/loans/${loan.id}`} 
          className="w-full"
        >
          <Button
            variant="outline"
            className="w-full border-mortgage-primary text-mortgage-primary hover:bg-mortgage-primary/10"
          >
            {isAdmin ? "Review Loan" : "View Details"}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default LoanCard;

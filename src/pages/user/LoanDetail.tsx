
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useWeb3 } from "@/contexts/Web3Context";
import { toast } from "sonner";
import { getLoanById } from "@/services/loanService";
import { Loan } from "@/types";
import { repayLoan } from "@/services/blockchainService";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const statusColors = {
  pending: "bg-yellow-500 hover:bg-yellow-600",
  approved: "bg-blue-500 hover:bg-blue-600",
  active: "bg-green-500 hover:bg-green-600",
  repaid: "bg-purple-500 hover:bg-purple-600",
  defaulted: "bg-red-500 hover:bg-red-600",
};

const LoanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [processing, setProcessing] = useState(false);
  const { signer, account } = useWeb3();

  const {
    data: loan,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["loan", id],
    queryFn: () => id ? getLoanById(id) : Promise.reject("No loan ID provided"),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p>Loading loan details...</p>
        </div>
      </MainLayout>
    );
  }

  if (error || !loan) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-red-500">Error loading loan details</p>
          <Button
            onClick={() => navigate("/loans")}
            className="mt-4"
          >
            Back to Loans
          </Button>
        </div>
      </MainLayout>
    );
  }

  // Calculate loan progress (days elapsed / term length)
  const startDate = new Date(loan.startDate);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + loan.term);
  const today = new Date();
  
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const progressPercentage = Math.min(Math.max((daysElapsed / totalDays) * 100, 0), 100);
  
  // Generate sample repayment schedule
  const generateRepaymentSchedule = () => {
    const schedule: { date: Date; amount: number; status: "pending" | "paid" | "overdue" }[] = [];
    const monthlyPayment = loan.amount * (1 + loan.interestRate / 100) / loan.term;
    
    for (let i = 0; i < loan.term; i++) {
      const paymentDate = new Date(startDate);
      paymentDate.setMonth(paymentDate.getMonth() + i + 1);
      
      let status: "pending" | "paid" | "overdue";
      if (paymentDate < today) {
        status = "paid";
      } else if (paymentDate.getMonth() === today.getMonth() && paymentDate.getFullYear() === today.getFullYear()) {
        status = "pending";
      } else {
        status = "pending";
      }
      
      schedule.push({
        date: paymentDate,
        amount: monthlyPayment,
        status
      });
    }
    
    return schedule;
  };

  const repaymentSchedule = generateRepaymentSchedule();
  
  const handleRepayment = async () => {
    if (!signer || !account) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    setProcessing(true);
    
    try {
      // For a real app, we'd get the actual amount due here
      const currentMonth = today.getMonth() - startDate.getMonth() + 
        (12 * (today.getFullYear() - startDate.getFullYear()));
      
      if (currentMonth >= 0 && currentMonth < repaymentSchedule.length) {
        const amountDue = repaymentSchedule[currentMonth].amount;
        
        await repayLoan(signer, loan.id, amountDue);
        
        toast.success("Payment successful!");
        refetch();
      }
    } catch (error) {
      console.error("Payment failed:", error);
      toast.error("Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="outline"
          onClick={() => navigate("/loans")}
          className="mb-6"
        >
          &larr; Back to Loans
        </Button>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle className="text-2xl">Loan #{loan.id}</CardTitle>
                  <p className="text-gray-500 mt-1">
                    Property ID: {loan.propertyId}
                  </p>
                </div>
                <Badge className={`${statusColors[loan.status]} text-white`}>
                  {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                </Badge>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-sm text-gray-500 mb-1">Loan Amount</h3>
                    <p className="text-2xl font-bold">{formatCurrency(loan.amount)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-500 mb-1">Interest Rate</h3>
                    <p className="text-2xl font-bold">{loan.interestRate}% APR</p>
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-500 mb-1">Term</h3>
                    <p className="text-2xl font-bold">{loan.term} months</p>
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-500 mb-1">Start Date</h3>
                    <p className="text-2xl font-bold">{format(new Date(loan.startDate), "MMM d, yyyy")}</p>
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-500 mb-1">Collateral Amount</h3>
                    <p className="text-2xl font-bold">{formatCurrency(loan.collateralAmount)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-500 mb-1">Loan to Value</h3>
                    <p className="text-2xl font-bold">{loan.loanToValue * 100}%</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="font-medium mb-2">Loan Progress</h3>
                  <div className="mb-2">
                    <Progress value={progressPercentage} className="h-2" />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{format(startDate, "MMM d, yyyy")}</span>
                    <span>{Math.round(progressPercentage)}% Complete</span>
                    <span>{format(endDate, "MMM d, yyyy")}</span>
                  </div>
                </div>
                
                {loan.status === "active" && (
                  <div className="mt-6">
                    <Button 
                      onClick={handleRepayment}
                      disabled={processing}
                      className="w-full md:w-auto"
                    >
                      {processing ? "Processing..." : "Make Payment"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Repayment Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Due Date</th>
                        <th className="text-left py-2">Amount</th>
                        <th className="text-left py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {repaymentSchedule.map((payment, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2">{format(payment.date, "MMM d, yyyy")}</td>
                          <td className="py-2">{formatCurrency(payment.amount)}</td>
                          <td className="py-2">
                            <Badge className={
                              payment.status === "paid" ? "bg-green-500" :
                              payment.status === "overdue" ? "bg-red-500" : "bg-yellow-500"
                            }>
                              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Loan Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm text-gray-500">Borrower Address</h3>
                    <p className="font-mono text-sm break-all mt-1">{loan.borrower}</p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm text-gray-500">Token ID</h3>
                    <p className="font-mono text-sm break-all mt-1">{loan.tokenId}</p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm text-gray-500">Loan Contract</h3>
                    <p className="font-mono text-sm break-all mt-1">0x{Math.random().toString(16).substr(2, 40)}</p>
                  </div>
                </div>
                
                {loan.status === "active" && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-100">
                    <h4 className="font-medium text-blue-800">Next Payment</h4>
                    <p className="text-blue-600 mt-1">
                      {formatCurrency(repaymentSchedule[0].amount)} due on {format(repaymentSchedule[0].date, "MMMM d, yyyy")}
                    </p>
                  </div>
                )}
                
                {loan.status === "repaid" && (
                  <div className="mt-6 p-4 bg-green-50 rounded-md border border-green-100">
                    <h4 className="font-medium text-green-800">Loan Completed</h4>
                    <p className="text-green-600 mt-1">
                      This loan has been fully repaid.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default LoanDetail;

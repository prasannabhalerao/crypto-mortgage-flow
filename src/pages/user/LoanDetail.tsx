
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useWeb3 } from "@/contexts/Web3Context";
import { getLoanById } from "@/services/loanService";
import { getPropertyById } from "@/services/propertyService";
import { repayLoan } from "@/services/blockchainService";
import { Loan, Property } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

const LoanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { signer, account, connectWallet } = useWeb3();
  
  const [loan, setLoan] = useState<Loan | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const loanData = await getLoanById(id);
        if (loanData) {
          setLoan(loanData);
          
          // Fetch property details
          const propertyData = await getPropertyById(loanData.propertyId);
          setProperty(propertyData || null);
        } else {
          toast.error("Loan not found");
          navigate("/loans");
        }
      } catch (error) {
        console.error("Error fetching loan details:", error);
        toast.error("Error loading loan details");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, navigate]);

  const handleRepayLoan = async () => {
    if (!loan || !signer) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    setProcessing(true);
    
    try {
      // Calculate the next payment amount
      const nextPayment = loan.repaymentSchedule.find(payment => payment.status === "pending");
      
      if (!nextPayment) {
        toast.error("No pending payments found");
        return;
      }
      
      await repayLoan(signer, loan.id, nextPayment.amount);
      
      toast.success("Payment successful!");
      
      // Update the repayment schedule
      const updatedSchedule = loan.repaymentSchedule.map(payment => {
        if (payment === nextPayment) {
          return { ...payment, status: "paid" };
        }
        return payment;
      });
      
      setLoan({
        ...loan,
        repaymentSchedule: updatedSchedule
      });
      
    } catch (error) {
      console.error("Error repaying loan:", error);
      toast.error("Failed to process payment");
    } finally {
      setProcessing(false);
    }
  };

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

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p>Loading loan details...</p>
        </div>
      </MainLayout>
    );
  }

  if (!loan || !property) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-red-500">Loan details not found</p>
          <Button 
            className="mt-4" 
            onClick={() => navigate("/loans")}
          >
            Back to Loans
          </Button>
        </div>
      </MainLayout>
    );
  }

  // Calculate loan metrics
  const paidAmount = loan.repaymentSchedule
    .filter(payment => payment.status === "paid")
    .reduce((total, payment) => total + payment.amount, 0);
  
  const nextPayment = loan.repaymentSchedule.find(payment => payment.status === "pending");
  const remainingPayments = loan.repaymentSchedule.filter(payment => payment.status === "pending").length;
  
  const canMakePayment = loan.status === "active" && nextPayment;

  return (
    <MainLayout>
      <div>
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/loans")}
            className="mb-2"
          >
            ← Back to Loans
          </Button>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <h1 className="text-3xl font-bold text-mortgage-dark">Loan #{loan.id}</h1>
            <Badge className={`mt-2 md:mt-0 ${getStatusColor(loan.status)}`}>
              {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
            </Badge>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Loan Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 text-mortgage-dark">Loan Summary</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Loan Amount</p>
                    <p className="font-bold text-2xl">{formatCurrency(loan.amount)}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Interest Rate</p>
                      <p className="font-medium">{loan.interestRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Term</p>
                      <p className="font-medium">{loan.term} months</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Start Date</p>
                      <p className="font-medium">{formatDate(loan.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">LTV Ratio</p>
                      <p className="font-medium">{loan.loanToValue.toFixed(1)}%</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Collateral Amount</p>
                    <p className="font-medium">{loan.collateralAmount} ETH</p>
                  </div>
                </div>
                
                {loan.status === "active" && (
                  <div className="mt-6">
                    <div className="mb-2 flex justify-between items-center">
                      <span className="text-sm font-medium">Repayment Progress</span>
                      <span className="text-xs">
                        {((paidAmount / loan.amount) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-mortgage-primary h-2 rounded-full" 
                        style={{ width: `${(paidAmount / loan.amount) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                      <span>{formatCurrency(paidAmount)}</span>
                      <span>{formatCurrency(loan.amount)}</span>
                    </div>
                  </div>
                )}
                
                {canMakePayment ? (
                  <div className="mt-6">
                    {!account ? (
                      <Button 
                        onClick={connectWallet}
                        className="w-full bg-mortgage-primary hover:bg-mortgage-accent"
                      >
                        Connect Wallet to Make Payment
                      </Button>
                    ) : (
                      <Button
                        onClick={handleRepayLoan}
                        className="w-full bg-mortgage-primary hover:bg-mortgage-accent"
                        disabled={processing}
                      >
                        {processing ? "Processing..." : `Pay ${formatCurrency(nextPayment.amount)}`}
                      </Button>
                    )}
                    
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Next payment due: {formatDate(nextPayment.date)}
                    </p>
                  </div>
                ) : null}
                
                {loan.status === "pending" && (
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-700 text-sm">
                      Your loan application is being reviewed. You'll be notified when it's approved.
                    </p>
                  </div>
                )}
                
                {loan.status === "repaid" && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-700 text-sm">
                      This loan has been fully repaid. Your collateral has been returned.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Property & Payment Details */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 text-mortgage-dark">Collateralized Property</h2>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="md:w-1/3">
                    <img 
                      src={property.imageUrl || "/placeholder.svg"} 
                      alt={property.title}
                      className="w-full h-auto object-cover rounded-md"
                    />
                  </div>
                  <div className="md:w-2/3">
                    <h3 className="font-bold text-lg mb-2">{property.title}</h3>
                    <p className="text-gray-500 mb-2">{property.location}</p>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-500">Property Value</p>
                        <p className="font-medium">{formatCurrency(property.value)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Token ID</p>
                        <p className="font-medium text-mortgage-primary">{property.tokenId}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 text-mortgage-dark">Payment Schedule</h2>
                
                {loan.repaymentSchedule.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-gray-50 text-left">
                          <th className="py-2 px-4 font-semibold">Due Date</th>
                          <th className="py-2 px-4 font-semibold">Amount</th>
                          <th className="py-2 px-4 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {loan.repaymentSchedule.map((payment, index) => (
                          <tr key={index}>
                            <td className="py-2 px-4">{formatDate(payment.date)}</td>
                            <td className="py-2 px-4">{formatCurrency(payment.amount)}</td>
                            <td className="py-2 px-4">
                              <Badge
                                className={
                                  payment.status === "paid"
                                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                                    : payment.status === "overdue"
                                    ? "bg-red-100 text-red-800 hover:bg-red-100"
                                    : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                }
                              >
                                {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">Payment schedule will be available once the loan is active.</p>
                )}
                
                {loan.status === "active" && remainingPayments > 0 && (
                  <div className="mt-4 text-sm text-gray-600">
                    <p>Remaining payments: {remainingPayments}</p>
                    <p>Total remaining: {formatCurrency(remainingPayments * (nextPayment?.amount || 0))}</p>
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

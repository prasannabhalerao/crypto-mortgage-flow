
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PropertyCard from "@/components/property/PropertyCard";
import LoanCard from "@/components/loan/LoanCard";
import { useAuth } from "@/contexts/AuthContext";
import { useWeb3 } from "@/contexts/Web3Context";
import { getPropertiesByOwner } from "@/services/propertyService";
import { getLoansByBorrower } from "@/services/loanService";
import { Property, Loan } from "@/types";
import { formatCurrency } from "@/lib/utils";

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { connectWallet, account } = useWeb3();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser || !currentUser.address) return;
      
      setLoading(true);
      try {
        const [propertiesData, loansData] = await Promise.all([
          getPropertiesByOwner(currentUser.address),
          getLoansByBorrower(currentUser.address)
        ]);
        
        setProperties(propertiesData);
        setLoans(loansData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser]);

  // Calculate stats
  const tokenizedProperties = properties.filter(p => p.status === "tokenized").length;
  const totalPropertyValue = properties.reduce((sum, p) => sum + p.value, 0);
  const activeLoans = loans.filter(l => l.status === "active").length;
  const totalLoanAmount = loans
    .filter(l => ["active", "approved"].includes(l.status))
    .reduce((sum, l) => sum + l.amount, 0);

  return (
    <MainLayout>
      <div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-mortgage-dark">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {currentUser?.username || "User"}</p>
          </div>
          
          {!account ? (
            <Button 
              onClick={connectWallet}
              className="mt-4 md:mt-0 bg-mortgage-primary hover:bg-mortgage-accent"
            >
              Connect Wallet
            </Button>
          ) : (
            <div className="mt-4 md:mt-0 text-sm text-gray-600">
              Wallet connected: <span className="font-medium text-mortgage-primary">{account.slice(0, 6)}...{account.slice(-4)}</span>
            </div>
          )}
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{properties.length}</div>
              <p className="text-sm text-gray-600">{tokenizedProperties} tokenized</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Property Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalPropertyValue)}</div>
              <p className="text-sm text-gray-600">Total estimated value</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Active Loans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeLoans}</div>
              <p className="text-sm text-gray-600">Out of {loans.length} total</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Loan Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalLoanAmount)}</div>
              <p className="text-sm text-gray-600">Current outstanding</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Properties */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-mortgage-dark">Your Properties</h2>
            <Link to="/properties">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
          
          {properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.slice(0, 3).map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-gray-500 mb-4">You don't have any properties yet.</p>
                <Link to="/properties/new">
                  <Button className="bg-mortgage-primary hover:bg-mortgage-accent">
                    Register a Property
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Loans */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-mortgage-dark">Your Loans</h2>
            <Link to="/loans">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
          
          {loans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loans.slice(0, 3).map((loan) => (
                <LoanCard key={loan.id} loan={loan} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-gray-500 mb-4">You don't have any loans yet.</p>
                <Link to="/loans/new">
                  <Button className="bg-mortgage-primary hover:bg-mortgage-accent">
                    Apply for a Loan
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;

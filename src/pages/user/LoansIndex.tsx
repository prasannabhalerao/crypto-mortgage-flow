
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import LoanCard from "@/components/loan/LoanCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { getLoansByBorrower } from "@/services/loanService";
import { Loan } from "@/types";
import { getPropertiesByOwner } from "@/services/propertyService";
import { toast } from "sonner";

const LoansIndex: React.FC = () => {
  const { currentUser } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [hasTokenizedProperties, setHasTokenizedProperties] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.address) return;
      
      setLoading(true);
      try {
        const [loansData, propertiesData] = await Promise.all([
          getLoansByBorrower(currentUser.address),
          getPropertiesByOwner(currentUser.address)
        ]);
        
        setLoans(loansData);
        setHasTokenizedProperties(propertiesData.some(p => p.status === "tokenized"));
      } catch (error) {
        console.error("Error fetching loans:", error);
        toast.error("Failed to load loan data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser]);

  const filteredLoans = activeTab === "all" 
    ? loans 
    : loans.filter(loan => loan.status === activeTab);

  return (
    <MainLayout>
      <div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-mortgage-dark">My Loans</h1>
            <p className="text-gray-600">Manage your loan applications and active loans</p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Link to="/loans/new">
              <Button 
                className="bg-mortgage-primary hover:bg-mortgage-accent"
                disabled={!hasTokenizedProperties}
              >
                Apply for a Loan
              </Button>
            </Link>
          </div>
        </div>
        
        {!hasTokenizedProperties && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <p className="text-yellow-700">
              You need to have a tokenized property to apply for a loan. 
              <Link to="/properties" className="text-mortgage-primary font-medium ml-1">
                View your properties
              </Link>
            </p>
          </div>
        )}
        
        <Tabs defaultValue="all" className="mb-6" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="repaid">Repaid</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab}>
            {loading ? (
              <div className="text-center py-12">
                <p>Loading loans...</p>
              </div>
            ) : filteredLoans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLoans.map((loan) => (
                  <LoanCard key={loan.id} loan={loan} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No loans found in this category.</p>
                {hasTokenizedProperties && (
                  <Link to="/loans/new">
                    <Button className="bg-mortgage-primary hover:bg-mortgage-accent">
                      Apply for a Loan
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default LoansIndex;

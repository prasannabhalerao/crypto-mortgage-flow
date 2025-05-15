
import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import LoanCard from "@/components/loan/LoanCard";
import { useAuth } from "@/contexts/AuthContext";
import { getAllLoans } from "@/services/loanService";
import { Loan } from "@/types";
import { toast } from "sonner";

const AdminLoans: React.FC = () => {
  const { isAdmin } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get("status") || "all";

  useEffect(() => {
    if (!isAdmin) {
      toast.error("You do not have permission to access this page");
      return;
    }
    
    const fetchLoans = async () => {
      setLoading(true);
      try {
        const data = await getAllLoans();
        setLoans(data);
      } catch (error) {
        console.error("Error fetching loans:", error);
        toast.error("Failed to load loans");
      } finally {
        setLoading(false);
      }
    };
    
    fetchLoans();
  }, [isAdmin]);

  const handleTabChange = (value: string) => {
    setSearchParams({ status: value });
  };

  const filteredLoans = loans.filter(loan => {
    const matchesStatus = statusParam === "all" || loan.status === statusParam;
    const matchesSearch = searchQuery === "" || 
      loan.borrower.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  return (
    <MainLayout>
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-mortgage-dark">Loan Management</h1>
          <p className="text-gray-600">Monitor and manage loans on the platform</p>
        </div>
        
        <div className="mb-6">
          <Input
            type="text"
            placeholder="Search by loan ID or borrower address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
        
        <Tabs defaultValue={statusParam} onValueChange={handleTabChange}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Loans</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="repaid">Repaid</TabsTrigger>
            <TabsTrigger value="defaulted">Defaulted</TabsTrigger>
          </TabsList>
          
          <TabsContent value={statusParam}>
            {loading ? (
              <div className="text-center py-12">
                <p>Loading loans...</p>
              </div>
            ) : filteredLoans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLoans.map((loan) => (
                  <LoanCard key={loan.id} loan={loan} isAdmin={true} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No loans found in this category.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default AdminLoans;

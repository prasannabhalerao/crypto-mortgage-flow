
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { getAllProperties } from "@/services/propertyService";
import { getAllLoans } from "@/services/loanService";
import { Property, Loan } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

const AdminDashboard: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      toast.error("You do not have permission to access this page");
      return;
    }
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const [propertiesData, loansData] = await Promise.all([
          getAllProperties(),
          getAllLoans()
        ]);
        
        setProperties(propertiesData);
        setLoans(loansData);
      } catch (error) {
        console.error("Error fetching admin dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isAdmin]);

  // Calculate stats
  const pendingProperties = properties.filter(p => p.status === "pending").length;
  const approvedProperties = properties.filter(p => p.status === "approved").length;
  const tokenizedProperties = properties.filter(p => p.status === "tokenized").length;
  
  const pendingLoans = loans.filter(l => l.status === "pending").length;
  const activeLoans = loans.filter(l => l.status === "active").length;
  const totalLoanValue = loans
    .filter(l => ["active", "approved"].includes(l.status))
    .reduce((sum, l) => sum + l.amount, 0);

  return (
    <MainLayout>
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-mortgage-dark">Admin Dashboard</h1>
          <p className="text-gray-600">Manage property approvals and monitor loans</p>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Pending Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingProperties}</div>
              <p className="text-sm text-gray-600">Require review</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Tokenized Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tokenizedProperties}</div>
              <p className="text-sm text-gray-600">Of {properties.length} total</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Pending Loans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingLoans}</div>
              <p className="text-sm text-gray-600">Awaiting approval</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Loan Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalLoanValue)}</div>
              <p className="text-sm text-gray-600">Active loans</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-mortgage-dark mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-blue-50 border-blue-100">
              <CardContent className="p-6">
                <h3 className="font-bold text-blue-800 mb-2">Property Approvals</h3>
                <p className="text-blue-700 mb-4 text-sm">
                  {pendingProperties} properties waiting for your review
                </p>
                <Link to="/admin/properties?status=pending">
                  <Button variant="outline" className="border-blue-500 text-blue-500 hover:bg-blue-50">
                    Review Properties
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="bg-green-50 border-green-100">
              <CardContent className="p-6">
                <h3 className="font-bold text-green-800 mb-2">Loan Monitoring</h3>
                <p className="text-green-700 mb-4 text-sm">
                  {activeLoans} active loans, {pendingLoans} pending approval
                </p>
                <Link to="/admin/loans">
                  <Button variant="outline" className="border-green-500 text-green-500 hover:bg-green-50">
                    Manage Loans
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="bg-purple-50 border-purple-100">
              <CardContent className="p-6">
                <h3 className="font-bold text-purple-800 mb-2">System Overview</h3>
                <p className="text-purple-700 mb-4 text-sm">
                  Check platform statistics and performance
                </p>
                <Button variant="outline" className="border-purple-500 text-purple-500 hover:bg-purple-50">
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-bold text-mortgage-dark mb-4">Recent Activity</h2>
          <Card>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="py-2 px-4 font-semibold">Event</th>
                      <th className="py-2 px-4 font-semibold">User</th>
                      <th className="py-2 px-4 font-semibold">Date</th>
                      <th className="py-2 px-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {properties.slice(0, 5).map((property) => (
                      <tr key={property.id}>
                        <td className="py-2 px-4">Property Registration</td>
                        <td className="py-2 px-4">{property.owner.substring(0, 6)}...{property.owner.substring(property.owner.length - 4)}</td>
                        <td className="py-2 px-4">{new Date(property.createdAt).toLocaleDateString()}</td>
                        <td className="py-2 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            property.status === "tokenized"
                              ? "bg-green-100 text-green-800"
                              : property.status === "approved"
                              ? "bg-blue-100 text-blue-800"
                              : property.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {property.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;

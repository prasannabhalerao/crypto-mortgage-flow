
import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import PropertyCard from "@/components/property/PropertyCard";
import { useAuth } from "@/contexts/AuthContext";
import { getAllProperties } from "@/services/propertyService";
import { Property } from "@/types";
import { toast } from "sonner";

const AdminProperties: React.FC = () => {
  const { isAdmin } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get("status") || "all";

  useEffect(() => {
    if (!isAdmin) {
      toast.error("You do not have permission to access this page");
      return;
    }
    
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const data = await getAllProperties();
        setProperties(data);
      } catch (error) {
        console.error("Error fetching properties:", error);
        toast.error("Failed to load properties");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProperties();
  }, [isAdmin]);

  const handleTabChange = (value: string) => {
    setSearchParams({ status: value });
  };

  const filteredProperties = properties.filter(property => {
    const matchesStatus = statusParam === "all" || property.status === statusParam;
    const matchesSearch = searchQuery === "" || 
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.owner.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  return (
    <MainLayout>
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-mortgage-dark">Property Management</h1>
          <p className="text-gray-600">Review and approve property tokenization requests</p>
        </div>
        
        <div className="mb-6">
          <Input
            type="text"
            placeholder="Search by title, location or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
        
        <Tabs defaultValue={statusParam} onValueChange={handleTabChange}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Properties</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="tokenized">Tokenized</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
          
          <TabsContent value={statusParam}>
            {loading ? (
              <div className="text-center py-12">
                <p>Loading properties...</p>
              </div>
            ) : filteredProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} isAdmin={true} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No properties found in this category.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default AdminProperties;

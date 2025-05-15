
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import PropertyCard from "@/components/property/PropertyCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useWeb3 } from "@/contexts/Web3Context";
import { getPropertiesByOwner } from "@/services/propertyService";
import { Property } from "@/types";

const PropertiesIndex: React.FC = () => {
  const { currentUser } = useAuth();
  const { account, connectWallet } = useWeb3();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const fetchProperties = async () => {
      if (!currentUser?.address) return;
      
      setLoading(true);
      try {
        const data = await getPropertiesByOwner(currentUser.address);
        setProperties(data);
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProperties();
  }, [currentUser]);

  const filteredProperties = activeTab === "all" 
    ? properties 
    : properties.filter(property => property.status === activeTab);

  return (
    <MainLayout>
      <div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-mortgage-dark">My Properties</h1>
            <p className="text-gray-600">Manage your registered properties</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
            {!account && (
              <Button onClick={connectWallet} variant="outline" size="sm">
                Connect Wallet
              </Button>
            )}
            <Link to="/properties/new">
              <Button size="sm" className="bg-mortgage-primary hover:bg-mortgage-accent">
                Register New Property
              </Button>
            </Link>
          </div>
        </div>
        
        <Tabs defaultValue="all" className="mb-6" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="tokenized">Tokenized</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab}>
            {loading ? (
              <div className="text-center py-12">
                <p>Loading properties...</p>
              </div>
            ) : filteredProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No properties found in this category.</p>
                <Link to="/properties/new">
                  <Button className="bg-mortgage-primary hover:bg-mortgage-accent">
                    Register a Property
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default PropertiesIndex;

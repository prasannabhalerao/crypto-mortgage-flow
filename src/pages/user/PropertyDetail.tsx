import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useWeb3 } from "@/contexts/Web3Context";
import { getPropertyById } from "@/services/propertyService";
import { updatePropertyStatus } from "@/services/propertyService";
import { Property } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

const PropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { account, connectWallet, simpleMintToken } = useWeb3();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<{
    checking: boolean;
    message: string | null;
  }>({
    checking: false,
    message: null
  });

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const data = await getPropertyById(id);
        if (data) {
          setProperty(data);
        } else {
          toast.error("Property not found");
          navigate("/properties");
        }
      } catch (error) {
        console.error("Error fetching property:", error);
        toast.error("Error loading property details");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProperty();
  }, [id, navigate]);

  const handleMintToken = async () => {
    if (!property || !account) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    setMinting(true);
    setMintError(null);
    
    try {
      console.log("Starting simplified token minting process for property:", property.id);
      console.log("Current user address:", account);
      
      // Use our simplified minting function that opens MetaMask
      const tokenId = await simpleMintToken(
        property.id,
        property.value,
        account
      );
      
      console.log("Token minted successfully, token ID:", tokenId);
      
      // Update the property with the token ID
      const updatedProperty = await updatePropertyStatus(
        property.id, 
        "tokenized",
        tokenId
      );
      
      setProperty(updatedProperty);
      toast.success(`Property tokenized successfully! Token ID: ${tokenId}`);
      
      // Navigate to the loans page after a short delay
      setTimeout(() => {
        navigate("/loans/new", { state: { tokenId, propertyId: property.id } });
      }, 2000);
      
    } catch (error) {
      console.error("Error minting property token:", error);
      let errorMessage = "Failed to tokenize property";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setMintError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setMinting(false);
    }
  };

  const getStatusColor = (status: Property["status"]) => {
    switch (status) {
      case "tokenized":
        return "bg-mortgage-success text-white";
      case "approved":
        return "bg-blue-500 text-white";
      case "pending":
        return "bg-yellow-500 text-white";
      case "rejected":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const canMintToken = property?.status === "approved" && account;

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p>Loading property details...</p>
        </div>
      </MainLayout>
    );
  }

  if (!property) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-red-500">Property not found</p>
          <Button 
            className="mt-4" 
            onClick={() => navigate("/properties")}
          >
            Back to Properties
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div>
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/properties")}
            className="mb-2"
          >
            ← Back to Properties
          </Button>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <h1 className="text-3xl font-bold text-mortgage-dark">{property?.title}</h1>
            {property && (
              <Badge className={`mt-2 md:mt-0 ${getStatusColor(property.status)}`}>
                {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
              </Badge>
            )}
          </div>
        </div>
        
        {networkStatus.message && (
          <Alert className="mb-6">
            <AlertTitle>Network Connection Issue</AlertTitle>
            <AlertDescription>
              {networkStatus.message}
            </AlertDescription>
          </Alert>
        )}
        
        {mintError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error Minting Token</AlertTitle>
            <AlertDescription>
              {mintError}
              <p className="mt-2 text-sm">
                Please make sure your wallet is connected to the correct network and try again.
              </p>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Property Image */}
          <div className="lg:col-span-1">
            <div className="rounded-lg overflow-hidden shadow-md">
              <img
                src={property?.imageUrl || "/placeholder.svg"}
                alt={property?.title || "Property"}
                className="w-full h-auto object-cover"
              />
            </div>
            
            <div className="mt-6 space-y-4">
              {!account ? (
                <Button 
                  onClick={connectWallet}
                  className="w-full bg-mortgage-primary hover:bg-mortgage-accent"
                >
                  Connect Wallet
                </Button>
              ) : canMintToken ? (
                <Button
                  onClick={handleMintToken}
                  className="w-full bg-mortgage-primary hover:bg-mortgage-accent"
                  disabled={minting}
                >
                  {minting ? "Minting..." : "Mint Property Token"}
                </Button>
              ) : property?.status === "tokenized" ? (
                <Button 
                  className="w-full" 
                  onClick={() => navigate("/loans/new")}
                >
                  Apply for a Loan
                </Button>
              ) : null}
            </div>
          </div>
          
          {/* Property Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h2 className="text-xl font-bold mb-4 text-mortgage-dark">Property Details</h2>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-medium">{property?.location}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Estimated Value</p>
                        <p className="font-medium">{property ? formatCurrency(property.value) : '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Submission Date</p>
                        <p className="font-medium">{property ? formatDate(property.createdAt) : '-'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {property?.status === "tokenized" && property?.tokenId && (
                    <div>
                      <h2 className="text-xl font-bold mb-4 text-mortgage-dark">Token Information</h2>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">Token ID</p>
                          <p className="font-medium text-mortgage-primary">{property.tokenId}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Owner Address</p>
                          <p className="font-medium break-all">{property.owner}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Token Standard</p>
                          <p className="font-medium">ERC-721</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-6">
                  <h3 className="font-bold mb-2 text-mortgage-dark">Description</h3>
                  <p className="text-gray-600">{property?.description}</p>
                </div>
                
                {property?.status === "pending" && (
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <h3 className="font-bold text-yellow-800 mb-2">Pending Review</h3>
                    <p className="text-yellow-700 text-sm">
                      Your property is currently under review by our admin. Once approved, you'll be able to mint a property token.
                    </p>
                  </div>
                )}
                
                {property?.status === "rejected" && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                    <h3 className="font-bold text-red-800 mb-2">Application Rejected</h3>
                    <p className="text-red-700 text-sm">
                      Unfortunately, your property application has been rejected. Please contact support for more information.
                    </p>
                  </div>
                )}
                
                {property?.status === "approved" && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <h3 className="font-bold text-blue-800 mb-2">Ready to Tokenize</h3>
                    <p className="text-blue-700 text-sm">
                      Your property has been approved! Connect your wallet and mint a property token to proceed.
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

export default PropertyDetail;

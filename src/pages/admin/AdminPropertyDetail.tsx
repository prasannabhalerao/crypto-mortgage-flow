
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useWeb3 } from "@/contexts/Web3Context";
import { getPropertyById, updatePropertyStatus } from "@/services/propertyService";
import { mintPropertyToken } from "@/services/blockchainService";
import { Property } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const AdminPropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { account, signer, connectWallet } = useWeb3();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      toast.error("You do not have permission to access this page");
      navigate("/login");
      return;
    }
    
    const fetchProperty = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const data = await getPropertyById(id);
        if (data) {
          setProperty(data);
        } else {
          toast.error("Property not found");
          navigate("/admin/properties");
        }
      } catch (error) {
        console.error("Error fetching property:", error);
        toast.error("Failed to load property details");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProperty();
  }, [id, isAdmin, navigate]);

  const handleApprove = async () => {
    if (!property) return;
    
    setProcessing(true);
    try {
      const updatedProperty = await updatePropertyStatus(property.id, "approved");
      setProperty(updatedProperty);
      toast.success("Property approved successfully");
    } catch (error) {
      console.error("Error approving property:", error);
      toast.error("Failed to approve property");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!property) return;
    
    setProcessing(true);
    try {
      const updatedProperty = await updatePropertyStatus(property.id, "rejected");
      setProperty(updatedProperty);
      toast.success("Property rejected");
    } catch (error) {
      console.error("Error rejecting property:", error);
      toast.error("Failed to reject property");
    } finally {
      setProcessing(false);
    }
  };

  const handleMintToken = async () => {
    if (!property || !signer || !account) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    setProcessing(true);
    setMintError(null);
    
    try {
      console.log("Starting token minting process for property:", property.id);
      console.log("Minting to owner address:", property.owner);
      console.log("Property value:", property.value);
      
      const tokenId = await mintPropertyToken(
        signer,
        property.owner,
        property.id,
        property.value
      );
      
      console.log("Token minted successfully, token ID:", tokenId);
      
      // Update the property status
      const updatedProperty = await updatePropertyStatus(
        property.id, 
        "tokenized",
        tokenId
      );
      
      setProperty(updatedProperty);
      toast.success(`Property tokenized successfully! Token ID: ${tokenId}`);
    } catch (error) {
      console.error("Error minting property token:", error);
      let errorMessage = "Failed to tokenize property";
      
      if (error instanceof Error) {
        errorMessage = `Tokenization failed: ${error.message}`;
      }
      
      setMintError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
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
            onClick={() => navigate("/admin/properties")}
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
            onClick={() => navigate("/admin/properties")}
            className="mb-2"
          >
            ← Back to Properties
          </Button>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <h1 className="text-3xl font-bold text-mortgage-dark">Review Property</h1>
            <Badge className={`mt-2 md:mt-0 ${getStatusColor(property.status)}`}>
              {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
            </Badge>
          </div>
        </div>
        
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
                src={property.imageUrl || "/placeholder.svg"}
                alt={property.title}
                className="w-full h-auto object-cover"
              />
            </div>
            
            <div className="mt-6 space-y-4">
              {property.status === "pending" && (
                <div className="flex gap-4">
                  <Button
                    onClick={handleApprove}
                    className="flex-1 bg-mortgage-primary hover:bg-mortgage-accent"
                    disabled={processing}
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={handleReject}
                    variant="outline"
                    className="flex-1"
                    disabled={processing}
                  >
                    Reject
                  </Button>
                </div>
              )}
              
              {property.status === "approved" && (
                <>
                  {!account ? (
                    <Button 
                      onClick={connectWallet}
                      className="w-full bg-mortgage-primary hover:bg-mortgage-accent"
                    >
                      Connect Wallet to Mint Token
                    </Button>
                  ) : (
                    <Button
                      onClick={handleMintToken}
                      className="w-full bg-mortgage-primary hover:bg-mortgage-accent"
                      disabled={processing}
                    >
                      {processing ? "Minting..." : "Mint Property Token"}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Property Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 text-mortgage-dark">{property.title}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-bold mb-2">Property Details</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-medium">{property.location}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Estimated Value</p>
                        <p className="font-medium">{formatCurrency(property.value)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Submission Date</p>
                        <p className="font-medium">{formatDate(property.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-bold mb-2">Owner Information</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Owner Address</p>
                        <p className="font-medium break-all">{property.owner}</p>
                      </div>
                      {property.tokenId && (
                        <div>
                          <p className="text-sm text-gray-500">Token ID</p>
                          <p className="font-medium text-mortgage-primary">{property.tokenId}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="font-bold mb-2">Description</h3>
                  <p className="text-gray-600">{property.description}</p>
                </div>
                
                {property.status === "tokenized" && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                    <h3 className="font-bold text-green-800 mb-2">Tokenization Completed</h3>
                    <p className="text-green-700 text-sm">
                      This property has been successfully tokenized with Token ID: {property.tokenId}
                    </p>
                  </div>
                )}
                
                {property.status === "rejected" && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                    <h3 className="font-bold text-red-800 mb-2">Rejection Information</h3>
                    <p className="text-red-700 text-sm">
                      This property has been rejected. The owner has been notified.
                    </p>
                  </div>
                )}
                
                {property.status === "approved" && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <h3 className="font-bold text-blue-800 mb-2">Ready for Tokenization</h3>
                    <p className="text-blue-700 text-sm">
                      This property has been approved and is ready for tokenization. Use the mint button to generate an ERC-721 token.
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

export default AdminPropertyDetail;

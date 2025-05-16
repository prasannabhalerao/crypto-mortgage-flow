
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useWeb3 } from "@/contexts/Web3Context";
import { getPropertyById } from "@/services/propertyService";
import { Property } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { mintPropertyToken, checkNetworkConnection, verifyContractConnection } from "@/services/blockchainService";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const PropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { account, signer, provider, connectWallet } = useWeb3();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<{
    checking: boolean;
    isConnected: boolean;
    isCorrectNetwork: boolean;
    message: string | null;
  }>({
    checking: false,
    isConnected: false,
    isCorrectNetwork: false,
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

  const checkNetwork = async () => {
    if (!provider) {
      setNetworkStatus({
        checking: false,
        isConnected: false,
        isCorrectNetwork: false,
        message: "Please connect your wallet"
      });
      return false;
    }
    
    setNetworkStatus(prev => ({ ...prev, checking: true }));
    
    try {
      const result = await checkNetworkConnection(provider);
      
      if (!result.connected) {
        setNetworkStatus({
          checking: false,
          isConnected: false,
          isCorrectNetwork: false,
          message: result.error || "Cannot connect to blockchain network"
        });
        return false;
      }
      
      // For this example, we'll accept local development networks
      const isCorrectNetwork = result.isLocalDev;
      
      setNetworkStatus({
        checking: false,
        isConnected: true,
        isCorrectNetwork,
        message: isCorrectNetwork 
          ? null
          : `Please switch to the local development network. Current network: ${result.networkName} (${result.chainId})`
      });
      
      return isCorrectNetwork;
    } catch (error) {
      console.error("Error checking network:", error);
      setNetworkStatus({
        checking: false,
        isConnected: false,
        isCorrectNetwork: false,
        message: "Error checking network connection"
      });
      return false;
    }
  };
  
  const handleMintToken = async () => {
    if (!property || !signer || !account) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    // Check network before proceeding
    const networkReady = await checkNetwork();
    if (!networkReady) {
      toast.error(networkStatus.message || "Network connection issue");
      return;
    }
    
    setMinting(true);
    setMintError(null);
    
    try {
      console.log("Starting token minting process for property:", property.id);
      console.log("Minting to address:", account);
      console.log("Property value:", property.value);
      
      // Verify contract connection
      const contractCheck = await verifyContractConnection(signer);
      if (!contractCheck.connected) {
        throw new Error(contractCheck.error || "Cannot connect to smart contracts");
      }
      
      console.log("Contract connection verified:", contractCheck);
      
      const tokenId = await mintPropertyToken(
        signer,
        account,
        property.id,
        property.value
      );
      
      console.log("Token minted successfully, token ID:", tokenId);
      
      toast.success(`Property tokenized successfully! Token ID: ${tokenId}`);
      
      // Update the property with the token ID
      setProperty({
        ...property,
        status: "tokenized",
        tokenId
      });
      
      // Navigate to the loans page after a short delay
      setTimeout(() => {
        navigate("/loans/new", { state: { tokenId, propertyId: property.id } });
      }, 3000);
      
    } catch (error) {
      console.error("Error minting property token:", error);
      let errorMessage = "Failed to tokenize property";
      
      if (error instanceof Error) {
        errorMessage = `Tokenization failed: ${error.message}`;
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
            <h1 className="text-3xl font-bold text-mortgage-dark">{property.title}</h1>
            <Badge className={`mt-2 md:mt-0 ${getStatusColor(property.status)}`}>
              {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
            </Badge>
          </div>
        </div>
        
        {networkStatus.message && (
          <Alert variant="warning" className="mb-6">
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
                src={property.imageUrl || "/placeholder.svg"}
                alt={property.title}
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
                  disabled={minting || networkStatus.checking}
                >
                  {minting ? "Minting..." : networkStatus.checking ? "Checking Network..." : "Mint Property Token"}
                </Button>
              ) : property.status === "tokenized" ? (
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
                  
                  {property.status === "tokenized" && property.tokenId && (
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
                  <p className="text-gray-600">{property.description}</p>
                </div>
                
                {property.status === "pending" && (
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <h3 className="font-bold text-yellow-800 mb-2">Pending Review</h3>
                    <p className="text-yellow-700 text-sm">
                      Your property is currently under review by our admin. Once approved, you'll be able to mint a property token.
                    </p>
                  </div>
                )}
                
                {property.status === "rejected" && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                    <h3 className="font-bold text-red-800 mb-2">Application Rejected</h3>
                    <p className="text-red-700 text-sm">
                      Unfortunately, your property application has been rejected. Please contact support for more information.
                    </p>
                  </div>
                )}
                
                {property.status === "approved" && (
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

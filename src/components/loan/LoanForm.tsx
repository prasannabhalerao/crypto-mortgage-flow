import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useWeb3 } from "@/contexts/Web3Context";
import { useAuth } from "@/contexts/AuthContext";
import { createLoanRequest } from "@/services/loanService";
import { getAvailablePropertyValue, getPropertyLoanedAmount } from "@/services/loanService";
import { getUserProperties } from "@/services/propertyService";
import { Property } from "@/types";

const formSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  term: z.coerce.number().int().min(1, "Term must be at least 1 month").max(360, "Term cannot exceed 360 months"),
  interestRate: z.coerce.number().min(0.1, "Interest rate must be at least 0.1%").max(30, "Interest rate cannot exceed 30%"),
  collateralAmount: z.coerce.number().positive("Collateral amount must be positive"),
});

const LoanForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { account, simpleMintToken } = useWeb3();
  
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [availableValue, setAvailableValue] = useState<number>(0);
  const [isCheckingValue, setIsCheckingValue] = useState<boolean>(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyId: "",
      amount: 0,
      term: 12,
      interestRate: 5,
      collateralAmount: 0.1,
    },
  });
  
  const { data: properties, isLoading } = useQuery({
    queryKey: ["userProperties"],
    queryFn: () => getUserProperties(user?.id || ""),
    enabled: !!user?.id,
  });
  
  // Filter only tokenized properties
  const tokenizedProperties = properties?.filter(
    (property) => property.status === "tokenized"
  );
  
  // Update selected property when propertyId changes
  useEffect(() => {
    const propertyId = form.watch("propertyId");
    if (propertyId && properties) {
      const property = properties.find((p) => p.id === propertyId);
      setSelectedProperty(property || null);
      
      // Check available value for this property
      if (property) {
        checkAvailableValue(property.id, property.value);
      }
    } else {
      setSelectedProperty(null);
      setAvailableValue(0);
    }
  }, [form.watch("propertyId"), properties]);
  
  // Check available property value after existing loans
  const checkAvailableValue = async (propertyId: string, propertyValue: number) => {
    setIsCheckingValue(true);
    try {
      // Get available value from API
      const availableVal = await getAvailablePropertyValue(propertyId, propertyValue);
      
      // Also check localStorage for additional loans not yet in the API
      const localStorageAmount = getPropertyLoanedAmount(propertyId);
      
      // Calculate final available value
      const finalAvailableValue = Math.max(availableVal - localStorageAmount, 0);
      setAvailableValue(finalAvailableValue);
      
      // Update form amount if current amount is too high
      const currentAmount = form.getValues("amount");
      if (currentAmount > finalAvailableValue) {
        form.setValue("amount", finalAvailableValue);
      }
    } catch (error) {
      console.error("Error checking available property value:", error);
      toast.error("Failed to check available property value");
    } finally {
      setIsCheckingValue(false);
    }
  };
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!account) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    if (!selectedProperty) {
      toast.error("Please select a property");
      return;
    }
    
    if (values.amount > availableValue) {
      toast.error(`Loan amount exceeds available property value (${availableValue})`);
      return;
    }
    
    try {
      // Create loan request
      const loanRequest = {
        borrower: account,
        propertyId: values.propertyId,
        tokenId: selectedProperty.tokenId || "",
        amount: values.amount,
        interestRate: values.interestRate,
        term: values.term,
        collateralAmount: values.collateralAmount,
        loanToValue: values.amount / selectedProperty.value,
        repaymentSchedule: [],
      };
      
      const loan = await createLoanRequest(loanRequest);
      
      toast.success("Loan application submitted successfully!");
      navigate(`/loans/${loan.id}`);
    } catch (error) {
      console.error("Error creating loan:", error);
      toast.error("Failed to create loan request");
    }
  };
  
  const handleTokenize = async () => {
    if (!selectedProperty || !account) return;
    
    try {
      toast.info("Starting tokenization process...");
      
      const tokenId = await simpleMintToken(
        selectedProperty.id,
        selectedProperty.value,
        account
      );
      
      // Refresh the properties list
      toast.success("Property tokenized successfully!");
      
      // Wait a bit and then navigate to the properties page
      setTimeout(() => {
        navigate("/properties");
      }, 2000);
    } catch (error) {
      console.error("Error tokenizing property:", error);
      toast.error("Failed to tokenize property");
    }
  };
  
  if (isLoading) {
    return <div>Loading properties...</div>;
  }
  
  if (!tokenizedProperties || tokenizedProperties.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">No Tokenized Properties</h2>
            <p className="text-gray-500 mb-4">
              You need to tokenize a property before you can apply for a loan.
            </p>
            <Button onClick={() => navigate("/properties")}>
              Go to Properties
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="propertyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Property</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a tokenized property" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tokenizedProperties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.title} - {property.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {selectedProperty && (
              <div className="p-4 bg-gray-50 rounded-md">
                <h3 className="font-medium mb-2">{selectedProperty.title}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Property Value:</span>
                    <span className="ml-2 font-medium">
                      ${selectedProperty.value.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Available Value:</span>
                    <span className="ml-2 font-medium">
                      ${isCheckingValue ? "Checking..." : availableValue.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Token ID:</span>
                    <span className="ml-2 font-medium">
                      {selectedProperty.tokenId || "Not tokenized"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className="ml-2 font-medium capitalize">
                      {selectedProperty.status}
                    </span>
                  </div>
                </div>
                
                {!selectedProperty.tokenId && (
                  <Button
                    type="button"
                    onClick={handleTokenize}
                    className="mt-4 w-full"
                  >
                    Tokenize Property
                  </Button>
                )}
              </div>
            )}
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Amount ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (isNaN(value)) {
                          field.onChange(0);
                        } else if (value > availableValue) {
                          field.onChange(availableValue);
                          toast.warning(`Maximum available value is $${availableValue.toLocaleString()}`);
                        } else {
                          field.onChange(value);
                        }
                      }}
                      disabled={!selectedProperty || availableValue <= 0}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="term"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Term (months): {field.value}</FormLabel>
                  <FormControl>
                    <Slider
                      defaultValue={[field.value]}
                      min={1}
                      max={360}
                      step={1}
                      onValueChange={(value) => field.onChange(value[0])}
                    />
                  </FormControl>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>1 month</span>
                    <span>30 years (360 months)</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="interestRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interest Rate (%): {field.value}%</FormLabel>
                  <FormControl>
                    <Slider
                      defaultValue={[field.value]}
                      min={0.1}
                      max={30}
                      step={0.1}
                      onValueChange={(value) => field.onChange(value[0])}
                    />
                  </FormControl>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0.1%</span>
                    <span>30%</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="collateralAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Collateral Amount (ETH)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/loans")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selectedProperty || !selectedProperty.tokenId || availableValue <= 0}
              >
                Apply for Loan
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default LoanForm;

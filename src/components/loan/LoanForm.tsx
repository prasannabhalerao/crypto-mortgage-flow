
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Property, Loan } from "@/types";
import { getPropertiesByOwner } from "@/services/propertyService";
import { createLoanRequest } from "@/services/loanService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

const LoanForm: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  
  const [formData, setFormData] = useState({
    propertyId: "",
    amount: "",
    term: "360", // 30 years default
    interestRate: "3.5", // default interest rate
    collateralAmount: "",
  });

  useEffect(() => {
    const fetchProperties = async () => {
      if (!currentUser?.address) return;
      
      setLoading(true);
      try {
        const tokenizedProperties = await getPropertiesByOwner(currentUser.address);
        const eligible = tokenizedProperties.filter(p => p.status === "tokenized");
        setProperties(eligible);
      } catch (error) {
        console.error("Error fetching properties:", error);
        toast.error("Failed to load your tokenized properties");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProperties();
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePropertySelect = (value: string) => {
    setFormData(prev => ({ ...prev, propertyId: value }));
    
    const property = properties.find(p => p.id === value);
    setSelectedProperty(property || null);
    
    // Auto-suggest a loan amount (70% of property value)
    if (property) {
      const suggestedAmount = (property.value * 0.7).toString();
      setFormData(prev => ({ ...prev, amount: suggestedAmount }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProperty || !selectedProperty.tokenId) {
      toast.error("Please select a tokenized property");
      return;
    }
    
    setSubmitting(true);
    
    try {
      const loanRequest: Omit<Loan, "id" | "status" | "startDate"> = {
        borrower: currentUser?.address || "",
        propertyId: selectedProperty.id,
        tokenId: selectedProperty.tokenId,
        amount: parseFloat(formData.amount),
        interestRate: parseFloat(formData.interestRate),
        term: parseInt(formData.term),
        collateralAmount: parseFloat(formData.collateralAmount),
        loanToValue: (parseFloat(formData.amount) / selectedProperty.value) * 100,
        repaymentSchedule: []
      };
      
      await createLoanRequest(loanRequest);
      toast.success("Loan request submitted successfully!");
      navigate("/loans");
    } catch (error) {
      console.error("Error submitting loan request:", error);
      toast.error("Failed to submit loan request");
    } finally {
      setSubmitting(false);
    }
  };

  const calculateMonthlyPayment = () => {
    const principal = parseFloat(formData.amount);
    const interestRate = parseFloat(formData.interestRate) / 100 / 12; // monthly interest rate
    const term = parseInt(formData.term); // months
    
    if (principal && interestRate && term) {
      const payment = (principal * interestRate * Math.pow(1 + interestRate, term)) / (Math.pow(1 + interestRate, term) - 1);
      return payment.toFixed(2);
    }
    return "0.00";
  };

  const monthlyPayment = calculateMonthlyPayment();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Request a Loan</CardTitle>
      </CardHeader>
      <CardContent>
        {properties.length === 0 && !loading ? (
          <div className="text-center py-6">
            <p className="text-gray-600 mb-4">
              You don't have any tokenized properties available for loans.
            </p>
            <Button 
              onClick={() => navigate("/properties")}
              variant="outline"
            >
              View Your Properties
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="propertyId">Select Property</Label>
              <Select
                value={formData.propertyId}
                onValueChange={handlePropertySelect}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a tokenized property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.title} ({formatCurrency(property.value)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedProperty && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Loan Amount (USD)</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    value={formData.amount}
                    onChange={handleChange}
                    min={1}
                    max={selectedProperty.value * 0.8}
                    step="0.01"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Maximum loan amount: {formatCurrency(selectedProperty.value * 0.8)} (80% of property value)
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="term">Loan Term (months)</Label>
                  <Select
                    value={formData.term}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, term: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select loan term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="120">10 years (120 months)</SelectItem>
                      <SelectItem value="180">15 years (180 months)</SelectItem>
                      <SelectItem value="240">20 years (240 months)</SelectItem>
                      <SelectItem value="300">25 years (300 months)</SelectItem>
                      <SelectItem value="360">30 years (360 months)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="interestRate">Interest Rate (%)</Label>
                  <Select
                    value={formData.interestRate}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, interestRate: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select interest rate" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3.0">3.0%</SelectItem>
                      <SelectItem value="3.5">3.5%</SelectItem>
                      <SelectItem value="4.0">4.0%</SelectItem>
                      <SelectItem value="4.5">4.5%</SelectItem>
                      <SelectItem value="5.0">5.0%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="collateralAmount">Additional Collateral Amount (ETH)</Label>
                  <Input
                    id="collateralAmount"
                    name="collateralAmount"
                    type="number"
                    value={formData.collateralAmount}
                    onChange={handleChange}
                    min={0.01}
                    step="0.01"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    This ETH amount will be locked in the loan contract as additional collateral
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Loan Summary</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Property Value:</div>
                    <div className="font-medium">{formatCurrency(selectedProperty.value)}</div>
                    
                    <div>Loan Amount:</div>
                    <div className="font-medium">{formatCurrency(parseFloat(formData.amount || "0"))}</div>
                    
                    <div>Loan-to-Value (LTV):</div>
                    <div className="font-medium">
                      {formData.amount ? ((parseFloat(formData.amount) / selectedProperty.value) * 100).toFixed(1) : "0"}%
                    </div>
                    
                    <div>Term:</div>
                    <div className="font-medium">{parseInt(formData.term) / 12} years</div>
                    
                    <div>Interest Rate:</div>
                    <div className="font-medium">{formData.interestRate}%</div>
                    
                    <div>Monthly Payment:</div>
                    <div className="font-medium">{formatCurrency(parseFloat(monthlyPayment))}</div>
                    
                    <div>Additional Collateral:</div>
                    <div className="font-medium">{formData.collateralAmount} ETH</div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="bg-mortgage-primary hover:bg-mortgage-accent"
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Request Loan"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/loans")}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default LoanForm;

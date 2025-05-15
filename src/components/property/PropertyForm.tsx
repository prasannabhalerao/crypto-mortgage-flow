
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { addProperty } from "@/services/propertyService";
import { toast } from "sonner";

const PropertyForm: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    value: "",
    imageUrl: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser?.address) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    setLoading(true);
    
    try {
      const property = await addProperty({
        title: formData.title,
        description: formData.description,
        location: formData.location,
        value: parseFloat(formData.value),
        imageUrl: formData.imageUrl || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop",
        owner: currentUser.address,
      });
      
      toast.success("Property submitted for review!");
      navigate("/properties");
    } catch (error) {
      console.error("Error adding property:", error);
      toast.error("Failed to submit property.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Register a New Property</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="title">Property Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Luxury Apartment in Downtown"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your property..."
              rows={4}
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., 123 Main St, New York, NY"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="value">Estimated Value (USD)</Label>
            <Input
              id="value"
              name="value"
              type="number"
              min="1"
              step="0.01"
              value={formData.value}
              onChange={handleChange}
              placeholder="e.g., 500000"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="imageUrl">Image URL (Optional)</Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          
          <div className="flex gap-4">
            <Button
              type="submit"
              className="bg-mortgage-primary hover:bg-mortgage-accent"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit for Review"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/properties")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PropertyForm;

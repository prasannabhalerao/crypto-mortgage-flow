
import React from "react";
import { Link } from "react-router-dom";
import { Property } from "@/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface PropertyCardProps {
  property: Property;
  isAdmin?: boolean;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, isAdmin = false }) => {
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

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="relative h-48 overflow-hidden">
        <img
          src={property.imageUrl || "/placeholder.svg"}
          alt={property.title}
          className="w-full h-full object-cover"
        />
        <Badge className={`absolute top-3 right-3 ${getStatusColor(property.status)}`}>
          {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
        </Badge>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl truncate">{property.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-gray-500 text-sm mb-2">{property.location}</p>
        <p className="font-semibold text-lg mb-1">{formatCurrency(property.value)}</p>
        <p className="text-sm text-gray-600 line-clamp-2">{property.description}</p>
        {property.tokenId && (
          <div className="mt-2 text-sm">
            <span className="font-medium">Token ID: </span>
            <span className="text-mortgage-primary">{property.tokenId}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Link 
          to={isAdmin ? `/admin/properties/${property.id}` : `/properties/${property.id}`} 
          className="w-full"
        >
          <Button
            variant="outline"
            className="w-full border-mortgage-primary text-mortgage-primary hover:bg-mortgage-primary/10"
          >
            {isAdmin ? "Review Property" : "View Details"}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default PropertyCard;
